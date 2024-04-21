import { Router } from "express";
import { isObjectId } from "../../../helpers";
import { verifyParams } from "../../../middlewares";
import { isCode, isNumeric } from "../../../utils";
import * as traceController from "../controllers/reqTrace.controller";

const reqTraceRouter = Router();

reqTraceRouter.get(
  "/:code-:id",
  verifyParams(["code"], isNumeric, isCode),
  verifyParams(["id"], isObjectId),
  traceController.getHistoryItem
);

export default reqTraceRouter;
