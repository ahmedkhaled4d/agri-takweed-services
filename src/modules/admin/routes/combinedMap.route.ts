import express from "express";
const router = express.Router();
import * as mapController from "../controllers/combinedMap.controller";

router.post("/", mapController.filterMap);

export default router;
