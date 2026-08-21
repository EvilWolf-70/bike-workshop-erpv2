import express from "express";
import {
  getInventoryItems,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventory.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getInventoryItems);
router.get("/low-stock", getLowStockItems);
router.post("/", createInventoryItem);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

export default router;
