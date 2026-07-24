import type { ConversationHistory } from "./conversation-history.js";
import type { IEntity } from "./entity.js";

export interface Session extends IEntity {
  readonly userId: string;
  readonly history: ConversationHistory;
}
