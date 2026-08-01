import { Router, type RequestHandler } from "express";

export function createTwilioWebhookRouter(handler: RequestHandler): Router {
  const router = Router();

  router.post("/", handler);

  return router;
}
