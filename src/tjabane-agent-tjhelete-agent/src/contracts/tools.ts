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
