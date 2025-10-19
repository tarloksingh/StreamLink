import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Video } from "lucide-react";
import type { CreateCallResponse } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();

  const createCallMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calls/create", {});
      return await response.json() as CreateCallResponse;
    },
    onSuccess: (data) => {
      setLocation(`/call/${data.callId}`);
    },
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Video className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            VideoCall
          </h1>
          <div className="space-y-2">
            <p className="text-base text-muted-foreground">
              High-quality video calls with AirPlay support
            </p>
            <p className="text-sm font-medium text-primary">
              Version 2 - One-Way Streaming
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            className="h-16 w-full rounded-xl text-lg font-medium shadow-lg"
            onClick={() => createCallMutation.mutate()}
            disabled={createCallMutation.isPending}
            data-testid="button-create-call"
          >
            {createCallMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Call...
              </>
            ) : (
              <>
                <Video className="mr-2 h-5 w-5" />
                Create Call
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Tap the button to start a video call. Share the link with anyone to connect.
        </p>
      </div>
    </div>
  );
}
