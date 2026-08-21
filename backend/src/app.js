import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import jobCardRoutes from "./routes/jobcard.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import settingsRoutes from "./routes/settings.routes.js";

const app = express();

// Enable CORS & JSON parsing
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/jobcards", jobCardRoutes);
app.use("/api/bills", billingRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use(errorHandler);

export default app;
