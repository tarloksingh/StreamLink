import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Video, Plus, Eye } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  thumbnail?: string;
}

export default function Home() {
  const [, setLocation] = useLocation();

  // For now, we'll use a simple approach without backend
  const [liveStreams] = useState<LiveStream[]>([]);
  const [isLoading] = useState(false);

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating live stream...');
      // Generate a simple stream ID
      const streamId = Math.random().toString(36).substring(7);
      console.log('Generated stream ID:', streamId);
      return { streamId };
    },
    onSuccess: (data) => {
      console.log('Stream created successfully, navigating to:', `/live/${data.streamId}`);
      setLocation(`/live/${data.streamId}`);
    },
    onError: (error) => {
      console.error('Error creating stream:', error);
    },
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              LiveStream
            </h1>
            <p className="text-sm font-medium text-primary">
              Version 4 - Live Streaming Platform
            </p>
          </div>
          
          {/* Start Live Button */}
          <Button
            size="lg"
            className="h-12 px-6 rounded-xl text-lg font-medium shadow-lg"
            onClick={() => {
              console.log('Start Live button clicked');
              createStreamMutation.mutate();
            }}
            disabled={createStreamMutation.isPending}
            data-testid="button-start-live"
          >
            {createStreamMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Start Live
              </>
            )}
          </Button>
        </div>

        {/* Live Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : liveStreams.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Live Streams</h3>
              <p className="text-muted-foreground">Be the first to start a live stream!</p>
            </div>
          ) : (
            // Show demo streams for now
            [
              { id: 'demo1', title: 'Demo Stream 1', viewerCount: 12 },
              { id: 'demo2', title: 'Demo Stream 2', viewerCount: 8 },
              { id: 'demo3', title: 'Demo Stream 3', viewerCount: 25 },
            ].map((stream) => (
              <div
                key={stream.id}
                className="bg-card rounded-xl p-6 shadow-lg border border-card-border cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setLocation(`/live/${stream.id}`)}
                data-testid={`live-stream-${stream.id}`}
              >
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{stream.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 mr-1" />
                  {stream.viewerCount} watching
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}