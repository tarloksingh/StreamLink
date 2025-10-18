import { type CallSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createCallSession(): Promise<CallSession>;
  getCallSession(id: string): Promise<CallSession | undefined>;
  deleteCallSession(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private callSessions: Map<string, CallSession>;

  constructor() {
    this.callSessions = new Map();
  }

  async createCallSession(): Promise<CallSession> {
    const id = randomUUID();
    const session: CallSession = {
      id,
      createdAt: Date.now(),
    };
    this.callSessions.set(id, session);
    return session;
  }

  async getCallSession(id: string): Promise<CallSession | undefined> {
    return this.callSessions.get(id);
  }

  async deleteCallSession(id: string): Promise<void> {
    this.callSessions.delete(id);
  }
}

export const storage = new MemStorage();
