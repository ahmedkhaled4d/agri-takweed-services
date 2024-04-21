import express from "express";
import { isObjectId } from "../../../helpers";
import {
  Log,
  LogEverything,
  verifyParams,
  whitelistIds
} from "../../../middlewares";
import * as requestController from "../controllers/request.controller";
import gpx from "./gpx.router";
import { isPositiveNumberOrZero } from "../../../utils";

const router = express.Router();

router.get("/", requestController.List);
router.get("/eng/stats", requestController.getMahaseelEngStats);
router.put(
  "/:id/yieldestimate",
  LogEverything,
  verifyParams(["id"], isObjectId),
  requestController.EstimateRequestArray
);
router.get(
  "/:id/yieldestimate/:gpxIndex",
  LogEverything,
  verifyParams(["id"], isObjectId),
  verifyParams(["gpxIndex"], isPositiveNumberOrZero),
  requestController.EstimateRequest
);
router.get("/:id", requestController.One);
router.put(
  "/:id/farm",
  verifyParams(["id"], isObjectId),
  LogEverything,
  requestController.UpdateFarm
);
router.put(
  "/:id",
  verifyParams(["id"], isObjectId),
  LogEverything,
  requestController.Update
);
router.delete(
  "/:id",
  verifyParams(["id"], isObjectId),
  Log,
  whitelistIds(["633c1e486cad52d6edf191cb", "62457677faa929704004b908"]),
  requestController.Delete
);

router.use(gpx);

export default router;
