import type { AgentConfig } from "../contracts/agent.js";
import type { ConversationHistory, ConversationMessage } from "../contracts/conversation.js";
import type { ModelClient, ModelToolCall } from "../contracts/model-client.js";
import type {
  FailedToolResult,
  ToolExecutionContext,
  ToolRegistry,
  ToolResult,
} from "../contracts/tools.js";

const toolLimitFallbackReply =
  "I couldn't complete the request because I reached the tool-use limit. Please try again or narrow your request.";

export class Agent {
  protected readonly history: ConversationMessage[];

  public constructor(
    existingHistory: ConversationHistory,
    protected readonly modelClient: ModelClient,
    protected readonly toolRegistry: ToolRegistry,
    protected readonly config: AgentConfig,
    protected readonly executionContext: ToolExecutionContext,
  ) {
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
        this.appendToolLimitResults(turn.toolCalls);
        return this.createFinalReplyWithoutTools();
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
      let result: ToolResult;

      try {
        result = await this.toolRegistry.execute(
          toolCall.name,
          this.executionContext,
          toolCall.arguments,
        );
      } catch {
        result = {
          ok: false,
          error: {
            code: "tool_execution_failed",
            message: "The tool could not be executed because of an unexpected internal failure.",
            retryable: true,
          },
        };
      }

      this.history.push({
        role: "tool",
        content: JSON.stringify(result),
        name: toolCall.name,
        toolCallId: toolCall.id,
      });
    }
  }

  private appendToolLimitResults(toolCalls: readonly ModelToolCall[]): void {
    const result: FailedToolResult = {
      ok: false,
      error: {
        code: "tool_turn_limit_reached",
        message:
          "No more tools can be executed for this response because the tool-use limit was reached.",
        retryable: false,
      },
    };

    for (const toolCall of toolCalls) {
      this.history.push({
        role: "tool",
        content: JSON.stringify(result),
        name: toolCall.name,
        toolCallId: toolCall.id,
      });
    }
  }

  private async createFinalReplyWithoutTools(): Promise<string> {
    try {
      const turn = await this.modelClient.createResponse({
        model: this.config.model,
        history: copyHistory(this.history),
        tools: [],
      });
      const reply = turn.text.trim().length === 0 ? toolLimitFallbackReply : turn.text;
      this.appendModelTurn(reply, []);
      return reply;
    } catch {
      this.appendModelTurn(toolLimitFallbackReply, []);
      return toolLimitFallbackReply;
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
