import type { ConversationOrchestrator } from "@tjabane-agent-tjhelete/agent";
import type { InboundMessage, InboundMessageService } from "../contracts/inbound-message.js";
import type { InboundMessageRepository } from "../contracts/inbound-message-repository.js";
import type { UserIdentityResolver } from "../contracts/identity.js";
import type { SessionResolver } from "../contracts/session-resolution.js";
import { ForbiddenSenderError } from "../errors/forbidden-sender-error.js";
import { KeyedMutex } from "./keyed-mutex.js";

const processingReply = "Your previous message is still being processed. Please try again shortly.";

export class DefaultInboundMessageService implements InboundMessageService {
  public constructor(
    private readonly inboundMessages: InboundMessageRepository,
    private readonly identities: UserIdentityResolver,
    private readonly sessions: SessionResolver,
    private readonly orchestrator: ConversationOrchestrator,
    private readonly mutex: KeyedMutex = new KeyedMutex(),
  ) {}

  public async handle(message: InboundMessage): Promise<string> {
    const claim = await this.inboundMessages.begin(message.providerMessageId);

    if (claim.status === "completed") {
      return claim.reply;
    }

    if (claim.status === "processing") {
      return processingReply;
    }

    try {
      const userId = await this.identities.resolve(message.channel, message.externalSenderId);

      if (userId === null) {
        throw new ForbiddenSenderError();
      }

      const reply = await this.mutex.run(userId, async () => {
        const session = await this.sessions.getOrCreateForUser(userId);
        return this.orchestrator.sendMessage(session.id, message.text);
      });

      await this.inboundMessages.complete(message.providerMessageId, reply);
      return reply;
    } catch (error) {
      try {
        await this.inboundMessages.fail(message.providerMessageId);
      } catch {
        // Preserving the original application failure is more useful than a cleanup failure.
      }

      throw error;
    }
  }
}
