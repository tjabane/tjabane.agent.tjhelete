import type { ModelToolCall } from "./model-client.js";

export type ConversationMessageRole = "system" | "user" | "assistant" | "tool";

export interface ConversationMessage {
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ModelToolCall[];
}

export type ConversationHistory = readonly ConversationMessage[];
