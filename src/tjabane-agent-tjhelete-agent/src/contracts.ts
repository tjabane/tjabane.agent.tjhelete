export type ConversationMessageRole = "system" | "user" | "assistant" | "tool";

export interface ModelToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: unknown;
}

export interface ConversationMessage {
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ModelToolCall[];
}

export type ConversationHistory = readonly ConversationMessage[];

export interface AgentConfig {
  readonly model: string;
  readonly maxToolTurns: number;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
}

export interface ToolExecutionContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly timezone: string;
  readonly now: Date;
}

export interface ToolResult {
  readonly data: Readonly<Record<string, unknown>>;
}

export interface ToolRegistry {
  getDefinitions(): readonly ToolDefinition[];
  execute(
    toolName: string,
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult>;
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

export interface AgentSession {
  readonly id: string;
  readonly userId: string;
  readonly history: ConversationHistory;
}

export interface SessionRepository {
  findById(sessionId: string): Promise<AgentSession | null>;
  save(session: AgentSession): Promise<void>;
}
