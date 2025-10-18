import { Signal, SignalHigh, SignalLow } from "lucide-react";
import { useEffect, useState } from "react";

interface ConnectionStatusProps {
  quality: "excellent" | "good" | "poor";
  duration: number;
  className?: string;
}

export function ConnectionStatus({ quality, duration, className = "" }: ConnectionStatusProps) {
  const [formattedDuration, setFormattedDuration] = useState("00:00");

  useEffect(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    setFormattedDuration(
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  }, [duration]);

  const getQualityIcon = () => {
    switch (quality) {
      case "excellent":
        return <SignalHigh className="h-4 w-4 text-success" />;
      case "good":
        return <Signal className="h-4 w-4 text-primary" />;
      case "poor":
        return <SignalLow className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-30 flex items-center gap-3 rounded-full bg-black/60 backdrop-blur-xl px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity duration-300 border border-white/10 ${className}`}
      data-testid="connection-status"
    >
      {getQualityIcon()}
      <span data-testid="call-duration">{formattedDuration}</span>
    </div>
  );
}
