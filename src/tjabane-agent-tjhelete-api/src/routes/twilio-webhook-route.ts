import { Router, type RequestHandler } from "express";

export function createTwilioWebhookRouter(
  handler: RequestHandler,
  verifySignature: RequestHandler,
): Router {
  const router = Router();

  router.post("/", verifySignature, handler);

  return router;
}
