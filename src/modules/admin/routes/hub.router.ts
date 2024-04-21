import { Router } from "express";
import * as hubController from "../controllers/hub.controller";
import { Log, LogEverything, verifyParams } from "../../../middlewares";
import { isObjectId } from "../../../helpers";

export const hubRouter = Router();

hubRouter.get("/", hubController.List);
hubRouter.get("/list", hubController.GetHubsName);
hubRouter.get("/:id", verifyParams(["id"], isObjectId), hubController.One);
hubRouter.post("/", Log, hubController.Create);
hubRouter.put(
  "/:id",
  LogEverything,
  verifyParams(["id"], isObjectId),
  hubController.Update
);
hubRouter.delete(
  "/:id",
  Log,
  verifyParams(["id"], isObjectId),
  hubController.Delete
);

export default hubRouter;
