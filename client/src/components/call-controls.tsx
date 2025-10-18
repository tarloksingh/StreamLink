import { Button } from "@/components/ui/button";
import { Mic, MicOff, SwitchCamera, PhoneOff, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface CallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  onShareLink: () => void;
  hasRemotePeer: boolean;
  className?: string;
}

export function CallControls({
  isMuted,
  onToggleMute,
  onSwitchCamera,
  onEndCall,
  onShareLink,
  hasRemotePeer,
  className = "",
}: CallControlsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShareLink = async () => {
    await onShareLink();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${className}`}
      data-testid="call-controls"
    >
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 pb-safe">
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <Button
            size="icon"
            variant={isMuted ? "destructive" : "secondary"}
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={onToggleMute}
            data-testid="button-toggle-mute"
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Switch camera button */}
          <Button
            size="icon"
            variant="secondary"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={onSwitchCamera}
            data-testid="button-switch-camera"
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>

          {/* End call button */}
          <Button
            size="icon"
            variant="destructive"
            className="h-16 w-16 rounded-full shadow-lg"
            onClick={onEndCall}
            data-testid="button-end-call"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          {/* Share link button (only when no remote peer) */}
          {!hasRemotePeer && (
            <Button
              size="icon"
              variant="secondary"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={handleShareLink}
              data-testid="button-share-link"
            >
              {linkCopied ? (
                <Check className="h-6 w-6 text-success" />
              ) : (
                <Share2 className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>

        {/* Link copied indicator */}
        {linkCopied && (
          <div className="mt-3 text-center">
            <p className="text-sm text-success font-medium">
              Link copied to clipboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
