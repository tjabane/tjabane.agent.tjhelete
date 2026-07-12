import { Request, Response } from "express";

export function healthHandler(_request: Request, response: Response): void {
  response.status(200).json({
    status: "ok",
    service: "tjabane-agent-tjhelete-api",
  });
}
