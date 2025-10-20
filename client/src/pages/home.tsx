import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Video, Plus, Eye } from "lucide-react";
import LiveStreamViewer from "../components/live-stream-viewer";
import { SignalingClient } from "@/lib/signaling";
import { SIGNALING_URL } from "@/lib/config";

interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  thumbnail?: string | null;
}

export default function Home() {
  const [, setLocation] = useLocation();
  
      // Check URL parameters for call mode - re-read on every render
      const urlParams = (() => {
        const params = new URLSearchParams(window.location.search);
        const callParam = params.get('call');
        const modeParam = params.get('mode');
        console.log('URL params:', { call: callParam, mode: modeParam });
        return {
          call: callParam,
          mode: modeParam
        };
      })();

      // Track active calls from signaling server
      const [activeCalls, setActiveCalls] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const signalingClientRef = useRef<SignalingClient | null>(null);

      // Connect to signaling server and get call list
      useEffect(() => {
        console.log('🔌 Connecting to signaling server for call list...');
        const client = new SignalingClient(SIGNALING_URL);
        signalingClientRef.current = client;

        client.onOpen = () => {
          console.log('✅ Home page: Connected to signaling server');
          setIsConnected(true);
          setIsLoading(false);
          // Request call list
          console.log('📋 Home page: Requesting call list...');
          client.getStreamList(); // Will update server later to call this "getCallList"
        };

        client.onClose = () => {
          console.log('🔌 Disconnected from signaling server');
          setIsConnected(false);
        };

        client.onStreamList = (calls) => {
          console.log('📞 Received call list:', calls);
          setActiveCalls(calls);
        };

        // Periodically request call list updates
        const interval = setInterval(() => {
          if (client.isConnected()) {
            client.getStreamList();
          }
        }, 2000);

        return () => {
          clearInterval(interval);
          client.close();
        };
      }, []);

      const createStreamMutation = useMutation({
        mutationFn: async () => {
          console.log('Creating video call...');
          // Generate a simple call ID
          const callId = Math.random().toString(36).substring(7);
          console.log('Generated call ID:', callId);
          return { callId };
        },
        onSuccess: (data) => {
          console.log('Call created successfully, navigating to:', `/call/${data.callId}`);
          
          // Navigate to call page using URL parameters - force page reload
          // The signaling server will handle registering the call
          // First person is the "initiator" who starts their camera immediately
          const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
          window.location.href = `${basePath}?call=${data.callId}&mode=initiator`;
        },
        onError: (error) => {
          console.error('Error creating call:', error);
        },
      });

  // If we're in call mode, show the call viewer
  if (urlParams.call && urlParams.mode) {
    return (
      <LiveStreamViewer 
        streamId={urlParams.call} 
        mode={urlParams.mode as 'broadcast' | 'view' | 'initiator' | 'joiner'}
        onBack={() => {
          const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
          window.location.href = basePath;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                StreamLink
              </h1>
              <p className="text-sm font-medium text-primary">
                Version 5 - Two-Way Video Calling
              </p>
            </div>
            
            {/* Start Call Button */}
            <Button
              size="lg"
              className="h-12 px-6 rounded-xl text-lg font-medium shadow-lg"
              onClick={() => {
                console.log('Start Call button clicked');
                createStreamMutation.mutate();
              }}
              disabled={createStreamMutation.isPending}
              data-testid="button-start-call"
            >
              {createStreamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Start Call
                </>
              )}
            </Button>
        </div>

        {/* Active Calls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            // Show real active calls or explanation
            activeCalls.length === 0 ? (
              <div className="col-span-full text-center py-12 space-y-4">
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Active Calls</h3>
                  <p className="text-muted-foreground mb-4">
                    {isConnected ? 
                      'Start a video call and share the link with someone to join!' :
                      'Connecting to server...'
                    }
                  </p>
                  {isConnected && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-green-200">
                        <strong>✅ Connected to Signaling Server</strong><br />
                        Start a call and invite someone to join for two-way video chat!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              activeCalls.map((call) => (
              <div
                key={call.id}
                className="bg-card rounded-xl p-6 shadow-lg border border-card-border cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => {
                  const basePath = window.location.pathname.includes('/StreamLink/') ? '/StreamLink/' : '/';
                  window.location.href = `${basePath}?call=${call.id}&mode=joiner`;
                }}
                data-testid={`active-call-${call.id}`}
              >
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{call.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 mr-1" />
                  {call.viewerCount} in call
                </div>
              </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}