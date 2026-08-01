import type { Express } from "express";
import { AcknowledgementInboundMessageService } from "../application/acknowledgement-inbound-message-service.js";
import { createApp } from "../app.js";
import type { AppConfig } from "../config/app-config.js";
import { createTwilioWebhookHandler } from "../handlers/twilio-webhook-handler.js";

const acknowledgement = "Agent Tjhelete received your message.";

export interface Application {
  readonly app: Express;
  readonly config: AppConfig;
}

export function createApplication(config: AppConfig): Application {
  const inboundMessages = new AcknowledgementInboundMessageService(acknowledgement);
  const twilioWebhookHandler = createTwilioWebhookHandler(inboundMessages);
  const app = createApp({ twilioWebhookHandler });

  return { app, config };
}
