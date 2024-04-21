import { Router } from "express";
import { LogEverything } from "../../../middlewares";
import * as CommitteeController from "../controllers/committee.controller";

const router = Router();

router.get("/", CommitteeController.List);

router.get("/stats", CommitteeController.getCommitteeUsersNum);

router.get("/:_id", CommitteeController.One);

router.put("/:_id", LogEverything, CommitteeController.Update);

router.delete("/:_id", LogEverything, CommitteeController.Delete);

router.post("/", LogEverything, CommitteeController.Create);

export default router;
