import type { ErrorRequestHandler } from "express";
import { ForbiddenSenderError } from "../errors/forbidden-sender-error.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  if (error instanceof ForbiddenSenderError) {
    response.status(403).json({ message: "Forbidden." });
    return;
  }

  response.status(503).json({
    message: "The service is temporarily unavailable. Please try again later.",
  });
};
