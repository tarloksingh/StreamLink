import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { SignalingMessage, CreateCallResponse } from "@shared/schema";

interface PeerConnection {
  ws: WebSocket;
  callId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API endpoint to create a new call session
  app.post("/api/calls/create", async (req, res) => {
    try {
      const session = await storage.createCallSession();
      const response: CreateCallResponse = {
        callId: session.id,
        callUrl: `${req.protocol}://${req.get("host")}/call/${session.id}`,
      };
      res.json(response);
    } catch (error) {
      console.error("Error creating call:", error);
      res.status(500).json({ error: "Failed to create call" });
    }
  });

  // WebSocket server for signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map of call rooms: callId -> array of peer connections
  const callRooms = new Map<string, PeerConnection[]>();

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection");
    let currentCallId: string | null = null;

    ws.on("message", (data: Buffer) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());
        const { type, callId, payload } = message;

        switch (type) {
          case "join":
            // Join a call room
            currentCallId = callId;
            if (!callRooms.has(callId)) {
              callRooms.set(callId, []);
            }
            const room = callRooms.get(callId)!;
            room.push({ ws, callId });

            console.log(`Peer joined call ${callId}. Room size: ${room.length}`);

            // Notify other peers in the room
            room.forEach((peer) => {
              if (peer.ws !== ws && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: "join",
                  callId,
                  payload: null,
                }));
              }
            });
            break;

          case "offer":
          case "answer":
          case "ice-candidate":
            // Forward signaling messages to other peers in the room
            const targetRoom = callRooms.get(callId);
            if (targetRoom) {
              targetRoom.forEach((peer) => {
                if (peer.ws !== ws && peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(JSON.stringify({
                    type,
                    callId,
                    payload,
                  }));
                }
              });
            }
            break;

          case "leave":
            // Leave the call
            handlePeerLeave(ws, callId);
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      if (currentCallId) {
        handlePeerLeave(ws, currentCallId);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    function handlePeerLeave(peerWs: WebSocket, callId: string) {
      const room = callRooms.get(callId);
      if (room) {
        // Remove peer from room
        const index = room.findIndex((p) => p.ws === peerWs);
        if (index !== -1) {
          room.splice(index, 1);
        }

        console.log(`Peer left call ${callId}. Room size: ${room.length}`);

        // Notify other peers
        room.forEach((peer) => {
          if (peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(JSON.stringify({
              type: "leave",
              callId,
              payload: null,
            }));
          }
        });

        // Clean up empty rooms
        if (room.length === 0) {
          callRooms.delete(callId);
          storage.deleteCallSession(callId);
        }
      }
    }
  });

  return httpServer;
}
