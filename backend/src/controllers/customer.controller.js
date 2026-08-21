import { Customer } from "../models/Customer.js";
import { Vehicle } from "../models/Vehicle.js";
import { JobCard } from "../models/JobCard.js";
import { Bill } from "../models/Bill.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function formatCustomer(customerDoc) {
  const customerId = customerDoc._id;

  const vehicleCount = await Vehicle.countDocuments({ owner: customerId });
  const jobs = await JobCard.find({ customer: customerId }).sort({ createdAt: -1 });
  const bills = await Bill.find({ customerPhone: customerDoc.phone, status: "Paid" });

  const totalJobs = jobs.length;

  const totalSpend = bills.reduce((sum, bill) => {
    const partsTotal = bill.parts.reduce((pSum, p) => pSum + p.quantity * p.unitPrice, 0);
    const subtotal = partsTotal + (bill.labourCost || 0);
    const discountAmount = Math.round((subtotal * (bill.discountPercent || 0)) / 100);
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Math.round((taxableAmount * (bill.gstPercent || 0)) / 100);
    return sum + (taxableAmount + gstAmount);
  }, 0);

  const lastVisit = jobs.length > 0 ? jobs[0].createdAt.toISOString().slice(0, 10) : null;

  return {
    id: customerDoc._id.toString(),
    name: customerDoc.name,
    phone: customerDoc.phone,
    whatsapp: customerDoc.whatsapp || customerDoc.phone,
    address: customerDoc.address || "",
    vehicleCount,
    totalJobs,
    totalSpend,
    lastVisit,
    createdAt: customerDoc.createdAt.toISOString().slice(0, 10),
  };
}

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).sort({ updatedAt: -1 });
  const formatted = await Promise.all(customers.map((c) => formatCustomer(c)));

  formatted.sort((a, b) => (b.lastVisit ?? b.createdAt).localeCompare(a.lastVisit ?? a.createdAt));

  return res.status(200).json(new ApiResponse(200, formatted, "Customers fetched successfully"));
});

export const findCustomerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const target = phone.replace(/\D/g, "");
  const customer = await Customer.findOne({ phone: target });

  if (!customer) {
    return res.status(200).json(new ApiResponse(200, null, "Customer not found"));
  }

  const formatted = await formatCustomer(customer);
  return res.status(200).json(new ApiResponse(200, formatted, "Customer found"));
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, whatsapp, address } = req.body;

  const normalizedPhone = (phone || "").replace(/\D/g, "");
  if (normalizedPhone.length !== 10) {
    throw new ApiError(400, "Enter a valid 10-digit phone number.");
  }
  if (!name || !name.trim()) {
    throw new ApiError(400, "Customer name is required.");
  }

  const dupe = await Customer.findOne({ phone: normalizedPhone });
  if (dupe) {
    const existingFormatted = await formatCustomer(dupe);
    const err = new ApiError(409, "A customer with this mobile number already exists.");
    err.existing = existingFormatted;
    throw err;
  }

  const customer = await Customer.create({
    name: name.trim(),
    phone: normalizedPhone,
    whatsapp: (whatsapp || "").trim() || normalizedPhone,
    address: (address || "").trim(),
  });

  const formatted = await formatCustomer(customer);
  return res.status(201).json(new ApiResponse(201, formatted, "Customer created successfully"));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, whatsapp, address } = req.body;

  const normalizedPhone = (phone || "").replace(/\D/g, "");
  if (normalizedPhone.length !== 10) {
    throw new ApiError(400, "Enter a valid 10-digit phone number.");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found. It may have been deleted.");
  }

  const dupe = await Customer.findOne({ phone: normalizedPhone, _id: { $ne: id } });
  if (dupe) {
    const existingFormatted = await formatCustomer(dupe);
    const err = new ApiError(409, "A customer with this mobile number already exists.");
    err.existing = existingFormatted;
    throw err;
  }

  customer.name = name.trim();
  customer.phone = normalizedPhone;
  customer.whatsapp = (whatsapp || "").trim() || normalizedPhone;
  customer.address = (address || "").trim();
  await customer.save();

  const formatted = await formatCustomer(customer);
  return res.status(200).json(new ApiResponse(200, formatted, "Customer updated successfully"));
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found. It may have already been deleted.");
  }
  await Customer.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, "Customer deleted successfully"));
});

export const getCustomerHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  const vehicles = await Vehicle.find({ owner: id });
  const jobs = await JobCard.find({ customer: id }).sort({ createdAt: -1 });

  const vehicleHistoryList = vehicles.map((v) => ({
    id: v._id.toString(),
    registrationNumber: v.registrationNumber,
    brand: v.brand,
    model: v.model,
  }));

  const jobHistoryList = await Promise.all(
    jobs.map(async (j) => {
      const partsTotal = j.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
      const total = partsTotal + (j.labourCost || 0);
      const vehicleDoc = vehicles.find((v) => v._id.toString() === j.vehicle.toString());
      return {
        id: j._id.toString(),
        jobCardNumber: j.jobCardNumber,
        vehicleRegistration: vehicleDoc ? vehicleDoc.registrationNumber : "—",
        date: j.createdAt.toISOString().slice(0, 10),
        status: j.status,
        total,
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vehicles: vehicleHistoryList,
        jobs: jobHistoryList,
      },
      "Customer history retrieved successfully"
    )
  );
});
