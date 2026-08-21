import express from "express";
import {
  getDailySales,
  getMonthlySales,
  getInventorySummary,
  getCustomerSummary,
  getRevenueSeries,
} from "../controllers/reports.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/daily", getDailySales);
router.get("/monthly", getMonthlySales);
router.get("/inventory-summary", getInventorySummary);
router.get("/customer-summary", getCustomerSummary);
router.get("/revenue-series", getRevenueSeries);

export default router;
