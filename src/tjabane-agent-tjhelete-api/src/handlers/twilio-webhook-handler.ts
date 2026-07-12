import { Request, Response } from "express";

type TwilioMessageWebhookBody = {
  Body?: string;
  From?: string;
  To?: string;
  MessageSid?: string;
};

export function twilioWebhookHandler(
  request: Request<Record<string, never>, string, TwilioMessageWebhookBody>,
  response: Response,
): void {
  const incomingMessage = {
    body: request.body.Body ?? "",
    from: request.body.From ?? "",
    to: request.body.To ?? "",
    messageSid: request.body.MessageSid ?? "",
  };

  console.log("Received Twilio webhook", incomingMessage);

  response
    .status(200)
    .type("text/xml")
    .send(createMessagingResponse("Agent Tjhelete received your message."));
}

function createMessagingResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
