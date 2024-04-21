import express from "express";
import * as loanController from "../controllers/loan.controller";

const router = express.Router();

router.get("/services", loanController.getservices);
router.post("/addservice", loanController.addService);
router.get("/", loanController.List);
router.get("/:id", loanController.One);
router.put("/acceptloan/:id", loanController.acceptLoan);
router.put("/refuseloan/:id", loanController.refuseLoan);
export default router;
