import express from "express";
import * as pointsMapController from "../controllers/pointsMap.controller";

const router = express.Router();

router.post("/", pointsMapController.filterMap);

export default router;
