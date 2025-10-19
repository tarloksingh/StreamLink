import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Video, Plus, Eye } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  thumbnail?: string | null;
}

export default function Home() {
  const [, setLocation] = useLocation();

  // Track active streams in localStorage
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [isLoading] = useState(false);

  // Load active streams from localStorage
  useEffect(() => {
    const loadActiveStreams = () => {
      try {
        const stored = localStorage.getItem('activeStreams');
        if (stored) {
          const streams = JSON.parse(stored);
          setLiveStreams(streams);
        } else {
          // Initialize with empty array
          setLiveStreams([]);
        }
      } catch (error) {
        console.error('Error loading active streams:', error);
        setLiveStreams([]);
      }
    };

    loadActiveStreams();
    
    // Check periodically for updates
    const interval = setInterval(loadActiveStreams, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

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
      
      // Add stream to active streams
      const newStream: LiveStream = {
        id: data.streamId,
        title: `Live Stream ${data.streamId.substring(0, 4)}`,
        viewerCount: 1,
        thumbnail: null
      };
      
      // Update localStorage
      const currentStreams = JSON.parse(localStorage.getItem('activeStreams') || '[]');
      currentStreams.push(newStream);
      localStorage.setItem('activeStreams', JSON.stringify(currentStreams));
      
      // Update local state immediately
      setLiveStreams(currentStreams);
      
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
          ) : (
            // Show real active streams + demo streams for testing
            [
              ...liveStreams,
              // Add some demo streams for testing
              { id: 'demo1', title: 'Demo Stream 1', viewerCount: 12, thumbnail: null },
              { id: 'demo2', title: 'Demo Stream 2', viewerCount: 8, thumbnail: null },
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