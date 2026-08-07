import type { ConversationHistory } from "./conversation.js";

export interface AgentSession {
  readonly id: string;
  readonly userId: string;
  readonly history: ConversationHistory;
  readonly version?: string;
}

export interface SessionRepository {
  findById(sessionId: string): Promise<AgentSession | null>;
  save(session: AgentSession): Promise<void>;
}
