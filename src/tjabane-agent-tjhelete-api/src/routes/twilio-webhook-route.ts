import { Router } from "express";
import { twilioWebhookHandler } from "../handlers/twilio-webhook-handler";

export const twilioWebhookRouter = Router();

twilioWebhookRouter.post("/", twilioWebhookHandler);
