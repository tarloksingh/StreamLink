// Simple WebRTC implementation for live streaming
import { SignalingClient } from './signaling';
import { SIGNALING_URL } from './config';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isBroadcaster: boolean = false;
  private streamId: string = '';
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionState?: (state: string) => void;
  private signalingClient: SignalingClient | null = null;
  private viewerId: string = '';

  constructor() {
    this.setupPeerConnection();
    this.connectToSignalingServer();
  }

  private connectToSignalingServer() {
    console.log('🔌 Connecting to signaling server...');
    this.signalingClient = new SignalingClient(SIGNALING_URL);

    this.signalingClient.onOpen = () => {
      console.log('✅ Connected to signaling server');
      if (this.onConnectionState) {
        this.onConnectionState('connected');
      }
    };

    this.signalingClient.onOffer = async (offer) => {
      console.log('📨 Received offer from broadcaster');
      await this.handleOffer(offer);
    };

    this.signalingClient.onAnswer = async (answer) => {
      console.log('📨 Received answer from viewer');
      await this.handleAnswer(answer);
    };

    this.signalingClient.onIceCandidate = async (candidate) => {
      console.log('📨 Received ICE candidate');
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    };

    this.signalingClient.onViewerJoined = (viewerId) => {
      console.log('👀 Viewer joined:', viewerId);
      this.viewerId = viewerId;
      if (this.isBroadcaster) {
        this.createOfferForViewer(viewerId);
      }
    };

    this.signalingClient.onStreamEnded = (streamId) => {
      console.log('🛑 Stream ended:', streamId);
      if (!this.isBroadcaster && streamId === this.streamId) {
        this.stopStreaming();
      }
    };
  }

  private setupPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN servers for relaying when direct connection fails
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceTransportPolicy: 'all' as RTCIceTransportPolicy // Try all connection types
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingClient) {
        console.log('📤 Sending ICE candidate:', event.candidate.type, event.candidate.protocol);
        this.signalingClient.sendIceCandidate(
          this.streamId,
          event.candidate.toJSON(),
          this.isBroadcaster ? 'viewer' : 'broadcaster'
        );
      } else if (!event.candidate) {
        console.log('✅ ICE candidate gathering complete');
      }
    };
    
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🔌 ICE connection state:', this.peerConnection?.iceConnectionState);
    };
    
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('🔍 ICE gathering state:', this.peerConnection?.iceGatheringState);
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('Connection state:', this.peerConnection.connectionState);
        if (this.onConnectionState) {
          this.onConnectionState(this.peerConnection.connectionState);
        }
      }
    };
  }

  async startBroadcasting(streamId: string): Promise<MediaStream> {
    this.streamId = streamId;
    this.isBroadcaster = true;

    try {
      console.log('🎥 Starting broadcast for stream:', streamId);
      
      // Get user media
      console.log('📸 Requesting camera/microphone access...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost. Current URL must use https:// or be accessed via localhost.');
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: "environment" }
        },
        audio: true
      });
      console.log('✅ Got media stream');

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
          console.log('➕ Added track to peer connection:', track.kind);
        }
      });

      // Wait for signaling connection if needed
      if (this.signalingClient && !this.signalingClient.isConnected()) {
        console.log('⏳ Waiting for signaling server connection...');
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.signalingClient && this.signalingClient.isConnected()) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 5000);
        });
      }

      // Register as broadcaster with signaling server
      if (this.signalingClient && this.signalingClient.isConnected()) {
        console.log('📡 Registering as broadcaster with signaling server...');
        this.signalingClient.registerAsBroadcaster(streamId, `Live Stream ${streamId.substring(0, 4)}`);
      } else {
        console.error('❌ Signaling client not connected, cannot register broadcaster');
      }

      console.log('✅ Broadcasting stream:', streamId);
      return this.localStream;
    } catch (error) {
      console.error('Error starting broadcast:', error);
      throw error;
    }
  }

  private async createOfferForViewer(viewerId: string) {
    try {
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      if (this.signalingClient) {
        this.signalingClient.sendOffer(this.streamId, offer, viewerId);
      }
      console.log('📤 Sent offer to viewer:', viewerId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async startViewing(streamId: string): Promise<void> {
    this.streamId = streamId;
    this.isBroadcaster = false;

    try {
      console.log('👀 Starting to view stream:', streamId);
      
      // Wait for signaling connection if needed
      if (this.signalingClient && !this.signalingClient.isConnected()) {
        console.log('⏳ Waiting for signaling server connection...');
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.signalingClient && this.signalingClient.isConnected()) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 10000);
        });
      }
      
      // Register as viewer with signaling server
      if (this.signalingClient && this.signalingClient.isConnected()) {
        console.log('📡 Registering as viewer with signaling server...');
        this.signalingClient.registerAsViewer(streamId);
      } else {
        console.error('❌ Signaling client not connected, cannot register viewer');
      }
    } catch (error) {
      console.error('Error starting viewing:', error);
      throw error;
    }
  }

  /**
   * Start a two-way video call (both participants send & receive video)
   * @param callId - Unique identifier for the call
   * @param isInitiator - True if this peer initiated the call
   */
  async startTwoWayCall(callId: string, isInitiator: boolean): Promise<MediaStream> {
    this.streamId = callId;
    this.isBroadcaster = isInitiator; // Initiator creates offers

    try {
      console.log(`📞 Starting two-way call: ${callId} (${isInitiator ? 'Initiator' : 'Joiner'})`);
      
      // Get user media (BOTH participants need camera/mic)
      console.log('📸 Requesting camera/microphone access...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost. Current URL must use https:// or be accessed via localhost.');
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: "user" } // Front camera for video calls
        },
        audio: true
      });
      console.log('✅ Got media stream');

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
          console.log('➕ Added track to peer connection:', track.kind);
        }
      });

      // Wait for signaling connection if needed
      if (this.signalingClient && !this.signalingClient.isConnected()) {
        console.log('⏳ Waiting for signaling server connection...');
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.signalingClient && this.signalingClient.isConnected()) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 10000);
        });
      }

      // Register with signaling server based on role
      if (this.signalingClient && this.signalingClient.isConnected()) {
        if (isInitiator) {
          console.log('📡 Registering as call initiator with signaling server...');
          this.signalingClient.registerAsBroadcaster(callId, `Video Call ${callId.substring(0, 4)}`);
        } else {
          console.log('📡 Registering as call joiner with signaling server...');
          this.signalingClient.registerAsViewer(callId);
        }
      } else {
        console.error('❌ Signaling client not connected, cannot register for call');
      }

      console.log('✅ Two-way call started:', callId);
      return this.localStream;
    } catch (error) {
      console.error('Error starting two-way call:', error);
      throw error;
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      if (this.signalingClient) {
        this.signalingClient.sendAnswer(this.streamId, answer);
      }
      console.log('📤 Sent answer to broadcaster');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Set remote description from answer');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnConnectionState(callback: (state: string) => void) {
    this.onConnectionState = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isCurrentlyBroadcasting(): boolean {
    return this.isBroadcaster && this.localStream !== null;
  }

  async stopStreaming(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection();
    }

    if (this.signalingClient) {
      this.signalingClient.close();
    }

    this.isBroadcaster = false;
    this.streamId = '';
  }

  // No longer needed - real stream comes from WebRTC
  simulateRemoteStream(): void {
    // Deprecated - now using real WebRTC connections
    console.warn('simulateRemoteStream is deprecated - using real WebRTC now');
    /*
    if (!this.isBroadcaster) {
      // Create a simple canvas stream for demo
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      
      // Draw a more realistic stream simulation
      let frame = 0;
      const animate = () => {
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${(frame * 2) % 360}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(frame * 2 + 60) % 360}, 70%, 40%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some visual elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LIVE STREAM', canvas.width / 2, canvas.height / 2 - 100);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.fillText(`Stream ID: ${this.streamId}`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(`Viewing as: ${frame}`, canvas.width / 2, canvas.height / 2);
        
        // Add a pulsing dot to simulate live indicator
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + 0.5 * Math.sin(frame * 0.1)})`;
        ctx.beginPath();
        ctx.arc(100, 100, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('LIVE', 100, 105);
        
        frame++;
        requestAnimationFrame(animate);
      };
      animate();

      const stream = canvas.captureStream(30);
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
    }
    */
  }
}
