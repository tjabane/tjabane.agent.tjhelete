export type ConversationMessageRole = "system" | "user" | "assistant" | "tool";

export interface ConversationToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: unknown;
}

export interface ConversationMessage {
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ConversationToolCall[];
}

export type ConversationHistory = readonly ConversationMessage[];
