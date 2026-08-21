import { Bill } from "../models/Bill.js";
import { JobCard } from "../models/JobCard.js";
import { Customer } from "../models/Customer.js";
import { Vehicle } from "../models/Vehicle.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function generateNextInvoiceNumber() {
  const bills = await Bill.find({});
  const max = bills.reduce((m, b) => {
    const num = Number((b.invoiceNumber || "").split("-")[1] ?? 0);
    return Number.isFinite(num) ? Math.max(m, num) : m;
  }, 1000);
  return `INV-${max + 1}`;
}

function formatBill(billDoc) {
  return {
    id: billDoc._id.toString(),
    invoiceNumber: billDoc.invoiceNumber,
    jobCardId: billDoc.jobCard.toString(),
    jobCardNumber: billDoc.jobCardNumber,
    customerName: billDoc.customerName,
    customerPhone: billDoc.customerPhone,
    customerAddress: billDoc.customerAddress || "",
    vehicleRegistration: billDoc.vehicleRegistration,
    vehicleBrand: billDoc.vehicleBrand,
    vehicleModel: billDoc.vehicleModel,
    parts: (billDoc.parts || []).map((p) => ({
      id: p._id ? p._id.toString() : p.id,
      name: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      inventoryItemId: p.inventoryItemId ? p.inventoryItemId.toString() : undefined,
    })),
    labourCost: billDoc.labourCost || 0,
    discountPercent: billDoc.discountPercent || 0,
    gstPercent: billDoc.gstPercent ?? 18,
    paymentMethod: billDoc.paymentMethod,
    status: billDoc.status,
    createdAt: billDoc.createdAt.toISOString().slice(0, 10),
  };
}

export const getBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({}).sort({ createdAt: -1 });
  const formatted = bills.map((b) => formatBill(b));
  formatted.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.invoiceNumber.localeCompare(a.invoiceNumber));
  return res.status(200).json(new ApiResponse(200, formatted, "Bills fetched successfully"));
});

export const getBillableJobCards = asyncHandler(async (req, res) => {
  const bills = await Bill.find({});
  const billedJobCardIds = new Set(bills.map((b) => b.jobCard.toString()));

  const jobCards = await JobCard.find({}).sort({ updatedAt: -1 });
  const billable = jobCards.filter((j) => !billedJobCardIds.has(j._id.toString()));

  const formattedBillable = await Promise.all(
    billable.map(async (j) => {
      const vehicle = await Vehicle.findById(j.vehicle);
      const customer = await Customer.findById(j.customer);
      return {
        id: j._id.toString(),
        jobCardNumber: j.jobCardNumber,
        vehicleId: vehicle ? vehicle._id.toString() : j.vehicle.toString(),
        vehicleRegistration: vehicle ? vehicle.registrationNumber : "",
        vehicleBrand: vehicle ? vehicle.brand : "",
        vehicleModel: vehicle ? vehicle.model : "",
        customerId: customer ? customer._id.toString() : j.customer.toString(),
        customerName: customer ? customer.name : "",
        customerPhone: customer ? customer.phone : "",
        complaint: j.complaint,
        inspectionNotes: j.inspectionNotes || "",
        assignedMechanic: j.assignedMechanic || "Unassigned",
        parts: (j.parts || []).map((p) => ({
          id: p._id.toString(),
          name: p.name,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          inventoryItemId: p.inventoryItemId ? p.inventoryItemId.toString() : undefined,
        })),
        labourCost: j.labourCost || 0,
        status: j.status,
        createdAt: j.createdAt.toISOString().slice(0, 10),
        updatedAt: j.updatedAt.toISOString().slice(0, 10),
      };
    })
  );

  return res.status(200).json(new ApiResponse(200, formattedBillable, "Billable job cards fetched successfully"));
});

export const createBill = asyncHandler(async (req, res) => {
  const { jobCardId, discountPercent, gstPercent, paymentMethod, status } = req.body;

  if (!jobCardId) {
    throw new ApiError(400, "Select a job card to bill.");
  }

  const existingBill = await Bill.findOne({ jobCard: jobCardId });
  if (existingBill) {
    throw new ApiError(400, "This job card has already been billed.");
  }

  const jobCard = await JobCard.findById(jobCardId);
  if (!jobCard) {
    throw new ApiError(404, "Selected job card could not be found.");
  }

  const customer = await Customer.findById(jobCard.customer);
  const vehicle = await Vehicle.findById(jobCard.vehicle);

  const invoiceNumber = await generateNextInvoiceNumber();

  const billParts = (jobCard.parts || []).map((p) => ({
    inventoryItemId: p.inventoryItemId || undefined,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.unitPrice,
  }));

  const bill = await Bill.create({
    invoiceNumber,
    jobCard: jobCard._id,
    jobCardNumber: jobCard.jobCardNumber,
    customerName: customer ? customer.name : "Unknown",
    customerPhone: customer ? customer.phone : "",
    customerAddress: customer ? customer.address || "" : "",
    vehicleRegistration: vehicle ? vehicle.registrationNumber : "",
    vehicleBrand: vehicle ? vehicle.brand : "",
    vehicleModel: vehicle ? vehicle.model : "",
    parts: billParts,
    labourCost: jobCard.labourCost || 0,
    discountPercent: Number(discountPercent) || 0,
    gstPercent: gstPercent !== undefined ? Number(gstPercent) : 18,
    paymentMethod: paymentMethod || "Cash",
    status: status || "Unpaid",
  });

  // Automatically decrement stock for parts picked from inventory
  for (const part of billParts) {
    if (part.inventoryItemId) {
      await InventoryItem.findByIdAndUpdate(part.inventoryItemId, {
        $inc: { quantity: -part.quantity },
      });
      // Ensure quantity doesn't become negative
      const updatedItem = await InventoryItem.findById(part.inventoryItemId);
      if (updatedItem && updatedItem.quantity < 0) {
        updatedItem.quantity = 0;
        await updatedItem.save();
      }
    }
  }

  return res.status(201).json(new ApiResponse(201, formatBill(bill), "Invoice created successfully"));
});

export const updateBillStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const bill = await Bill.findById(id);
  if (!bill) {
    throw new ApiError(404, "Bill not found. It may have been deleted.");
  }

  bill.status = status;
  await bill.save();

  return res.status(200).json(new ApiResponse(200, formatBill(bill), "Bill status updated successfully"));
});

export const deleteBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bill = await Bill.findById(id);
  if (!bill) {
    throw new ApiError(404, "Bill not found. It may have already been deleted.");
  }
  await Bill.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, "Bill deleted successfully"));
});
