import express from "express";
import * as reportController from "../controllers/report.controller";

const router = express.Router();

router.post("/general", reportController.printGeneralReport);
router.post("/visits", reportController.printVisitsReport);
router.post("/points", reportController.printPointsReport);
router.post("/intersection", reportController.printIntersectionReport);
router.post("/plots", reportController.printPlotReport);
router.post("/geoplots", reportController.getAllGeoPlots);
router.post("/trace/general", reportController.requestTraceabilityGeneral);
router.post("/excelInfo", reportController.excelDataAllReport);
router.get("/counters/season", reportController.NumbersBySeasonYear);

export default router;
