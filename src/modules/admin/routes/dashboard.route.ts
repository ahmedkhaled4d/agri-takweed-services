import express from "express";
import { isObjectId } from "../../../helpers";
import { verifyParams } from "../../../middlewares";
import { isNumeric } from "../../../utils";
import * as dashboardController from "../controllers/dashboard.controller";
const router = express.Router();

router.get("/counters", dashboardController.Counters);
router.get("/charts", dashboardController.Charts);
router.get("/requestsbystatus", dashboardController.RequestsByStatus);
router.get("/requestsbycrops", dashboardController.RequestsByCrops);
router.get("/postsviews", dashboardController.PostsViews);
router.get(
  "/locations-by-gov/:gov",
  verifyParams(["gov"], isObjectId),
  dashboardController.Locations
);
router.get(
  "/locations-by-crops/:crop",
  verifyParams(["crop"], isObjectId),
  dashboardController.Crops
);
router.get(
  "/locations-by-season/:season",
  verifyParams(["season"], isNumeric),
  dashboardController.LocationsBySeason
);

router.get("/analysis/spark", dashboardController.SparkLine);

export default router;
