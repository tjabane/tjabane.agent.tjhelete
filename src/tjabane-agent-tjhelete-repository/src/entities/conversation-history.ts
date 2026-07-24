export type ConversationMessageRole = "system" | "user" | "assistant" | "tool";

export interface ConversationMessage {
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
}

export type ConversationHistory = readonly ConversationMessage[];
