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
  const airplayVideoRef = useRef<HTMLVideoElement>(null);
  
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

  // Set up AirPlay-specific video element
  useEffect(() => {
    if (airplayVideoRef.current) {
      const airplayVideo = airplayVideoRef.current;
      
      // Configure for AirPlay video streaming (not screen mirroring)
      airplayVideo.setAttribute('webkit-airplay', 'allow');
      airplayVideo.setAttribute('playsinline', 'true');
      airplayVideo.setAttribute('controls', 'false');
      airplayVideo.setAttribute('autoplay', 'true');
      airplayVideo.setAttribute('muted', 'false');
      airplayVideo.setAttribute('preload', 'auto');
      
      // Set the stream to the AirPlay video - prioritize local stream for testing
      const activeStream = localStream || remoteStream;
      if (activeStream && airplayVideo.srcObject !== activeStream) {
        airplayVideo.srcObject = activeStream;
        console.log('AirPlay video configured with stream:', activeStream);
        console.log('Stream tracks:', activeStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
        
        // Force the video to play for AirPlay detection
        airplayVideo.play().catch(console.error);
      }
    }
  }, [remoteStream, localStream, hasRemotePeer]);

  // Set up AirPlay detection
  useEffect(() => {
    const video = airplayVideoRef.current;
    if (!video) return;

    // Check if WebKit AirPlay API is available
    if ('WebKitPlaybackTargetAvailabilityEvent' in window) {
      const handleAvailabilityChange = (event: any) => {
        console.log('AirPlay availability changed:', event.availability);
        console.log('Video element for AirPlay:', video);
        console.log('Video srcObject:', video.srcObject);
        console.log('Video paused:', video.paused);
        console.log('Video readyState:', video.readyState);
        
        // Only show AirPlay button if there's video content and AirPlay is available
        const hasVideoContent = localStream || remoteStream;
        const shouldShowButton = event.availability === 'available' && !!hasVideoContent;
        console.log('Should show AirPlay button:', shouldShowButton, { availability: event.availability, hasVideoContent });
        setShowAirPlayButton(shouldShowButton);
      };

      const handleWirelessChange = () => {
        const video = airplayVideoRef.current;
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
        console.log('Triggering initial AirPlay availability check');
        video.dispatchEvent(new Event('webkitplaybacktargetavailabilitychanged'));
        
        // Also manually check availability
        if ('webkitCurrentPlaybackTargetIsWireless' in video) {
          console.log('Current playback target is wireless:', (video as any).webkitCurrentPlaybackTargetIsWireless);
        }
      }, 500);

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
    // Use the dedicated AirPlay video element
    const video = airplayVideoRef.current;
    if (video && 'webkitShowPlaybackTargetPicker' in video) {
      console.log('Showing AirPlay picker for video streaming:', video);
      console.log('Video srcObject:', video.srcObject);
      console.log('Video paused:', video.paused);
      console.log('Video readyState:', video.readyState);
      
      // Ensure the AirPlay video has the current stream
      const activeStream = hasRemotePeer ? remoteStream : localStream;
      if (activeStream && video.srcObject !== activeStream) {
        video.srcObject = activeStream;
        console.log('Updated AirPlay video with current stream');
      }
      
      // Force video to be recognized as a video stream for AirPlay
      video.setAttribute('webkit-airplay', 'allow');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('preload', 'auto');
      video.setAttribute('controls', 'false');
      
      // Ensure video has proper dimensions for AirPlay
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not ready, waiting...');
        video.addEventListener('loadedmetadata', () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          triggerAirPlayPicker(video);
        }, { once: true });
        return;
      }
      
      triggerAirPlayPicker(video);
    } else {
      console.warn('AirPlay not available or video element not found');
    }
  };

  const triggerAirPlayPicker = (video: HTMLVideoElement) => {
    // Ensure the video is playing and ready
    if (video.paused) {
      video.play().then(() => {
        console.log('Video playing, showing AirPlay picker');
        showAirPlayPickerInternal(video);
      }).catch((error) => {
        console.error('Failed to play video for AirPlay:', error);
        showAirPlayPickerInternal(video);
      });
    } else {
      console.log('Video already playing, showing AirPlay picker');
      showAirPlayPickerInternal(video);
    }
  };

  const showAirPlayPickerInternal = (video: HTMLVideoElement) => {
    // For proper AirPlay video streaming (not screen mirroring), we need to ensure
    // the video element is recognized as a media source that can be streamed
    console.log('AirPlay video element state:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      srcObject: !!video.srcObject
    });
    
    // Force video to be in a state that AirPlay can recognize for video streaming
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      // Video has proper dimensions, proceed with AirPlay video streaming
      video.currentTime = video.currentTime; // Force a seek to ensure video is active
      
      // Ensure video is playing and ready for AirPlay
      if (video.paused) {
        video.play().catch(console.error);
      }
      
      // Small delay to ensure video is fully ready
      setTimeout(() => {
        try {
          console.log('Calling webkitShowPlaybackTargetPicker for DIRECT VIDEO STREAMING');
          (video as any).webkitShowPlaybackTargetPicker();
        } catch (error) {
          console.error('Error showing AirPlay picker:', error);
        }
      }, 500);
    } else {
      console.warn('Video dimensions not available, AirPlay may not work properly');
      // Still try to show the picker
      setTimeout(() => {
        try {
          (video as any).webkitShowPlaybackTargetPicker();
        } catch (error) {
          console.error('Error showing AirPlay picker:', error);
        }
      }, 500);
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
          poster=""
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="video-remote"
          onError={(e) => console.error("Remote video error:", e)}
          onLoadStart={() => console.log("Remote video loading started")}
          onCanPlay={() => console.log("Remote video can play")}
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
        poster=""
        className={
          hasRemotePeer
            ? "absolute bottom-20 right-4 h-32 w-24 rounded-lg object-cover shadow-2xl z-10"
            : "absolute inset-0 h-full w-full object-contain"
        }
        data-testid="video-local"
        onError={(e) => console.error("Local video error:", e)}
        onLoadStart={() => console.log("Local video loading started")}
        onCanPlay={() => console.log("Local video can play")}
        onPlay={() => console.log("Local video playing")}
        onPause={() => console.log("Local video paused")}
        onLoadedMetadata={() => console.log("Local video metadata loaded")}
        onLoadedData={() => console.log("Local video data loaded")}
      />

      {/* Hidden AirPlay video element for proper video streaming */}
      <video
        ref={airplayVideoRef}
        autoPlay
        playsInline
        muted={false}
        webkit-airplay="allow"
        controls={false}
        preload="auto"
        crossOrigin="anonymous"
        poster=""
        className="hidden"
        data-testid="video-airplay"
        onError={(e) => console.error("AirPlay video error:", e)}
        onLoadStart={() => console.log("AirPlay video loading started")}
        onCanPlay={() => console.log("AirPlay video can play")}
        onPlay={() => console.log("AirPlay video playing")}
        onPause={() => console.log("AirPlay video paused")}
        onLoadedMetadata={() => console.log("AirPlay video metadata loaded")}
        onLoadedData={() => console.log("AirPlay video data loaded")}
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
