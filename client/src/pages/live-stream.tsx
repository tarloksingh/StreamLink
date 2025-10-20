import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { X, PhoneOff, Share2, Copy } from "lucide-react";
import { WebRTCManager } from "@/lib/webrtc";

export default function LiveStream() {
  const [, params] = useRoute("/live/:streamId");
  const streamId = params?.streamId || "";
  
  // Check if this user is the broadcaster or a viewer
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  
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

  // Detect if user is broadcaster or viewer and setup stream
  useEffect(() => {
    if (!webrtcManagerRef.current || !streamId) return;

    const setupStream = async () => {
      try {
        // Check if this stream was created by the current user
        const activeStreams = JSON.parse(localStorage.getItem('activeStreams') || '[]');
        const currentStream = activeStreams.find((stream: any) => stream.id === streamId);
        
        if (currentStream) {
          // User is the broadcaster
          setIsBroadcaster(true);
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
          setIsBroadcaster(false);
          console.log('User is viewer for stream:', streamId);
          
          // Start viewing (with demo stream for now)
          await webrtcManagerRef.current.startViewing(streamId);
          
          // Simulate receiving a remote stream
          setTimeout(() => {
            webrtcManagerRef.current!.simulateRemoteStream();
          }, 1000);
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
  }, [streamId]);

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
    const streamUrl = window.location.href;
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
    } catch (error) {
      console.error('Error removing stream from active streams:', error);
    }
    
    // Navigate back to home using wouter
    window.location.href = '/StreamLink/';
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // AirPlay functionality
  const showAirPlayPicker = () => {
    const videoElement = isBroadcaster ? videoRef.current : remoteVideoRef.current;
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
      {isBroadcaster && (
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
      {!isBroadcaster && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          webkit-airplay="allow"
          controls={false}
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="video-remote"
          onError={(e) => console.error("Remote video error:", e)}
          onPlay={() => console.log("Remote video playing")}
          onPause={() => console.log("Remote video paused")}
        />
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
            {isBroadcaster && (
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
            {isBroadcaster && (
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
            {!isBroadcaster && (
              <Button
                size="icon"
                variant="secondary"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={() => window.location.href = '/StreamLink/'}
                data-testid="button-back"
              >
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {isBroadcaster && isBroadcasting && (
        <div className="absolute top-4 left-4 z-30">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      )}

      {/* Viewer message */}
      {!isBroadcaster && (
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