import { Router } from "express";
import { healthHandler } from "../handlers/health-handler";

export const healthRouter = Router();

healthRouter.get("/", healthHandler);
