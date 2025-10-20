import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, PhoneOff, Share2, Copy } from "lucide-react";
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
  
  // WebRTC manager
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

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
          console.log('User is broadcaster for stream:', streamId);
          
          // Start broadcasting
          const stream = await webrtcManagerRef.current!.startBroadcasting(streamId);
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('webkit-airplay', 'allow');
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.muted = false;
            
            await videoRef.current.play();
            setIsBroadcasting(true);
            setShowAirPlayButton(true);
            console.log('Live stream started');
          }
        } else {
          // User is a viewer
          console.log('User is viewer for stream:', streamId);
          
          // NOTE: Without a signaling server, we can't connect to the broadcaster
          // For now, we'll show a message that the stream is not available
          setConnectionState('disconnected');
        }

        // Set up remote stream handler
        webrtcManagerRef.current.setOnRemoteStream((stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.setAttribute('webkit-airplay', 'allow');
            remoteVideoRef.current.setAttribute('playsinline', 'true');
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.play();
            setShowAirPlayButton(true);
            console.log('Remote stream received');
          }
        });

        // Set up connection state handler
        webrtcManagerRef.current.setOnConnectionState((state) => {
          setConnectionState(state);
          console.log('Connection state changed:', state);
        });

      } catch (error) {
        console.error('Error setting up stream:', error);
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
    
    // Remove stream from active streams
    try {
      const currentStreams = JSON.parse(localStorage.getItem('activeStreams') || '[]');
      const updatedStreams = currentStreams.filter((stream: any) => stream.id !== streamId);
      localStorage.setItem('activeStreams', JSON.stringify(updatedStreams));
      console.log('Removed stream from active streams:', streamId);
      
      // Trigger a custom event to notify other tabs
      window.dispatchEvent(new CustomEvent('streamEnded', { detail: { streamId } }));
    } catch (error) {
      console.error('Error removing stream from active streams:', error);
    }
    
    // Navigate back to home
    const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
    window.location.href = basePath;
  };

  // AirPlay functionality
  const showAirPlayPicker = () => {
    const videoElement = mode === 'broadcast' ? videoRef.current : remoteVideoRef.current;
    if (videoElement && 'webkitShowPlaybackTargetPicker' in videoElement) {
      videoElement.play().then(() => {
        setTimeout(() => {
          try {
            (videoElement as any).webkitShowPlaybackTargetPicker();
          } catch (error) {
            console.error('Error showing AirPlay picker:', error);
          }
        }, 500);
      }).catch(console.error);
    } else {
      alert('AirPlay not available or no stream to play.');
    }
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center text-white p-8">
            <div className="mb-4">
              <svg className="h-20 w-20 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Stream Not Available</h2>
            <p className="text-gray-400 mb-4 max-w-md">
              This live streaming app needs a real-time signaling server to connect viewers to broadcasters.
            </p>
            <p className="text-sm text-gray-500">
              The broadcaster is streaming from their device, but the video can't be relayed to viewers without a backend server.
            </p>
          </div>
        </div>
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
    </div>
  );
}
