import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { healthRouter } from "./routes/health-route";
import { pingRouter } from "./routes/ping-route";
import { createTwilioWebhookRouter } from "./routes/twilio-webhook-route";
import { errorHandler } from "./middleware/error-handler.js";

export interface AppDependencies {
  readonly twilioWebhookHandler: RequestHandler;
  readonly verifyTwilioSignature: RequestHandler;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));

  app.use("/health", healthRouter);
  app.use("/ping", pingRouter);
  app.use(
    "/webhooks/twilio",
    createTwilioWebhookRouter(
      dependencies.twilioWebhookHandler,
      dependencies.verifyTwilioSignature,
    ),
  );

  app.use(errorHandler);

  return app;
}
