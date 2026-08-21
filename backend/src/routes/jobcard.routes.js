import express from "express";
import {
  getJobCards,
  createJobCard,
  updateJobCard,
  deleteJobCard,
} from "../controllers/jobcard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getJobCards);
router.post("/", createJobCard);
router.put("/:id", updateJobCard);
router.delete("/:id", deleteJobCard);

export default router;
