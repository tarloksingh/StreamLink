import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { X, PhoneOff, Share2, Copy } from "lucide-react";

export default function LiveStream() {
  const [, params] = useRoute("/live/:streamId");
  const streamId = params?.streamId || "";
  
  // Check if this user is the broadcaster or a viewer
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAirPlayButton, setShowAirPlayButton] = useState(false);
  const [isAirPlayActive, setIsAirPlayActive] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Detect if user is broadcaster or viewer
  useEffect(() => {
    const checkUserRole = () => {
      try {
        // Check if this stream was created by the current user
        const activeStreams = JSON.parse(localStorage.getItem('activeStreams') || '[]');
        const currentStream = activeStreams.find((stream: any) => stream.id === streamId);
        
        if (currentStream) {
          // If stream exists in activeStreams, this user is the broadcaster
          setIsBroadcaster(true);
          console.log('User is broadcaster for stream:', streamId);
        } else {
          // If stream doesn't exist in activeStreams, this user is a viewer
          setIsBroadcaster(false);
          console.log('User is viewer for stream:', streamId);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // Default to broadcaster if there's an error
        setIsBroadcaster(true);
      }
    };

    checkUserRole();
  }, [streamId]);

  // Setup stream only for broadcasters
  useEffect(() => {
    if (!isBroadcaster) return; // Only setup stream for broadcasters
    
    const setupStream = async () => {
      try {
        console.log('Setting up live stream...');
        
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('webkit-airplay', 'allow');
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = false;
          
          // Force play
          await videoRef.current.play();
          setIsBroadcasting(true);
          setShowAirPlayButton(true);
          console.log('Live stream started');
        }
      } catch (error) {
        console.error('Error setting up stream:', error);
      }
    };

    setupStream();

    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
  const endStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsBroadcasting(false);
    
    // Remove stream from active streams
    try {
      const currentStreams = JSON.parse(localStorage.getItem('activeStreams') || '[]');
      const updatedStreams = currentStreams.filter((stream: any) => stream.id !== streamId);
      localStorage.setItem('activeStreams', JSON.stringify(updatedStreams));
    } catch (error) {
      console.error('Error removing stream from active streams:', error);
    }
    
    // Navigate back to home using wouter
    window.location.href = '/StreamLink/';
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  // AirPlay functionality
  const showAirPlayPicker = () => {
    const video = videoRef.current;
    if (video && 'webkitShowPlaybackTargetPicker' in video) {
      console.log('Showing AirPlay picker...');
      
      video.setAttribute('webkit-airplay', 'allow');
      video.setAttribute('playsinline', 'true');
      video.muted = false;
      
      video.play().then(() => {
        setTimeout(() => {
          try {
            (video as any).webkitShowPlaybackTargetPicker();
          } catch (error) {
            console.error('Error showing AirPlay picker:', error);
          }
        }, 500);
      }).catch(console.error);
    }
  };

  // AirPlay detection
  useEffect(() => {
    const video = videoRef.current;
    if (video && 'webkitCurrentPlaybackTargetIsWireless' in video) {
      const handleWirelessChange = () => {
        const isWireless = (video as any).webkitCurrentPlaybackTargetIsWireless;
        setIsAirPlayActive(isWireless);
      };
      
      video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleWirelessChange);
      
      return () => {
        video.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleWirelessChange);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      data-testid="live-stream-container"
    >
      {/* Main video - only show for broadcasters */}
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

      {/* Viewer message when no stream available */}
      {!isBroadcaster && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="mb-4">
              <svg className="h-16 w-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Stream Not Available</h2>
            <p className="text-gray-300 mb-4">The broadcaster may have ended the stream or there's a connection issue.</p>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/StreamLink/'}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Back to Home
            </Button>
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
    </div>
  );
}
