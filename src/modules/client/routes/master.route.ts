import express from "express";
import * as cropController from "../controllers/crop.controller";
import * as locationController from "../controllers/location.controller";
import * as pageController from "../controllers/page.controller";

const router = express.Router();
/**
 * Load Master Locations governorates -> centers -> hamlets
 */
router.get("/locations", locationController.Governorates);
router.get("/locations/:governorateid", locationController.Centers);
router.get("/locations/:governorateid/:centerid", locationController.Hamlets);

/**
 * Load Assets Like Crops .. etc
 */
router.get("/crops", cropController.List);
router.get("/quality", cropController.QualityController);

/**
 * Pages CMS Like privay .. etc
 */
router.get("/page/:name", pageController.PageController);
router.post("/page/:id", pageController.addContent);

export default router;
