import express from "express";
import * as storeController from "../controllers/store.controller";

const router = express.Router();

router.get("/", storeController.List);
router.post("/", storeController.addStore);
router.get("/:id", storeController.one);
router.post("/gpx/:code", storeController.Gpx);
router.put("/gpx/modifydate/:code", storeController.dateUpdate);

export default router;
