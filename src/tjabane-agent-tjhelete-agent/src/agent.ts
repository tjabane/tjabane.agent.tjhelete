import type {
  AgentConfig,
  ConversationHistory,
  ConversationMessage,
  ModelClient,
  ModelToolCall,
  ToolExecutionContext,
  ToolRegistry,
} from "./contracts.js";
import { ToolTurnLimitExceededError } from "./errors.js";

export class Agent {
  protected readonly history: ConversationMessage[];

  public constructor(
    existingHistory: ConversationHistory,
    protected readonly modelClient: ModelClient,
    protected readonly toolRegistry: ToolRegistry,
    protected readonly config: AgentConfig,
    protected readonly executionContext: ToolExecutionContext,
  ) {
    validateConfig(config);
    this.history = copyHistory(existingHistory);
  }

  public async sendMessage(message: string): Promise<string> {
    this.history.push({ role: "user", content: message });
    let completedToolTurns = 0;

    while (true) {
      const turn = await this.modelClient.createResponse({
        model: this.config.model,
        history: copyHistory(this.history),
        tools: this.toolRegistry.getDefinitions(),
      });

      this.appendModelTurn(turn.text, turn.toolCalls);

      if (turn.toolCalls.length === 0) {
        return turn.text;
      }

      if (completedToolTurns >= this.config.maxToolTurns) {
        throw new ToolTurnLimitExceededError(this.config.maxToolTurns);
      }

      await this.executeTools(turn.toolCalls);
      completedToolTurns += 1;
    }
  }

  private appendModelTurn(text: string, toolCalls: readonly ModelToolCall[]): void {
    this.history.push({
      role: "assistant",
      content: text,
      ...(toolCalls.length === 0 ? {} : { toolCalls: [...toolCalls] }),
    });
  }

  private async executeTools(toolCalls: readonly ModelToolCall[]): Promise<void> {
    for (const toolCall of toolCalls) {
      const result = await this.toolRegistry.execute(
        toolCall.name,
        this.executionContext,
        toolCall.arguments,
      );

      this.history.push({
        role: "tool",
        content: JSON.stringify(result.data),
        name: toolCall.name,
        toolCallId: toolCall.id,
      });
    }
  }

  public getHistory(): readonly ConversationMessage[] {
    return copyHistory(this.history);
  }
}

export class DefaultAgent extends Agent {}

function copyHistory(history: ConversationHistory): ConversationMessage[] {
  return history.map((message) => ({
    ...message,
    ...(message.toolCalls === undefined
      ? {}
      : { toolCalls: message.toolCalls.map((toolCall) => ({ ...toolCall })) }),
  }));
}

function validateConfig(config: AgentConfig): void {
  if (config.model.trim().length === 0) {
    throw new Error("AgentConfig.model must not be empty.");
  }

  if (!Number.isInteger(config.maxToolTurns) || config.maxToolTurns < 0) {
    throw new Error("AgentConfig.maxToolTurns must be a non-negative integer.");
  }
}
