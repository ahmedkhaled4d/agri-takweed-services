import express from "express";
import * as loanController from "../controllers/loan.controller";

const router = express.Router();
router.post("/", loanController.addLoan);
router.get("/", loanController.getLoan);
router.get("/services", loanController.getservices);
router.put("/cancelloan/:id", loanController.cancelLoan);
// router.post('/addservice', loanController.addService);
export default router;
