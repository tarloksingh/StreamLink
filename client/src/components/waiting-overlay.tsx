import { Button } from "@/components/ui/button";
import { Share2, Copy } from "lucide-react";
import { useState } from "react";

interface WaitingOverlayProps {
  onShareLink: () => void;
}

export function WaitingOverlay({ onShareLink }: WaitingOverlayProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = async () => {
    await onShareLink();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-6 p-8 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20" />
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Waiting for other person to join...
          </h2>
          <p className="text-base text-white/80">
            Share the link below to start the call
          </p>
        </div>

        <Button
          size="lg"
          className="h-14 w-full rounded-xl text-lg shadow-lg"
          onClick={handleShare}
          data-testid="button-share-waiting"
        >
          {linkCopied ? (
            <>
              <Copy className="mr-2 h-5 w-5" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-5 w-5" />
              Share Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
