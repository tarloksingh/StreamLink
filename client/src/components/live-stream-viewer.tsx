import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, PhoneOff, Share2, Copy, Maximize, Minimize, Mic, MicOff, RefreshCw } from "lucide-react";
import { WebRTCManager } from "@/lib/webrtc";

interface LiveStreamViewerProps {
  streamId: string;
  mode: 'broadcast' | 'view' | 'initiator' | 'joiner';
  onBack: () => void;
}

export default function LiveStreamViewer({ streamId, mode, onBack }: LiveStreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Start with rear camera
  
  // WebRTC manager
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  // Add debug log helper
  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize WebRTC manager
  useEffect(() => {
    webrtcManagerRef.current = new WebRTCManager();
    
    return () => {
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.stopStreaming();
      }
    };
  }, []);

  // Setup stream based on mode
  useEffect(() => {
    if (!webrtcManagerRef.current || !streamId) return;

    const setupStream = async () => {
      try {
        const isTwoWayCall = mode === 'initiator' || mode === 'joiner';
        
        if (isTwoWayCall) {
          // TWO-WAY VIDEO CALL - Both participants get camera access
          addDebugLog(`📞 Starting two-way call (${mode})...`);
          
          // Start two-way call with selected camera
          const stream = await webrtcManagerRef.current!.startTwoWayCall(
            streamId, 
            mode === 'initiator',
            facingMode
          );
          addDebugLog(`✅ Got local stream with ${stream.getTracks().length} tracks`);
          
          // Set up LOCAL video (small, in corner)
          if (videoRef.current) {
            addDebugLog('🎥 Setting up LOCAL video...');
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true; // Mute local to avoid echo
            await videoRef.current.play();
            addDebugLog('▶️ Local video playing!');
          }
          
          setIsBroadcasting(true);
          
        } else if (mode === 'broadcast') {
          // ONE-WAY BROADCAST (legacy mode)
          addDebugLog('📡 Starting broadcast...');
          
          const stream = await webrtcManagerRef.current!.startBroadcasting(streamId);
          addDebugLog(`✅ Got stream with ${stream.getTracks().length} tracks`);
          
          if (videoRef.current) {
            addDebugLog('🎥 Setting video source...');
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('webkit-airplay', 'allow');
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.muted = false;
            
            await videoRef.current.play();
            addDebugLog('▶️ Video playing!');
            setIsBroadcasting(true);
          } else {
            addDebugLog('❌ Video element not found!');
          }
        } else {
          // ONE-WAY VIEWER (legacy mode)
          addDebugLog('👀 Joining as viewer...');
          
          if (webrtcManagerRef.current) {
            await webrtcManagerRef.current.startViewing(streamId);
            setConnectionState('connecting');
          }
        }

        // Set up remote stream handler
        if (webrtcManagerRef.current) {
          webrtcManagerRef.current.setOnRemoteStream((stream) => {
            addDebugLog('📺 Remote stream received!');
            setHasRemoteStream(true);
            
            // Use setTimeout to ensure video element is rendered
            setTimeout(() => {
              if (remoteVideoRef.current) {
                addDebugLog('🎥 Setting up remote video element...');
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.setAttribute('webkit-airplay', 'allow');
                remoteVideoRef.current.setAttribute('playsinline', 'false');
                remoteVideoRef.current.muted = false;
                
                remoteVideoRef.current.play().then(() => {
                  addDebugLog('▶️ Remote video playing!');
                }).catch(err => {
                  addDebugLog(`❌ Play error: ${err.message}`);
                  // Try playing without sound as fallback
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.muted = true;
                    remoteVideoRef.current.play().catch(e => {
                      console.error('Failed to play even muted:', e);
                    });
                  }
                });
                console.log('Remote stream set to video element');
              } else {
                addDebugLog('❌ Remote video element not found!');
              }
            }, 200); // Slightly longer delay for stability
          });

          // Set up connection state handler
          webrtcManagerRef.current.setOnConnectionState((state) => {
            setConnectionState(state);
            console.log('Connection state changed:', state);
          });
        }

      } catch (error) {
        console.error('Error setting up stream:', error);
        addDebugLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    setupStream();
  }, [streamId, mode, facingMode]); // Include facingMode but it only changes when user flips camera

  // Handle user interaction
  const handleInteraction = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  // Fullscreen functionality (works on iOS via video element)
  const toggleFullscreen = async () => {
    try {
      // On mobile, use video element's fullscreen API
      const videoElement = (mode === 'initiator' || mode === 'joiner') 
        ? remoteVideoRef.current 
        : (mode === 'view' ? remoteVideoRef.current : videoRef.current);
      
      if (!videoElement) {
        addDebugLog('❌ No video element for fullscreen');
        return;
      }

      // iOS Safari uses webkitEnterFullscreen
      if ('webkitEnterFullscreen' in videoElement) {
        if ((videoElement as any).webkitDisplayingFullscreen) {
          (videoElement as any).webkitExitFullscreen();
          addDebugLog('📺 Exited fullscreen (iOS)');
        } else {
          (videoElement as any).webkitEnterFullscreen();
          addDebugLog('📺 Entered fullscreen (iOS)');
        }
        return;
      }

      // Desktop browsers use container fullscreen
      if (!containerRef.current) return;
      
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullScreen(true);
        addDebugLog('📺 Entered fullscreen');
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
        addDebugLog('📺 Exited fullscreen');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      addDebugLog(`❌ Fullscreen error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle mute/unmute microphone
  const toggleMute = () => {
    if (webrtcManagerRef.current) {
      const localStream = webrtcManagerRef.current.getLocalStream();
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
        addDebugLog(`🎤 Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
      }
    }
  };

  // Flip camera (front/rear)
  const flipCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    addDebugLog(`🔄 Flipping camera to ${newFacingMode === 'user' ? 'front' : 'rear'}...`);

    // Restart the call with new camera
    if (webrtcManagerRef.current) {
      try {
        // Stop current stream
        const localStream = webrtcManagerRef.current.getLocalStream();
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }

        // Get new stream with different camera
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: newFacingMode }
          },
          audio: true
        });

        // Update local video
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Replace tracks in peer connection
        const peerConnection = (webrtcManagerRef.current as any).peerConnection;
        if (peerConnection) {
          const senders = peerConnection.getSenders();
          const videoTrack = newStream.getVideoTracks()[0];
          const videoSender = senders.find((s: any) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(videoTrack);
          }

          const audioTrack = newStream.getAudioTracks()[0];
          const audioSender = senders.find((s: any) => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          }
        }

        // Update the manager's local stream reference
        (webrtcManagerRef.current as any).localStream = newStream;

        addDebugLog(`✅ Camera flipped to ${newFacingMode === 'user' ? 'front' : 'rear'}`);
      } catch (error) {
        console.error('Error flipping camera:', error);
        addDebugLog(`❌ Camera flip error: ${error instanceof Error ? error.message : 'Unknown'}`);
        // Revert facing mode on error
        setFacingMode(facingMode);
      }
    }
  };

  // Share stream/call link
  const shareStream = async () => {
    const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
    const isTwoWayCall = mode === 'initiator' || mode === 'joiner';
    
    // For calls, use 'joiner' mode; for streams, use 'view' mode
    const shareMode = isTwoWayCall ? 'joiner' : 'view';
    const urlParam = isTwoWayCall ? 'call' : 'stream';
    const shareUrl = `${window.location.origin}${basePath}?${urlParam}=${streamId}&mode=${shareMode}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: isTwoWayCall ? 'Join Video Call' : 'Live Stream',
          text: isTwoWayCall ? 'Join my video call!' : 'Check out my live stream!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  // End live stream
  const endStream = async () => {
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.stopStreaming();
    }
    setIsBroadcasting(false);
    
    console.log('Stream ended:', streamId);
    
    // Navigate back to home
    const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
    window.location.href = basePath;
  };


  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      data-testid="live-stream-container"
    >
      {/* TWO-WAY CALL LAYOUT */}
      {(mode === 'initiator' || mode === 'joiner') && (
        <>
          {/* Remote video - MAIN (full screen) */}
          {hasRemoteStream || connectionState === 'connected' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              controls={true}
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover bg-black"
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
              data-testid="video-remote-call"
              onError={(e) => console.error("Remote video error:", e)}
              onPlay={() => console.log("Remote video playing")}
              onPause={() => console.log("Remote video paused")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center text-white p-8">
                <div className="mb-4">
                  <svg className="h-20 w-20 mx-auto text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Waiting for other person...</h2>
                <p className="text-gray-400 mb-4 max-w-md">
                  {connectionState === 'connecting' ? 'Connecting...' : 
                   connectionState === 'failed' ? 'Connection failed.' :
                   'Share the link to start the call'}
                </p>
              </div>
            </div>
          )}
          
          {/* Local video - SMALL (picture-in-picture) */}
          <div className="absolute top-4 right-4 z-30 w-32 h-32 md:w-48 md:h-36 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={true}
              className="w-full h-full object-cover bg-gray-900"
              style={{
                objectFit: 'cover',
              }}
              data-testid="video-local-call"
              onError={(e) => console.error("Local video error:", e)}
              onPlay={() => console.log("Local video playing")}
            />
          </div>
        </>
      )}
      
      {/* Main video - for ONE-WAY broadcaster */}
      {mode === 'broadcast' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          webkit-airplay="allow"
          controls={false}
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
          data-testid="video-live"
          onError={(e) => console.error("Live video error:", e)}
          onPlay={() => console.log("Live video playing")}
          onPause={() => console.log("Live video paused")}
        />
      )}

      {/* Remote video - for ONE-WAY viewer */}
      {mode === 'view' && (
        <>
          {hasRemoteStream || connectionState === 'connected' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              controls={true}
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover bg-black"
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
              data-testid="video-remote"
              onError={(e) => console.error("Remote video error:", e)}
              onPlay={() => console.log("Remote video playing")}
              onPause={() => console.log("Remote video paused")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center text-white p-8">
                <div className="mb-4">
                  <svg className="h-20 w-20 mx-auto text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Connecting to Stream...</h2>
                <p className="text-gray-400 mb-4 max-w-md">
                  {connectionState === 'connecting' ? 'Establishing connection with broadcaster...' : 
                   connectionState === 'failed' ? 'Connection failed. Please check if the stream is still live.' :
                   'Waiting for stream...'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
        data-testid="live-controls"
      >
        <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 pb-safe">
          <div className="flex items-center justify-center gap-4">
            
            {/* Share button - for broadcasters and call initiators */}
            {(mode === 'broadcast' || mode === 'initiator') && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={shareStream}
                data-testid="button-share"
              >
                {linkCopied ? (
                  <Copy className="h-6 w-6" />
                ) : (
                  <Share2 className="h-6 w-6" />
                )}
              </Button>
            )}

            {/* Mute button - for call participants */}
            {(mode === 'initiator' || mode === 'joiner') && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={toggleMute}
                data-testid="button-mute"
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            )}

            {/* Flip camera button - for call participants */}
            {(mode === 'initiator' || mode === 'joiner') && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={flipCamera}
                data-testid="button-flip-camera"
              >
                <RefreshCw className="h-6 w-6" />
              </Button>
            )}

            {/* Fullscreen button - for everyone */}
            {(mode === 'view' || mode === 'broadcast' || mode === 'initiator' || mode === 'joiner') && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={toggleFullscreen}
                data-testid="button-fullscreen"
              >
                {isFullScreen ? (
                  <Minimize className="h-6 w-6" />
                ) : (
                  <Maximize className="h-6 w-6" />
                )}
              </Button>
            )}

            {/* End call/stream button - for broadcasters and call participants */}
            {(mode === 'broadcast' || mode === 'initiator' || mode === 'joiner') && (
              <Button
                size="icon"
                variant="destructive"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={endStream}
                data-testid="button-end-call"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {/* Back button - only for one-way viewers */}
            {mode === 'view' && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={onBack}
                data-testid="button-back"
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {(mode === 'broadcast' || mode === 'initiator' || mode === 'joiner') && isBroadcasting && (
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {(mode === 'initiator' || mode === 'joiner') ? 'IN CALL' : 'LIVE'}
          </div>
        </div>
      )}

      {/* Viewer message (one-way only) */}
      {mode === 'view' && (
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            VIEWING
          </div>
        </div>
      )}

      {/* Connection state indicator */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
          {connectionState}
        </div>
      </div>

      {/* Debug logs overlay */}
      <div className="absolute bottom-20 left-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
        <div className="font-bold mb-1">🐛 Debug Log:</div>
        {debugLogs.length === 0 ? (
          <div className="text-gray-400">Waiting for events...</div>
        ) : (
          debugLogs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
}
