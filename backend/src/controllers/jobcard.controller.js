import { JobCard } from "../models/JobCard.js";
import { Vehicle } from "../models/Vehicle.js";
import { Customer } from "../models/Customer.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function generateNextJobCardNumber() {
  const jobCards = await JobCard.find({});
  const max = jobCards.reduce((m, j) => {
    const num = Number((j.jobCardNumber || "").split("-")[1] ?? 0);
    return Number.isFinite(num) ? Math.max(m, num) : m;
  }, 1040);
  return `JC-${max + 1}`;
}

async function formatJobCard(jobDoc) {
  const vehicle = await Vehicle.findById(jobDoc.vehicle);
  const customer = await Customer.findById(jobDoc.customer);

  return {
    id: jobDoc._id.toString(),
    jobCardNumber: jobDoc.jobCardNumber,
    vehicleId: vehicle ? vehicle._id.toString() : jobDoc.vehicle.toString(),
    vehicleRegistration: vehicle ? vehicle.registrationNumber : "",
    vehicleBrand: vehicle ? vehicle.brand : "",
    vehicleModel: vehicle ? vehicle.model : "",
    customerId: customer ? customer._id.toString() : jobDoc.customer.toString(),
    customerName: customer ? customer.name : "",
    customerPhone: customer ? customer.phone : "",
    complaint: jobDoc.complaint,
    inspectionNotes: jobDoc.inspectionNotes || "",
    assignedMechanic: jobDoc.assignedMechanic || "Unassigned",
    parts: (jobDoc.parts || []).map((p) => ({
      id: p._id.toString(),
      name: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      inventoryItemId: p.inventoryItemId ? p.inventoryItemId.toString() : undefined,
    })),
    labourCost: jobDoc.labourCost || 0,
    status: jobDoc.status,
    createdAt: jobDoc.createdAt.toISOString().slice(0, 10),
    updatedAt: jobDoc.updatedAt.toISOString().slice(0, 10),
  };
}

export const getJobCards = asyncHandler(async (req, res) => {
  const jobCards = await JobCard.find({}).sort({ updatedAt: -1 });
  const formatted = await Promise.all(jobCards.map((j) => formatJobCard(j)));
  formatted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.jobCardNumber.localeCompare(a.jobCardNumber));
  return res.status(200).json(new ApiResponse(200, formatted, "Job cards fetched successfully"));
});

export const createJobCard = asyncHandler(async (req, res) => {
  const { vehicleId, complaint, inspectionNotes, assignedMechanic, parts, labourCost, status } = req.body;

  if (!vehicleId) {
    throw new ApiError(400, "Select a vehicle for this job card.");
  }
  if (!complaint || !complaint.trim()) {
    throw new ApiError(400, "Describe the customer's complaint.");
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, "Selected vehicle could not be found.");
  }

  const jobCardNumber = await generateNextJobCardNumber();

  const formattedParts = (parts || []).map((p) => ({
    name: p.name.trim(),
    quantity: Math.max(1, Number(p.quantity) || 1),
    unitPrice: Math.max(0, Number(p.unitPrice) || 0),
    inventoryItemId: p.inventoryItemId || undefined,
  }));

  const jobCard = await JobCard.create({
    jobCardNumber,
    vehicle: vehicle._id,
    customer: vehicle.owner,
    complaint: complaint.trim(),
    inspectionNotes: (inspectionNotes || "").trim(),
    assignedMechanic: assignedMechanic || "Unassigned",
    parts: formattedParts,
    labourCost: Math.max(0, Number(labourCost) || 0),
    status: status || "Pending",
  });

  const formatted = await formatJobCard(jobCard);
  return res.status(201).json(new ApiResponse(201, formatted, "Job card created successfully"));
});

export const updateJobCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vehicleId, complaint, inspectionNotes, assignedMechanic, parts, labourCost, status } = req.body;

  if (!complaint || !complaint.trim()) {
    throw new ApiError(400, "Describe the customer's complaint.");
  }

  const jobCard = await JobCard.findById(id);
  if (!jobCard) {
    throw new ApiError(404, "Job card not found. It may have been deleted.");
  }

  if (vehicleId && vehicleId !== jobCard.vehicle.toString()) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Selected vehicle could not be found.");
    jobCard.vehicle = vehicle._id;
    jobCard.customer = vehicle.owner;
  }

  const formattedParts = (parts || []).map((p) => ({
    name: p.name.trim(),
    quantity: Math.max(1, Number(p.quantity) || 1),
    unitPrice: Math.max(0, Number(p.unitPrice) || 0),
    inventoryItemId: p.inventoryItemId || undefined,
  }));

  jobCard.complaint = complaint.trim();
  jobCard.inspectionNotes = (inspectionNotes || "").trim();
  jobCard.assignedMechanic = assignedMechanic || jobCard.assignedMechanic;
  jobCard.parts = formattedParts;
  jobCard.labourCost = Math.max(0, Number(labourCost) || 0);
  if (status) jobCard.status = status;

  await jobCard.save();

  const formatted = await formatJobCard(jobCard);
  return res.status(200).json(new ApiResponse(200, formatted, "Job card updated successfully"));
});

export const deleteJobCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const jobCard = await JobCard.findById(id);
  if (!jobCard) {
    throw new ApiError(404, "Job card not found. It may have already been deleted.");
  }
  await JobCard.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, "Job card deleted successfully"));
});
