import express from "express";
import {
  getVehicles,
  getVehiclesByOwner,
  findVehicleByRegistration,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
} from "../controllers/vehicle.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getVehicles);
router.get("/owner/:ownerId", getVehiclesByOwner);
router.get("/reg/:reg", findVehicleByRegistration);
router.get("/:id/history", getVehicleHistory);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
