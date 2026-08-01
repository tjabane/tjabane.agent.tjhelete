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

export interface SuccessfulToolResult {
  readonly ok: true;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface FailedToolResult {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
  };
}

export type ToolResult = SuccessfulToolResult | FailedToolResult;

export interface ToolRegistry {
  getDefinitions(): readonly ToolDefinition[];
  execute(
    toolName: string,
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult>;
}
