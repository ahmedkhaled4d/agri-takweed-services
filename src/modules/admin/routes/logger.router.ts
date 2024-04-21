import { Router } from "express";
import { Log } from "../../../middlewares";
import { ExpressFunc } from "../../../types";
import * as LoggerController from "../controllers/logger.controller";

export const loggerRouter = Router();

loggerRouter.get("/", LoggerController.List as ExpressFunc);
loggerRouter.get("/:_id", LoggerController.One);
loggerRouter.delete("/", Log, LoggerController.Delete);
loggerRouter.delete("/:_id", Log, LoggerController.Delete);

export default loggerRouter;
