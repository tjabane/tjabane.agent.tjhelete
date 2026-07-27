import { Agent, DefaultAgent } from "./agent.js";
import type {
  AgentConfig,
  ConversationHistory,
  ModelClient,
  ToolExecutionContext,
  ToolRegistry,
} from "./contracts.js";

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
