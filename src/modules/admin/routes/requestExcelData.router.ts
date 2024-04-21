import { Router } from "express";
import { isObjectId } from "../../../helpers";
import { Log, LogEverything, verifyParams } from "../../../middlewares";
import * as Controller from "../controllers/requestExcelData.controller";

const reqExcelDataRouter = Router();

reqExcelDataRouter.get(
  "/template/:cropId",
  verifyParams(["cropId"], isObjectId),
  Controller.generateExcelTemplate
);
reqExcelDataRouter.post(
  "/create",
  LogEverything,
  Controller.createRequestsAndFarms
);
reqExcelDataRouter.post(
  "/bulkupload",
  Log,
  Controller.parseExcelFileAndExtractRequests
);

export default reqExcelDataRouter;
