import express from "express";
import {
  getCustomers,
  findCustomerByPhone,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
} from "../controllers/customer.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCustomers);
router.get("/phone/:phone", findCustomerByPhone);
router.get("/:id/history", getCustomerHistory);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
