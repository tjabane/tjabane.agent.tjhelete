import type { Request, Response } from "express";

export function pingHandler(_request: Request, response: Response): void {
  response.status(200).json({
    message: "pong",
  });
}
