import express from "express";
import helmet from "helmet";
import { healthRouter } from "./routes/health-route";
import { pingRouter } from "./routes/ping-route";
import { twilioWebhookRouter } from "./routes/twilio-webhook-route";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/health", healthRouter);
  app.use("/ping", pingRouter);
  app.use("/webhooks/twilio", twilioWebhookRouter);

  return app;
}
