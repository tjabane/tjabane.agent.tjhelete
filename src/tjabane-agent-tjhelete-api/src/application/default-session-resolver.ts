import { randomUUID } from "node:crypto";
import type { AgentSession, ConversationHistory } from "@tjabane-agent-tjhelete/agent";
import type { SessionResolver, SessionStore } from "../contracts/session-resolution.js";

export class DefaultSessionResolver implements SessionResolver {
  public constructor(
    private readonly sessions: SessionStore,
    private readonly initialHistory: ConversationHistory,
    private readonly createId: () => string = randomUUID,
  ) {}

  public async getOrCreateForUser(userId: string): Promise<AgentSession> {
    const existingSession = await this.sessions.findByUserId(userId);

    if (existingSession !== null) {
      return existingSession;
    }

    const newSession: AgentSession = {
      id: this.createId(),
      userId,
      history: this.initialHistory.map((message) => ({ ...message })),
    };

    if (await this.sessions.create(newSession)) {
      return newSession;
    }

    const concurrentlyCreatedSession = await this.sessions.findByUserId(userId);

    if (concurrentlyCreatedSession === null) {
      throw new Error("The session could not be resolved after a concurrent create.");
    }

    return concurrentlyCreatedSession;
  }
}
