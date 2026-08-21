import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    year: {
      type: Number,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Vehicle owner is required"],
    },
    engineNumber: {
      type: String,
      trim: true,
      default: "",
    },
    chassisNumber: {
      type: String,
      trim: true,
      default: "",
    },
    odometer: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
