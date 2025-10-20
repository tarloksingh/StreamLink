import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, PhoneOff, Share2, Copy, Maximize, Minimize } from "lucide-react";
import { WebRTCManager } from "@/lib/webrtc";

interface LiveStreamViewerProps {
  streamId: string;
  mode: 'broadcast' | 'view';
  onBack: () => void;
}

export default function LiveStreamViewer({ streamId, mode, onBack }: LiveStreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAirPlayButton, setShowAirPlayButton] = useState(false);
  const [isAirPlayActive, setIsAirPlayActive] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  
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
        if (mode === 'broadcast') {
          // User is the broadcaster
          addDebugLog('📡 Starting broadcast...');
          
          // Start broadcasting
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
            setShowAirPlayButton(true);
          } else {
            addDebugLog('❌ Video element not found!');
          }
        } else {
          // User is a viewer
          addDebugLog('👀 Joining as viewer...');
          
          // Start viewing - signaling server will connect us
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
                addDebugLog('🎥 Setting up video element...');
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.setAttribute('webkit-airplay', 'allow');
                remoteVideoRef.current.setAttribute('playsinline', 'true');
                remoteVideoRef.current.muted = false;
                
                remoteVideoRef.current.play().then(() => {
                  addDebugLog('▶️ Remote video playing!');
                }).catch(err => {
                  addDebugLog(`❌ Play error: ${err.message}`);
                });
                setShowAirPlayButton(true);
                console.log('Remote stream set to video element');
              } else {
                addDebugLog('❌ Video element not found!');
              }
            }, 100);
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
  }, [streamId, mode]);

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

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await containerRef.current.requestFullscreen();
        setIsFullScreen(true);
        addDebugLog('📺 Entered fullscreen');
      } else {
        // Exit fullscreen
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

  // Share stream link
  const shareStream = async () => {
    const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
    const streamUrl = `${window.location.origin}${basePath}?stream=${streamId}&mode=view`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Live Stream',
          text: 'Check out my live stream!',
          url: streamUrl,
        });
      } else {
        await navigator.clipboard.writeText(streamUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(streamUrl);
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

  // AirPlay functionality
  const showAirPlayPicker = () => {
    const videoElement = mode === 'broadcast' ? videoRef.current : remoteVideoRef.current;
    
    if (!videoElement) {
      addDebugLog('❌ No video element found');
      return;
    }
    
    if (!videoElement.srcObject) {
      addDebugLog('❌ No video stream attached');
      return;
    }
    
    if (!('webkitShowPlaybackTargetPicker' in videoElement)) {
      addDebugLog('❌ AirPlay not supported on this browser');
      return;
    }
    
    addDebugLog('📺 Opening AirPlay picker...');
    
    // Make sure video is playing first
    videoElement.play().then(() => {
      // Add AirPlay-required attributes
      videoElement.setAttribute('x-webkit-airplay', 'allow');
      videoElement.setAttribute('webkit-playsinline', 'false');
      
      setTimeout(() => {
        try {
          (videoElement as any).webkitShowPlaybackTargetPicker();
          addDebugLog('✅ AirPlay picker opened');
        } catch (error) {
          console.error('Error showing AirPlay picker:', error);
          addDebugLog(`❌ AirPlay error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }, 500);
    }).catch(err => {
      console.error('Error playing video:', err);
      addDebugLog(`❌ Play error: ${err.message}`);
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      data-testid="live-stream-container"
    >
      {/* Main video - for broadcaster */}
      {mode === 'broadcast' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          webkit-airplay="allow"
          controls={false}
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="video-live"
          onError={(e) => console.error("Live video error:", e)}
          onPlay={() => console.log("Live video playing")}
          onPause={() => console.log("Live video paused")}
        />
      )}

      {/* Remote video - for viewer */}
      {mode === 'view' && (
        <>
          {hasRemoteStream || connectionState === 'connected' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline={false}
              muted={false}
              controls={false}
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain bg-black"
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
            
            {/* Share button - only for broadcasters */}
            {mode === 'broadcast' && (
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

            {/* Fullscreen button - for everyone */}
            {(mode === 'view' || mode === 'broadcast') && (
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

            {/* AirPlay button */}
            {showAirPlayButton && (
              <Button
                size="icon"
                variant={isAirPlayActive ? "default" : "secondary"}
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={showAirPlayPicker}
                data-testid="button-airplay"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </Button>
            )}

            {/* End stream button - only for broadcasters */}
            {mode === 'broadcast' && (
              <Button
                size="icon"
                variant="destructive"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={endStream}
                data-testid="button-end-stream"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {/* Back button - only for viewers */}
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
      {mode === 'broadcast' && isBroadcasting && (
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      )}

      {/* Viewer message */}
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
