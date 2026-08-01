import type { ConversationHistory } from "./conversation.js";

export interface AgentSession {
  readonly id: string;
  readonly userId: string;
  readonly history: ConversationHistory;
}

export interface SessionRepository {
  findById(sessionId: string): Promise<AgentSession | null>;
  save(session: AgentSession): Promise<void>;
}
