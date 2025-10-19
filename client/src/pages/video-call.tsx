import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { AirPlayPrompt } from "@/components/airplay-prompt";
import { CallControls } from "@/components/call-controls";
import { ConnectionStatus } from "@/components/connection-status";
import { WaitingOverlay } from "@/components/waiting-overlay";
import { useWebRTC } from "@/hooks/use-webrtc";
import { Loader2 } from "lucide-react";

export default function VideoCall() {
  const [, params] = useRoute("/call/:callId");
  const callId = params?.callId || "";
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showAirPlayPrompt, setShowAirPlayPrompt] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAirPlayButton, setShowAirPlayButton] = useState(false);
  const [isAirPlayActive, setIsAirPlayActive] = useState(false);

  const {
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
  } = useWebRTC(callId);

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      // Ensure video is configured for AirPlay
      localVideoRef.current.setAttribute('webkit-airplay', 'allow');
      localVideoRef.current.setAttribute('playsinline', 'true');
      console.log('Local video stream set up for AirPlay');
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Ensure video is configured for AirPlay
      remoteVideoRef.current.setAttribute('webkit-airplay', 'allow');
      remoteVideoRef.current.setAttribute('playsinline', 'true');
      console.log('Remote video stream set up for AirPlay');
    }
  }, [remoteStream]);

  // Set up AirPlay detection
  useEffect(() => {
    const video = remoteVideoRef.current || localVideoRef.current;
    if (!video) return;

    // Check if WebKit AirPlay API is available
    if ('WebKitPlaybackTargetAvailabilityEvent' in window) {
      const handleAvailabilityChange = (event: any) => {
        console.log('AirPlay availability changed:', event.availability);
        // Only show AirPlay button if there's video content and AirPlay is available
        const hasVideoContent = localStream || remoteStream;
        setShowAirPlayButton(event.availability === 'available' && !!hasVideoContent);
      };

      const handleWirelessChange = () => {
        const video = remoteVideoRef.current || localVideoRef.current;
        if (video && 'webkitCurrentPlaybackTargetIsWireless' in video) {
          const isWireless = (video as any).webkitCurrentPlaybackTargetIsWireless;
          console.log('AirPlay wireless state changed:', isWireless);
          setIsAirPlayActive(isWireless);
        }
      };

      // Additional AirPlay event handlers
      const handleAirPlayStart = () => {
        console.log('AirPlay started - video streaming to TV');
      };

      const handleAirPlayStop = () => {
        console.log('AirPlay stopped - video streaming back to device');
      };

      video.addEventListener('webkitplaybacktargetavailabilitychanged', handleAvailabilityChange);
      video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleWirelessChange);
      video.addEventListener('webkitbeginfullscreen', handleAirPlayStart);
      video.addEventListener('webkitendfullscreen', handleAirPlayStop);

      // Trigger initial availability check
      setTimeout(() => {
        video.dispatchEvent(new Event('webkitplaybacktargetavailabilitychanged'));
      }, 100);

      return () => {
        video.removeEventListener('webkitplaybacktargetavailabilitychanged', handleAvailabilityChange);
        video.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleWirelessChange);
        video.removeEventListener('webkitbeginfullscreen', handleAirPlayStart);
        video.removeEventListener('webkitendfullscreen', handleAirPlayStop);
      };
    }
  }, [localStream, remoteStream]);

  // Show AirPlay prompt when rear camera is detected
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        // Check if using rear camera (environment facing)
        if (settings.facingMode === 'environment') {
          setShowAirPlayPrompt(true);
        }
      }
    }
  }, [localStream]);

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setShowControls(true);
    const timeout = setTimeout(() => {
      if (hasRemotePeer) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Show controls on interaction
  const handleInteraction = () => {
    resetControlsTimeout();
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [hasRemotePeer]);

  // Request fullscreen and track fullscreen state
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        // For iOS Safari, use video element fullscreen
        const video = remoteVideoRef.current;
        if (video && 'webkitEnterFullscreen' in video) {
          (video as any).webkitEnterFullscreen();
        } 
        // Fall back to standard fullscreen API for desktop
        else {
          const element = containerRef.current;
          if (element && element.requestFullscreen) {
            await element.requestFullscreen();
          }
        }
      } catch (err) {
        console.log("Fullscreen not supported or denied:", err);
      }
    };

    if (hasRemotePeer) {
      enterFullScreen();
    }

    // Listen for fullscreen changes (standard API)
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    // Listen for webkit fullscreen changes (iOS)
    const handleWebkitFullscreenChange = () => {
      const video = remoteVideoRef.current || localVideoRef.current;
      if (video && 'webkitDisplayingFullscreen' in video) {
        setIsFullScreen(!!(video as any).webkitDisplayingFullscreen);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const video = remoteVideoRef.current || localVideoRef.current;
    if (video) {
      video.addEventListener('webkitbeginfullscreen', () => setIsFullScreen(true));
      video.addEventListener('webkitendfullscreen', () => setIsFullScreen(false));
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', () => setIsFullScreen(true));
        video.removeEventListener('webkitendfullscreen', () => setIsFullScreen(false));
      }
    };
  }, [hasRemotePeer]);

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my video call',
          text: 'Join my video call on VideoCall',
          url: url,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleFullScreen = async () => {
    try {
      // For iOS Safari, use video element fullscreen
      const video = remoteVideoRef.current || localVideoRef.current;
      
      // Check if we're on iOS/mobile Safari (video element fullscreen)
      if (video && 'webkitEnterFullscreen' in video) {
        if (!(video as any).webkitDisplayingFullscreen) {
          (video as any).webkitEnterFullscreen();
        } else if ('webkitExitFullscreen' in video) {
          (video as any).webkitExitFullscreen();
        }
      }
      // Fall back to standard fullscreen API for desktop
      else if (!document.fullscreenElement) {
        const element = containerRef.current;
        if (element && element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        console.log('Fullscreen request denied - requires user interaction');
      } else {
        console.error('Failed to toggle fullscreen:', err);
      }
    }
  };

  const showAirPlayPicker = () => {
    // Use the video that's currently displaying the main content
    const video = hasRemotePeer ? remoteVideoRef.current : localVideoRef.current;
    if (video && 'webkitShowPlaybackTargetPicker' in video) {
      console.log('Showing AirPlay picker for video:', video);
      console.log('Video srcObject:', video.srcObject);
      console.log('Video paused:', video.paused);
      console.log('Video readyState:', video.readyState);
      
      // Ensure video is properly configured for AirPlay
      video.setAttribute('webkit-airplay', 'allow');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('preload', 'auto');
      
      // Force video to be recognized as a video source
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        const videoTracks = tracks.filter(track => track.kind === 'video');
        console.log('Video tracks available:', videoTracks.length);
        
        if (videoTracks.length > 0) {
          console.log('Video track details:', {
            label: videoTracks[0].label,
            enabled: videoTracks[0].enabled,
            readyState: videoTracks[0].readyState
          });
        }
      }
      
      // Ensure the video is playing before showing AirPlay picker
      if (video.paused) {
        video.play().then(() => {
          console.log('Video playing, showing AirPlay picker');
          // Wait for video to be ready
          if (video.readyState >= 2) {
            setTimeout(() => {
              (video as any).webkitShowPlaybackTargetPicker();
            }, 200);
          } else {
            video.addEventListener('canplay', () => {
              setTimeout(() => {
                (video as any).webkitShowPlaybackTargetPicker();
              }, 200);
            }, { once: true });
          }
        }).catch((error) => {
          console.error('Failed to play video for AirPlay:', error);
          // Still try to show the picker even if play fails
          console.log('Showing AirPlay picker despite play failure');
          (video as any).webkitShowPlaybackTargetPicker();
        });
      } else {
        console.log('Video already playing, showing AirPlay picker');
        // Wait for video to be ready
        if (video.readyState >= 2) {
          setTimeout(() => {
            (video as any).webkitShowPlaybackTargetPicker();
          }, 200);
        } else {
          video.addEventListener('canplay', () => {
            setTimeout(() => {
              (video as any).webkitShowPlaybackTargetPicker();
            }, 200);
          }, { once: true });
        }
      }
    } else {
      console.warn('AirPlay not available or video element not found');
    }
  };

  if (isConnecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      data-testid="video-call-container"
    >
      {/* Remote video (full screen when connected) */}
      {hasRemotePeer && remoteStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          webkit-airplay="allow"
          controls={false}
          preload="auto"
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="video-remote"
          onError={(e) => console.error("Remote video error:", e)}
          onLoadStart={() => console.log("Remote video loading started")}
          onCanPlay={() => console.log("Remote video can play")}
          onAirPlayChanged={(e) => console.log("AirPlay changed:", e)}
          onPlay={() => console.log("Remote video playing")}
          onPause={() => console.log("Remote video paused")}
          onLoadedMetadata={() => console.log("Remote video metadata loaded")}
          onLoadedData={() => console.log("Remote video data loaded")}
        />
      )}

      {/* Local video (full screen when waiting, small PiP when connected) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        webkit-airplay="allow"
        controls={false}
        preload="auto"
        crossOrigin="anonymous"
        className={
          hasRemotePeer
            ? "absolute bottom-20 right-4 h-32 w-24 rounded-lg object-cover shadow-2xl z-10"
            : "absolute inset-0 h-full w-full object-contain"
        }
        data-testid="video-local"
        onError={(e) => console.error("Local video error:", e)}
        onAirPlayChanged={(e) => console.log("AirPlay changed:", e)}
        onLoadStart={() => console.log("Local video loading started")}
        onCanPlay={() => console.log("Local video can play")}
        onPlay={() => console.log("Local video playing")}
        onPause={() => console.log("Local video paused")}
        onLoadedMetadata={() => console.log("Local video metadata loaded")}
        onLoadedData={() => console.log("Local video data loaded")}
      />

      {/* Waiting overlay */}
      {!hasRemotePeer && <WaitingOverlay onShareLink={shareLink} />}

      {/* AirPlay prompt */}
      {showAirPlayPrompt && (
        <AirPlayPrompt onDismiss={() => setShowAirPlayPrompt(false)} />
      )}

      {/* Connection status */}
      {hasRemotePeer && (
        <ConnectionStatus
          quality={connectionQuality}
          duration={callDuration}
          className={showControls ? "opacity-100" : "opacity-0"}
        />
      )}

      {/* Call controls */}
      <CallControls
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onSwitchCamera={switchCamera}
        onEndCall={endCall}
        onShareLink={shareLink}
        onToggleFullScreen={toggleFullScreen}
        onShowAirPlay={showAirPlayPicker}
        isFullScreen={isFullScreen}
        showAirPlayButton={showAirPlayButton}
        isAirPlayActive={isAirPlayActive}
        hasRemotePeer={hasRemotePeer}
        className={showControls ? "translate-y-0" : "translate-y-full"}
      />
    </div>
  );
}
