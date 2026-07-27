import type { AgentFactory } from "./agent-factory.js";
import type { SessionRepository } from "./contracts.js";
import { SessionNotFoundError } from "./errors.js";

export interface ConversationOrchestratorOptions {
  readonly timezone: string;
  readonly now: () => Date;
}

const defaultOptions: ConversationOrchestratorOptions = {
  timezone: "UTC",
  now: () => new Date(),
};

export class ConversationOrchestrator {
  private readonly options: ConversationOrchestratorOptions;

  public constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly agentFactory: AgentFactory,
    options: Partial<ConversationOrchestratorOptions> = {},
  ) {
    this.options = { ...defaultOptions, ...options };
  }

  public async sendMessage(sessionId: string, message: string): Promise<string> {
    const session = await this.sessionRepository.findById(sessionId);

    if (session === null) {
      throw new SessionNotFoundError(sessionId);
    }

    const agent = this.agentFactory.create(session.history, {
      userId: session.userId,
      sessionId: session.id,
      timezone: this.options.timezone,
      now: this.options.now(),
    });
    const reply = await agent.sendMessage(message);

    await this.sessionRepository.save({
      ...session,
      history: agent.getHistory(),
    });

    return reply;
  }
}
