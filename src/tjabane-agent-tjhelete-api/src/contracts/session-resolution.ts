import type { AgentSession } from "@tjabane-agent-tjhelete/agent";

export interface SessionResolver {
  getOrCreateForUser(userId: string): Promise<AgentSession>;
}

export interface SessionStore {
  findByUserId(userId: string): Promise<AgentSession | null>;
  create(session: AgentSession): Promise<boolean>;
}
