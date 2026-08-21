import { Vehicle } from "../models/Vehicle.js";
import { Customer } from "../models/Customer.js";
import { JobCard } from "../models/JobCard.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const REG_PATTERN = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{1,4}$/i;

function normalizeReg(reg) {
  return reg.replace(/\s/g, "").toUpperCase();
}

async function formatVehicle(vehicleDoc) {
  const vehicleId = vehicleDoc._id;
  const owner = await Customer.findById(vehicleDoc.owner);
  const jobs = await JobCard.find({ vehicle: vehicleId }).sort({ createdAt: -1 });

  const totalJobs = jobs.length;
  const lastServiceDate = jobs.length > 0 ? jobs[0].createdAt.toISOString().slice(0, 10) : null;

  return {
    id: vehicleDoc._id.toString(),
    registrationNumber: vehicleDoc.registrationNumber,
    brand: vehicleDoc.brand,
    model: vehicleDoc.model,
    year: vehicleDoc.year || undefined,
    ownerId: owner ? owner._id.toString() : vehicleDoc.owner.toString(),
    ownerName: owner ? owner.name : "Unknown Owner",
    ownerPhone: owner ? owner.phone : "",
    engineNumber: vehicleDoc.engineNumber || "",
    chassisNumber: vehicleDoc.chassisNumber || "",
    odometer: vehicleDoc.odometer || 0,
    totalJobs,
    lastServiceDate,
    createdAt: vehicleDoc.createdAt.toISOString().slice(0, 10),
  };
}

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({}).sort({ updatedAt: -1 });
  const formatted = await Promise.all(vehicles.map((v) => formatVehicle(v)));

  formatted.sort((a, b) => (b.lastServiceDate ?? b.createdAt).localeCompare(a.lastServiceDate ?? a.createdAt));

  return res.status(200).json(new ApiResponse(200, formatted, "Vehicles fetched successfully"));
});

export const getVehiclesByOwner = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  const vehicles = await Vehicle.find({ owner: ownerId }).sort({ updatedAt: -1 });
  const formatted = await Promise.all(vehicles.map((v) => formatVehicle(v)));
  return res.status(200).json(new ApiResponse(200, formatted, "Owner vehicles fetched successfully"));
});

export const findVehicleByRegistration = asyncHandler(async (req, res) => {
  const { reg } = req.params;
  const target = normalizeReg(reg);

  const allVehicles = await Vehicle.find({});
  const matched = allVehicles.find((v) => normalizeReg(v.registrationNumber) === target);

  if (!matched) {
    return res.status(200).json(new ApiResponse(200, null, "Vehicle not found"));
  }

  const formatted = await formatVehicle(matched);
  return res.status(200).json(new ApiResponse(200, formatted, "Vehicle found"));
});

export const createVehicle = asyncHandler(async (req, res) => {
  const { registrationNumber, brand, model, year, ownerId, engineNumber, chassisNumber, odometer } = req.body;

  const reg = (registrationNumber || "").trim().toUpperCase();
  if (!REG_PATTERN.test(reg)) {
    throw new ApiError(400, "Enter a valid registration number, e.g. TN 74 AB 4521.");
  }

  if (!ownerId) {
    throw new ApiError(400, "Select an owner for this vehicle.");
  }

  const owner = await Customer.findById(ownerId);
  if (!owner) {
    throw new ApiError(404, "Selected owner could not be found.");
  }

  const normalizedTarget = normalizeReg(reg);
  const allVehicles = await Vehicle.find({});
  const dupe = allVehicles.find((v) => normalizeReg(v.registrationNumber) === normalizedTarget);

  if (dupe) {
    const existingFormatted = await formatVehicle(dupe);
    const err = new ApiError(409, "A vehicle with this registration number already exists.");
    err.existing = existingFormatted;
    throw err;
  }

  const vehicle = await Vehicle.create({
    registrationNumber: reg,
    brand: (brand || "").trim(),
    model: (model || "").trim(),
    year: year || undefined,
    owner: owner._id,
    engineNumber: (engineNumber || "").trim(),
    chassisNumber: (chassisNumber || "").trim(),
    odometer: odometer || 0,
  });

  const formatted = await formatVehicle(vehicle);
  return res.status(201).json(new ApiResponse(201, formatted, "Vehicle created successfully"));
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { registrationNumber, brand, model, year, ownerId, engineNumber, chassisNumber, odometer } = req.body;

  const reg = (registrationNumber || "").trim().toUpperCase();
  if (!REG_PATTERN.test(reg)) {
    throw new ApiError(400, "Enter a valid registration number, e.g. TN 74 AB 4521.");
  }

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found. It may have been deleted.");
  }

  const owner = await Customer.findById(ownerId || vehicle.owner);
  if (!owner) {
    throw new ApiError(404, "Selected owner could not be found.");
  }

  const normalizedTarget = normalizeReg(reg);
  const allVehicles = await Vehicle.find({ _id: { $ne: id } });
  const dupe = allVehicles.find((v) => normalizeReg(v.registrationNumber) === normalizedTarget);

  if (dupe) {
    const existingFormatted = await formatVehicle(dupe);
    const err = new ApiError(409, "A vehicle with this registration number already exists.");
    err.existing = existingFormatted;
    throw err;
  }

  vehicle.registrationNumber = reg;
  vehicle.brand = (brand || "").trim();
  vehicle.model = (model || "").trim();
  vehicle.year = year || undefined;
  vehicle.owner = owner._id;
  vehicle.engineNumber = (engineNumber || "").trim();
  vehicle.chassisNumber = (chassisNumber || "").trim();
  vehicle.odometer = odometer || 0;
  await vehicle.save();

  const formatted = await formatVehicle(vehicle);
  return res.status(200).json(new ApiResponse(200, formatted, "Vehicle updated successfully"));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found. It may have already been deleted.");
  }
  await Vehicle.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, null, "Vehicle deleted successfully"));
});

export const getVehicleHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found.");
  }

  const jobs = await JobCard.find({ vehicle: id }).sort({ createdAt: -1 });

  const jobHistoryList = jobs.map((j) => {
    const partsTotal = j.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    const total = partsTotal + (j.labourCost || 0);
    return {
      id: j._id.toString(),
      jobCardNumber: j.jobCardNumber,
      date: j.createdAt.toISOString().slice(0, 10),
      status: j.status,
      complaint: j.complaint,
      total,
    };
  });

  return res.status(200).json(new ApiResponse(200, { jobs: jobHistoryList }, "Vehicle history retrieved successfully"));
});
