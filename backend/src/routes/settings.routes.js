import express from "express";
import { getWorkshopProfile, updateWorkshopProfile } from "../controllers/settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getWorkshopProfile);
router.put("/", updateWorkshopProfile);

export default router;
