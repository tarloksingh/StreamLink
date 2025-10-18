import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import type { SignalingMessage } from "@shared/schema";

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasRemotePeer: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  switchCamera: () => void;
  endCall: () => void;
  connectionQuality: "excellent" | "good" | "poor";
  callDuration: number;
}

export function useWebRTC(callId: string): UseWebRTCReturn {
  const [, setLocation] = useLocation();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [hasRemotePeer, setHasRemotePeer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");
  const [callDuration, setCallDuration] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState<"user" | "environment">("environment");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local media stream with rear camera preference
  const initializeMedia = useCallback(async (facingMode: "user" | "environment" = "environment") => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCurrentFacingMode(facingMode);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      // Fallback to user-facing camera if environment fails
      if (facingMode === "environment") {
        return initializeMedia("user");
      }
      throw error;
    }
  }, []);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback((stream: MediaStream) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      setHasRemotePeer(true);
      
      // Start call duration timer
      if (!durationIntervalRef.current) {
        durationIntervalRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        const message: SignalingMessage = {
          type: "ice-candidate",
          callId,
          payload: event.candidate,
        };
        socketRef.current.send(JSON.stringify(message));
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setHasRemotePeer(false);
      }
    };

    // Monitor connection quality
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          setConnectionQuality("excellent");
          break;
        case "checking":
          setConnectionQuality("good");
          break;
        case "disconnected":
        case "failed":
          setConnectionQuality("poor");
          break;
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callId]);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = async () => {
      console.log("WebSocket connected successfully");
      
      try {
        // Initialize media and peer connection
        const stream = await initializeMedia();
        const pc = initializePeerConnection(stream);
        
        // Join the call
        const joinMessage: SignalingMessage = {
          type: "join",
          callId,
          payload: null,
        };
        ws.send(JSON.stringify(joinMessage));
        
        setIsConnecting(false);
      } catch (error) {
        console.error("Error initializing media/peer connection:", error);
        setIsConnecting(false);
      }
    };

    ws.onmessage = async (event) => {
      const message: SignalingMessage = JSON.parse(event.data);
      const pc = peerConnectionRef.current;
      
      if (!pc) return;

      switch (message.type) {
        case "offer":
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          const answerMessage: SignalingMessage = {
            type: "answer",
            callId,
            payload: answer,
          };
          ws.send(JSON.stringify(answerMessage));
          break;

        case "answer":
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          break;

        case "ice-candidate":
          if (message.payload) {
            await pc.addIceCandidate(new RTCIceCandidate(message.payload));
          }
          break;

        case "join":
          // Another peer joined, create offer
          if (pc.signalingState === "stable") {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            const offerMessage: SignalingMessage = {
              type: "offer",
              callId,
              payload: offer,
            };
            ws.send(JSON.stringify(offerMessage));
          }
          break;

        case "leave":
          setHasRemotePeer(false);
          setRemoteStream(null);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnecting(false);
    };

    return () => {
      ws.close();
    };
  }, [callId, initializeMedia, initializePeerConnection]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || !peerConnectionRef.current) return;

    // Stop current video track
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    videoTrack.stop();

    // Get new camera stream
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: newFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      const updatedStream = new MediaStream([newVideoTrack, audioTrack]);
      setLocalStream(updatedStream);
      localStreamRef.current = updatedStream;
      setCurrentFacingMode(newFacingMode);
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  }, [currentFacingMode]);

  // End call
  const endCall = useCallback(() => {
    // Send leave message
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const leaveMessage: SignalingMessage = {
        type: "leave",
        callId,
        payload: null,
      };
      socketRef.current.send(JSON.stringify(leaveMessage));
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Navigate back to home
    setLocation("/");
  }, [callId, setLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    isConnecting,
    isConnected,
    hasRemotePeer,
    isMuted,
    toggleMute,
    switchCamera,
    endCall,
    connectionQuality,
    callDuration,
  };
}
