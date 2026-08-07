import type { InboundMessage, InboundMessageService } from "../contracts/inbound-message.js";

export class AcknowledgementInboundMessageService implements InboundMessageService {
  public constructor(private readonly acknowledgement: string) {}

  public async handle(_message: InboundMessage): Promise<string> {
    return this.acknowledgement;
  }
}
