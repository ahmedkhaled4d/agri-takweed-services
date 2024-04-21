import express from "express";
import { Log, LogEverything } from "../../../middlewares";
import * as locationController from "../controllers/location.controller";

const router = express.Router();

router.get("/", locationController.Governorates);
router.get("/searchcenter", locationController.searchCenter);
router.get("/searchhamlet", locationController.searchHamlet);
router.get("/one/:id", locationController.One);
router.get("/:governorateid", locationController.Centers);
router.get("/:id/:centerid", locationController.Hamlets);
router.put("/:id", LogEverything, locationController.Update);
router.put("/active/:id", Log, locationController.Active);
router.put("/deactive/:id", Log, locationController.Deactive);
router.post("/getcenters", locationController.getCenters);
router.post("/", Log, locationController.Create);
router.delete("/:id", Log, locationController.Delete);

export default router;
