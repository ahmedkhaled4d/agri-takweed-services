import { Router } from "express";
import { isObjectId } from "../../../helpers/mongodb";
import { Log, LogEverything, verifyParams } from "../../../middlewares";
import { isCode, isNumeric } from "../../../utils";
import * as traceabilityController from "../controllers/requestTraceability.controller";

export const traceabilityRouter = Router();

// GET
traceabilityRouter.get("/", traceabilityController.List); // used in debugging

// req charge
traceabilityRouter.get(
  "/:code/charge",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.getCharge
);

// reports
traceabilityRouter.get(
  "/:code/trace",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.getReqTraceByCode
);

traceabilityRouter.get(
  "/:code/tracetree",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.getReqTraceTreeByCode
);

// stores items
traceabilityRouter.get(
  "/:code/store",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.getAllStoreItems
);

traceabilityRouter.get(
  "/:code/store/:storeId",
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["storeId"], isObjectId),
  traceabilityController.getStoreItems
);

// dists items
traceabilityRouter.get(
  "/:code/dist",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.getAllDistsItems
);

traceabilityRouter.get(
  "/:code/dist/:distId",
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["distId"], isObjectId),
  traceabilityController.getDistItems
);

// used in debugging
traceabilityRouter.get(
  "/:code",
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.One
);

// History
traceabilityRouter.get(
  "/:code/history/:id/cert",
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["id"], isObjectId),
  traceabilityController.getHistoryItemCertificate
);

traceabilityRouter.get(
  "/:code/history/:id",
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["id"], isObjectId),
  traceabilityController.getHistoryItem
);

// POST
// used in debugging
traceabilityRouter.post("/", Log, traceabilityController.Create);

// add charge
traceabilityRouter.post(
  "/:code/charge",
  Log,
  verifyParams(["code"], isCode, isNumeric),
  traceabilityController.postCharge
);

// move charge from req to store
traceabilityRouter.post(
  "/:code/store/:storeId",
  Log,
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["storeId"], isObjectId),
  traceabilityController.commitItemsToStoreHubFromReq
);

// move charge from store to dist
traceabilityRouter.post(
  "/:code/:storeId/distribute/:distrebuteId",
  Log,
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["storeId"], isObjectId),
  verifyParams(["distrebuteId"], isObjectId),
  traceabilityController.commitItemsToDisrebution
);

// move charge from distrebutor to exporter
traceabilityRouter.post(
  "/:code/:distrebuteId/send/:exportId",
  Log,
  verifyParams(["code"], isCode, isNumeric),
  verifyParams(["distrebuteId", "exportId"], isObjectId),
  traceabilityController.commitItemsToExport
);

// PUT
// used in debugging, disabled in prod
traceabilityRouter.put(
  "/:id",
  LogEverything,
  verifyParams(["id"], isObjectId),
  traceabilityController.Update
);

// DELETE
// used in debugging, disabled in prod
traceabilityRouter.delete(
  "/:id",
  Log,
  verifyParams(["id"], isObjectId),
  traceabilityController.Delete
);

export default traceabilityRouter;
