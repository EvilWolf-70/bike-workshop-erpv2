import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/bike_workshop_erp",
  JWT_SECRET: process.env.JWT_SECRET || "super_secret_jwt_key_bike_workshop_erp_2026_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};
