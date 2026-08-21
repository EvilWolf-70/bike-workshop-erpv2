import { Bill } from "../models/Bill.js";
import { Customer } from "../models/Customer.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function computeBillTotals(billDoc) {
  const partsTotal = billDoc.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const subtotal = partsTotal + (billDoc.labourCost || 0);
  const discountAmount = Math.round((subtotal * (billDoc.discountPercent || 0)) / 100);
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = Math.round((taxableAmount * (billDoc.gstPercent || 0)) / 100);
  const grandTotal = taxableAmount + gstAmount;
  return { partsTotal, subtotal, discountAmount, taxableAmount, gstAmount, grandTotal };
}

export const getDailySales = asyncHandler(async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  if (!date) {
    throw new ApiError(400, "Date query parameter is required (YYYY-MM-DD)");
  }

  const allBills = await Bill.find({});
  const dayBills = allBills.filter((b) => b.createdAt.toISOString().slice(0, 10) === date);

  const formattedBills = dayBills.map((b) => ({
    id: b._id.toString(),
    invoiceNumber: b.invoiceNumber,
    jobCardId: b.jobCard.toString(),
    jobCardNumber: b.jobCardNumber,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerAddress: b.customerAddress || "",
    vehicleRegistration: b.vehicleRegistration,
    vehicleBrand: b.vehicleBrand,
    vehicleModel: b.vehicleModel,
    parts: b.parts,
    labourCost: b.labourCost,
    discountPercent: b.discountPercent,
    gstPercent: b.gstPercent,
    paymentMethod: b.paymentMethod,
    status: b.status,
    createdAt: b.createdAt.toISOString().slice(0, 10),
  }));

  const totalRevenue = dayBills.reduce((sum, b) => sum + computeBillTotals(b).grandTotal, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date,
        bills: formattedBills,
        totalRevenue,
        billCount: dayBills.length,
      },
      "Daily sales report fetched successfully"
    )
  );
});

export const getMonthlySales = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) {
    throw new ApiError(400, "Month query parameter is required (YYYY-MM)");
  }

  const allBills = await Bill.find({});
  const monthBills = allBills.filter((b) => b.createdAt.toISOString().slice(0, 7) === month);

  const byDate = new Map();
  for (const bill of monthBills) {
    const dateStr = bill.createdAt.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr) ?? { revenue: 0, billCount: 0 };
    entry.revenue += computeBillTotals(bill).grandTotal;
    entry.billCount += 1;
    byDate.set(dateStr, entry);
  }

  const days = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        month,
        days,
        totalRevenue,
        billCount: monthBills.length,
      },
      "Monthly sales report fetched successfully"
    )
  );
});

export const getInventorySummary = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({});
  const formattedItems = items.map((i) => ({
    id: i._id.toString(),
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    purchasePrice: i.purchasePrice,
    sellingPrice: i.sellingPrice,
    lowStockLevel: i.lowStockLevel,
    updatedAt: i.updatedAt.toISOString().slice(0, 10),
  }));

  const totalStockValue = items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);
  const totalPotentialRevenue = items.reduce((s, i) => s + i.quantity * i.sellingPrice, 0);
  const lowStockCount = items.filter((i) => i.quantity <= i.lowStockLevel).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: formattedItems,
        totalStockValue,
        totalPotentialRevenue,
        lowStockCount,
      },
      "Inventory summary report fetched successfully"
    )
  );
});

export const getCustomerSummary = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});
  const allBills = await Bill.find({ status: "Paid" });

  const formattedCustomers = await Promise.all(
    customers.map(async (c) => {
      const custBills = allBills.filter((b) => b.customerPhone === c.phone);
      const totalSpend = custBills.reduce((sum, b) => sum + computeBillTotals(b).grandTotal, 0);
      return {
        id: c._id.toString(),
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp || c.phone,
        address: c.address || "",
        vehicleCount: 0,
        totalJobs: 0,
        totalSpend,
        lastVisit: null,
        createdAt: c.createdAt.toISOString().slice(0, 10),
      };
    })
  );

  formattedCustomers.sort((a, b) => b.totalSpend - a.totalSpend);
  const totalLifetimeRevenue = formattedCustomers.reduce((s, c) => s + c.totalSpend, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customers: formattedCustomers,
        totalCustomers: customers.length,
        totalLifetimeRevenue,
      },
      "Customer summary report fetched successfully"
    )
  );
});

export const getRevenueSeries = asyncHandler(async (req, res) => {
  const { start, end } = req.query; // YYYY-MM-DD
  if (!start || !end) {
    throw new ApiError(400, "Start and end date query parameters are required");
  }

  const allBills = await Bill.find({});
  const inRange = allBills.filter((b) => {
    const d = b.createdAt.toISOString().slice(0, 10);
    return d >= start && d <= end;
  });

  const singleDayFallback = start === end;
  const revenueByDate = new Map();

  for (const bill of inRange) {
    const key = bill.createdAt.toISOString().slice(0, 10);
    revenueByDate.set(key, (revenueByDate.get(key) ?? 0) + computeBillTotals(bill).grandTotal);
  }

  const points = [];
  const curr = new Date(start);
  const stop = new Date(end);

  while (curr <= stop) {
    const key = curr.toISOString().slice(0, 10);
    points.push({
      key,
      label: key,
      revenue: revenueByDate.get(key) ?? 0,
    });
    curr.setDate(curr.getDate() + 1);
  }

  const totalRevenue = points.reduce((s, p) => s + p.revenue, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range: { start, end, label: `${start} to ${end}` },
        granularity: "daily",
        points,
        totalRevenue,
        billCount: inRange.length,
        singleDayFallback,
      },
      "Revenue series fetched successfully"
    )
  );
});
