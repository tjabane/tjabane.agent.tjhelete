import { Router } from "express";
import { pingHandler } from "../handlers/ping-handler";

export const pingRouter = Router();

pingRouter.get("/", pingHandler);
