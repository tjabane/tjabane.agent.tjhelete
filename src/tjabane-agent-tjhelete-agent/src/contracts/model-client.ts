import type { ConversationHistory } from "./conversation.js";
import type { ToolDefinition } from "./tools.js";

export interface ModelToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: unknown;
}

export interface ModelRequest {
  readonly model: string;
  readonly history: ConversationHistory;
  readonly tools: readonly ToolDefinition[];
}

export interface ModelTurn {
  readonly text: string;
  readonly toolCalls: readonly ModelToolCall[];
}

export interface ModelClient {
  createResponse(input: ModelRequest): Promise<ModelTurn>;
}
