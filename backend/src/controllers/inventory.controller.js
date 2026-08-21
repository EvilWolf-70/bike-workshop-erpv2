import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function formatInventoryItem(itemDoc) {
  return {
    id: itemDoc._id.toString(),
    name: itemDoc.name,
    category: itemDoc.category,
    quantity: itemDoc.quantity,
    purchasePrice: itemDoc.purchasePrice,
    sellingPrice: itemDoc.sellingPrice,
    lowStockLevel: itemDoc.lowStockLevel,
    updatedAt: itemDoc.updatedAt.toISOString().slice(0, 10),
  };
}

export const getInventoryItems = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({}).sort({ name: 1 });
  const formatted = items.map((i) => formatInventoryItem(i));
  return res.status(200).json(new ApiResponse(200, formatted, "Inventory items fetched successfully"));
});

export const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({});
  const lowStock = items.filter((i) => i.quantity <= i.lowStockLevel).map((i) => formatInventoryItem(i));
  return res.status(200).json(new ApiResponse(200, lowStock, "Low stock items fetched successfully"));
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const { name, category, quantity, purchasePrice, sellingPrice, lowStockLevel } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Item name is required.");
  }
  if (Number(sellingPrice) < Number(purchasePrice)) {
    throw new ApiError(400, "Selling price is lower than purchase price — double check before saving.");
  }

  const existing = await InventoryItem.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
  if (existing) {
    throw new ApiError(400, "An item with this name already exists.");
  }

  const item = await InventoryItem.create({
    name: name.trim(),
    category: category || "Consumables",
    quantity: Math.max(0, Number(quantity) || 0),
    purchasePrice: Math.max(0, Number(purchasePrice) || 0),
    sellingPrice: Math.max(0, Number(sellingPrice) || 0),
    lowStockLevel: Math.max(0, Number(lowStockLevel) || 0),
  });

  return res.status(201).json(new ApiResponse(201, formatInventoryItem(item), "Inventory item created successfully"));
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, purchasePrice, sellingPrice, lowStockLevel } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Item name is required.");
  }
  if (Number(sellingPrice) < Number(purchasePrice)) {
    throw new ApiError(400, "Selling price is lower than purchase price — double check before saving.");
  }

  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Item not found. It may have been deleted.");
  }

  const dupe = await InventoryItem.findOne({
    _id: { $ne: id },
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });
  if (dupe) {
    throw new ApiError(400, "An item with this name already exists.");
  }

  item.name = name.trim();
  item.category = category || item.category;
  item.quantity = Math.max(0, Number(quantity) || 0);
  item.purchasePrice = Math.max(0, Number(purchasePrice) || 0);
  item.sellingPrice = Math.max(0, Number(sellingPrice) || 0);
  item.lowStockLevel = Math.max(0, Number(lowStockLevel) || 0);

  await item.save();

  return res.status(200).json(new ApiResponse(200, formatInventoryItem(item), "Inventory item updated successfully"));
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Item not found. It may have already been deleted.");
  }
  await InventoryItem.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});
