import type {
  ConversationHistory,
  ConversationMessage,
  ConversationMessageRole,
  ConversationToolCall,
} from "../entities/conversation-history.js";
import type { DatabaseRecord } from "../contracts/database-client.js";
import type { Session } from "../entities/session.js";

export interface SessionMessageRecord {
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ConversationToolCall[];
}

export interface SessionRecord extends DatabaseRecord {
  readonly userId: string;
  readonly history: readonly SessionMessageRecord[];
}

export function mapSessionRecord(record: SessionRecord): Session {
  return {
    id: record.id,
    userId: record.userId,
    history: mapConversationHistoryRecord(record.history),
    ...(record.version === undefined ? {} : { version: record.version }),
  };
}

export function mapSession(session: Session): SessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    history: session.history.map(mapConversationMessage),
    ...(session.version === undefined ? {} : { version: session.version }),
  };
}

function mapConversationHistoryRecord(
  history: readonly SessionMessageRecord[],
): ConversationHistory {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.name === undefined ? {} : { name: message.name }),
    ...(message.toolCallId === undefined ? {} : { toolCallId: message.toolCallId }),
    ...(message.toolCalls === undefined
      ? {}
      : { toolCalls: message.toolCalls.map((toolCall) => ({ ...toolCall })) }),
  }));
}

function mapConversationMessage(message: ConversationMessage): SessionMessageRecord {
  return {
    role: message.role,
    content: message.content,
    ...(message.name === undefined ? {} : { name: message.name }),
    ...(message.toolCallId === undefined ? {} : { toolCallId: message.toolCallId }),
    ...(message.toolCalls === undefined
      ? {}
      : { toolCalls: message.toolCalls.map((toolCall) => ({ ...toolCall })) }),
  };
}
