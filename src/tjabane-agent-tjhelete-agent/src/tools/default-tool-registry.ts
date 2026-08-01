import type {
  AgentTool,
  ToolDefinition,
  ToolExecutionContext,
  ToolRegistry,
  ToolResult,
} from "../contracts/tools.js";

export class DefaultToolRegistry implements ToolRegistry {
  private readonly toolsByName: ReadonlyMap<string, AgentTool>;
  private readonly definitions: readonly ToolDefinition[];

  public constructor(tools: readonly AgentTool[]) {
    const toolsByName = new Map<string, AgentTool>();

    for (const tool of tools) {
      const name = tool.definition.name;

      if (toolsByName.has(name)) {
        throw new Error(`Duplicate tool name "${name}".`);
      }

      toolsByName.set(name, tool);
    }

    this.toolsByName = toolsByName;
    this.definitions = tools.map((tool) => tool.definition);
  }

  public getDefinitions(): readonly ToolDefinition[] {
    return this.definitions;
  }

  public async execute(
    toolName: string,
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult> {
    const tool = this.toolsByName.get(toolName);

    if (tool === undefined) {
      return {
        ok: false,
        error: {
          code: "unknown_tool",
          message: `The requested tool "${toolName}" is not available.`,
          retryable: false,
        },
      };
    }

    return tool.execute(context, arguments_);
  }
}
