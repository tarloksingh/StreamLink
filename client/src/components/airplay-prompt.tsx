import { Button } from "@/components/ui/button";
import { X, Tv } from "lucide-react";

interface AirPlayPromptProps {
  onDismiss: () => void;
}

export function AirPlayPrompt({ onDismiss }: AirPlayPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl p-8 text-center shadow-2xl border border-card-border"
        data-testid="airplay-prompt"
      >
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={onDismiss}
          data-testid="button-dismiss-airplay"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Tv className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-card-foreground">
              Connect to Your TV
            </h2>
            <p className="text-base text-muted-foreground">
              Look for the AirPlay icon in the video controls below. Tap it to select your Apple TV or AirPlay-compatible device.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>For video streaming:</strong> Make sure you're connected to a call and video is playing before using AirPlay.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Alternative:</strong> Swipe down from top-right corner → Screen Mirroring → Select your Apple TV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
