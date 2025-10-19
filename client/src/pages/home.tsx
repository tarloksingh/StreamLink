import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Video, Plus, Eye } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  thumbnail?: string;
}

export default function Home() {
  const [, setLocation] = useLocation();

  // Fetch live streams
  const { data: liveStreams = [], isLoading } = useQuery({
    queryKey: ["live-streams"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/live-streams", {});
      return await response.json() as LiveStream[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/live-streams/create", {});
      return await response.json() as { streamId: string };
    },
    onSuccess: (data) => {
      setLocation(`/live/${data.streamId}`);
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
            onClick={() => createStreamMutation.mutate()}
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
            liveStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-card rounded-xl p-6 shadow-lg border border-card-border cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setLocation(`/live/${stream.id}`)}
                data-testid={`live-stream-${stream.id}`}
              >
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  {stream.thumbnail ? (
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Video className="h-12 w-12 text-muted-foreground" />
                  )}
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