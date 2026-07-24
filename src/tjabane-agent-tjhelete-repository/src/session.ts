import type { ConversationHistory } from "./conversation-history.js";
import type { IEntity, IRepository } from "./repository.js";

export interface Session extends IEntity {
  readonly userId: string;
  readonly history: ConversationHistory;
}

export interface ISessionRepository extends IRepository<Session> {
  findByUserId(userId: string): Promise<Session | null>;
}
