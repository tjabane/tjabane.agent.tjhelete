import type { Request, Response } from "express";
import type { InboundMessageService } from "../contracts/inbound-message.js";

type TwilioMessageWebhookBody = {
  Body?: string;
  From?: string;
  To?: string;
  MessageSid?: string;
};

export function createTwilioWebhookHandler(inboundMessages: InboundMessageService) {
  return async function twilioWebhookHandler(
    request: Request<Record<string, string>, string, TwilioMessageWebhookBody>,
    response: Response,
  ): Promise<void> {
    const reply = await inboundMessages.handle({
      channel: "whatsapp",
      text: request.body.Body ?? "",
      externalSenderId: request.body.From ?? "",
      externalRecipientId: request.body.To ?? "",
      providerMessageId: request.body.MessageSid ?? "",
    });

    response.status(200).json({ message: reply });
  };
}
