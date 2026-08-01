import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { healthRouter } from "./routes/health-route";
import { pingRouter } from "./routes/ping-route";
import { createTwilioWebhookRouter } from "./routes/twilio-webhook-route";

export interface AppDependencies {
  readonly twilioWebhookHandler: RequestHandler;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/health", healthRouter);
  app.use("/ping", pingRouter);
  app.use("/webhooks/twilio", createTwilioWebhookRouter(dependencies.twilioWebhookHandler));

  return app;
}
