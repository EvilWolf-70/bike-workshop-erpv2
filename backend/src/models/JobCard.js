import mongoose from "mongoose";

const jobCardPartSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const jobCardSchema = new mongoose.Schema(
  {
    jobCardNumber: {
      type: String,
      required: [true, "Job card number is required"],
      unique: true,
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    complaint: {
      type: String,
      required: [true, "Complaint details are required"],
      trim: true,
    },
    inspectionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedMechanic: {
      type: String,
      trim: true,
      default: "Unassigned",
    },
    parts: [jobCardPartSchema],
    labourCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Delivered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const JobCard = mongoose.model("JobCard", jobCardSchema);
