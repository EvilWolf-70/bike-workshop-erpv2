import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Engine", "Brakes", "Electrical", "Body", "Consumables", "Tyres", "Other"],
      default: "Consumables",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
      default: 0,
    },
    lowStockLevel: {
      type: Number,
      required: [true, "Low stock level threshold is required"],
      min: [0, "Low stock level cannot be negative"],
      default: 5,
    },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
