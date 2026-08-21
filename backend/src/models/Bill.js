import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
    },
    jobCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCard",
      required: [true, "Job Card is required"],
    },
    jobCardNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      default: "",
    },
    vehicleRegistration: {
      type: String,
      required: true,
    },
    vehicleBrand: {
      type: String,
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
    },
    parts: [
      {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
      },
    ],
    labourCost: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    gstPercent: {
      type: Number,
      default: 18,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      default: "Cash",
    },
    status: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

export const Bill = mongoose.model("Bill", billSchema);
