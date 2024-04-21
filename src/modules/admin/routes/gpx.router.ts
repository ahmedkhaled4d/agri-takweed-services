import express from "express";
import { Log, LogEverything } from "../../../middlewares";
import * as gpxController from "../controllers/gpx.controller";
import * as gpxViewController from "../controllers/gpxView.controller";
import * as gpxHandlerController from "../controllers/gpxRequestHandle.controller";

const gpxRouter = express.Router();

// Get points
gpxRouter.post("/gpx/view", Log, gpxViewController.ViewGpx); // Add middleware logger to db
// Parse the points from frontend after checking the points
gpxRouter.post("/gpx/parse", LogEverything, gpxViewController.ParseGpxObject); // Add middleware logger to db
// Valdiate the Polygons
gpxRouter.post(
  "/gpx/validate/payload",
  Log,
  gpxHandlerController.validateGpxPayload
); // Add middleware logger to db
// Download file
gpxRouter.post("/gpx/download", Log, gpxHandlerController.generateGpxFile); // Add middleware logger to db
// Add gpx to request
gpxRouter.put(
  "/gpx/v2/:code",
  LogEverything,
  gpxHandlerController.addGpxToRequest
); // Add middleware logger to db

// Left for backwards compatibility
gpxRouter.post("/gpx/:code", Log, gpxController.Gpx); // Add middleware logger to db
gpxRouter.post("/appendgpx/:code", LogEverything, gpxController.appendGPX);
gpxRouter.put("/gpx/:code", LogEverything, gpxController.GpxUpdate);
gpxRouter.put("/gpx/modifydate/:code", LogEverything, gpxController.dateUpdate);

export default gpxRouter;
