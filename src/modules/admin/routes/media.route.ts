import express from "express";
import * as mediaController from "../controllers/media.controller";

const router = express.Router();

router.post("/upload", mediaController.uploadFile);
router.post("/upload/xlsx", mediaController.xlsxFileHandeller);
router.delete("/remove/:file", mediaController.removeFile);
router.post("/upload/addusers", mediaController.addUsersUsingCsv);

export default router;
