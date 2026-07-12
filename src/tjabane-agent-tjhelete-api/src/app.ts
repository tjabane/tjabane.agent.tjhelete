import express from "express";
import helmet from "helmet";
import { healthRouter } from "./routes/health-route";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use("/health", healthRouter);

  return app;
}
