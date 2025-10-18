import { z } from "zod";

export const callSessionSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
});

export const signalingMessageSchema = z.object({
  type: z.enum(['offer', 'answer', 'ice-candidate', 'join', 'leave']),
  callId: z.string(),
  payload: z.any(),
  fromPeerId: z.string().optional(),
});

export type CallSession = z.infer<typeof callSessionSchema>;
export type SignalingMessage = z.infer<typeof signalingMessageSchema>;

export const createCallResponseSchema = z.object({
  callId: z.string(),
  callUrl: z.string(),
});

export type CreateCallResponse = z.infer<typeof createCallResponseSchema>;
