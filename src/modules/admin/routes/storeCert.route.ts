import express from "express";
import * as storeCertController from "../controllers/storeCert.controller";

const router = express.Router();

router.get("/generatepdf/:id", storeCertController.genrateCertPdf);
router.get("/download/:name", storeCertController.download);
router.get("/:code", storeCertController.download);
router.get("/sign/:code", storeCertController.getUrl);

export default router;
