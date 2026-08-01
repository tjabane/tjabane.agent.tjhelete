import { Agent, DefaultAgent } from "./agent.js";
import type { AgentConfig } from "../contracts/agent.js";
import type { ConversationHistory } from "../contracts/conversation.js";
import type { ModelClient } from "../contracts/model-client.js";
import type { ToolExecutionContext, ToolRegistry } from "../contracts/tools.js";

export interface AgentFactory {
  create(history: ConversationHistory, executionContext: ToolExecutionContext): Agent;
}

export class DefaultAgentFactory implements AgentFactory {
  public constructor(
    private readonly modelClient: ModelClient,
    private readonly toolRegistry: ToolRegistry,
    private readonly config: AgentConfig,
  ) {}

  public create(history: ConversationHistory, executionContext: ToolExecutionContext): Agent {
    return new DefaultAgent(
      history,
      this.modelClient,
      this.toolRegistry,
      this.config,
      executionContext,
    );
  }
}
