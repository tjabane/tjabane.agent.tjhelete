import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { InboundMessageService } from "../contracts/inbound-message.js";

type TwilioMessageWebhookBody = {
  Body?: string;
  From?: string;
  To?: string;
  MessageSid?: string;
};

const whatsappAddressPattern = /^whatsapp:\+[1-9]\d{7,14}$/;
const messageSidPattern = /^SM[A-Za-z0-9]{3,64}$/;

export function createTwilioWebhookHandler(inboundMessages: InboundMessageService): RequestHandler {
  return async function twilioWebhookHandler(
    request: Request<Record<string, string>, string, TwilioMessageWebhookBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const message = parseInboundMessage(request.body);

    if (message === null) {
      response.status(400).json({ message: "Invalid Twilio webhook payload." });
      return;
    }

    try {
      const reply = await inboundMessages.handle(message);

      response.status(200).json({ message: reply });
    } catch (error) {
      next(error);
    }
  };
}

function parseInboundMessage(body: TwilioMessageWebhookBody) {
  const text = readRequiredString(body.Body, 4_096);
  const externalSenderId = readRequiredString(body.From, 64);
  const externalRecipientId = readRequiredString(body.To, 64);
  const providerMessageId = readRequiredString(body.MessageSid, 66);

  if (
    text === null ||
    externalSenderId === null ||
    externalRecipientId === null ||
    providerMessageId === null ||
    !whatsappAddressPattern.test(externalSenderId) ||
    !whatsappAddressPattern.test(externalRecipientId) ||
    !messageSidPattern.test(providerMessageId)
  ) {
    return null;
  }

  return {
    channel: "whatsapp" as const,
    text,
    externalSenderId,
    externalRecipientId,
    providerMessageId,
  };
}

function readRequiredString(value: unknown, maximumLength: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximumLength
    ? value
    : null;
}
