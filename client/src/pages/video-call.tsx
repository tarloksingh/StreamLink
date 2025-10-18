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
  
  const [showAirPlayPrompt, setShowAirPlayPrompt] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  // Request fullscreen
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch (err) {
        console.log("Fullscreen not supported or denied");
      }
    };

    if (hasRemotePeer) {
      enterFullScreen();
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
          className="absolute inset-0 h-full w-full object-cover"
          data-testid="video-remote"
        />
      )}

      {/* Local video (full screen when waiting, small PiP when connected) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={
          hasRemotePeer
            ? "absolute bottom-20 right-4 h-32 w-24 rounded-lg object-cover shadow-2xl z-10"
            : "absolute inset-0 h-full w-full object-cover"
        }
        data-testid="video-local"
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
        hasRemotePeer={hasRemotePeer}
        className={showControls ? "translate-y-0" : "translate-y-full"}
      />
    </div>
  );
}
