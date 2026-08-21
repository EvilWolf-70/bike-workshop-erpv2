import express from "express";
import {
  getBills,
  getBillableJobCards,
  createBill,
  updateBillStatus,
  deleteBill,
} from "../controllers/billing.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getBills);
router.get("/billable-jobcards", getBillableJobCards);
router.post("/", createBill);
router.patch("/:id/status", updateBillStatus);
router.delete("/:id", deleteBill);

export default router;
