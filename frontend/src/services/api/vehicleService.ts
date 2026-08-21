import type { Vehicle, VehicleInput, VehicleHistory } from "../../types/vehicle";
import { fetchCustomers } from "./customerService";
import { request } from "./apiClient";

export class DuplicateError extends Error {
  existing: Vehicle;
  constructor(message: string, existing: Vehicle) {
    super(message);
    this.name = "DuplicateError";
    this.existing = existing;
  }
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  return request<Vehicle[]>("/vehicles");
}

export async function fetchOwnerOptions() {
  const customers = await fetchCustomers();
  return customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
}

export async function fetchVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
  return request<Vehicle[]>(`/vehicles/owner/${ownerId}`);
}

export async function findVehicleByRegistration(registrationNumber: string): Promise<Vehicle | null> {
  return request<Vehicle | null>(`/vehicles/reg/${encodeURIComponent(registrationNumber)}`);
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  try {
    return await request<Vehicle>("/vehicles", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err: any) {
    if (err.name === "DuplicateError" && err.existing) {
      throw new DuplicateError(err.message, err.existing);
    }
    throw err;
  }
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  try {
    return await request<Vehicle>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  } catch (err: any) {
    if (err.name === "DuplicateError" && err.existing) {
      throw new DuplicateError(err.message, err.existing);
    }
    throw err;
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await request<void>(`/vehicles/${id}`, {
    method: "DELETE",
  });
}

export async function fetchVehicleHistory(id: string): Promise<VehicleHistory> {
  return request<VehicleHistory>(`/vehicles/${id}/history`);
}
