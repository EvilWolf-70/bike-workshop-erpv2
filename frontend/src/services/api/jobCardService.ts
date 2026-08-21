import type { JobCard, JobCardInput } from "../../types/jobcard";
import { fetchVehicles } from "./vehicleService";
import { request } from "./apiClient";

export const MECHANICS = ["Selvam", "Karthik", "Ravi", "Muthu"];

export async function fetchJobCards(): Promise<JobCard[]> {
  return request<JobCard[]>("/jobcards");
}

export async function fetchVehicleOptions() {
  const vehicles = await fetchVehicles();
  return vehicles.map((v) => ({
    id: v.id,
    registrationNumber: v.registrationNumber,
    brand: v.brand,
    model: v.model,
    ownerId: v.ownerId,
    ownerName: v.ownerName,
    ownerPhone: v.ownerPhone,
  }));
}

export async function createJobCard(input: JobCardInput): Promise<JobCard> {
  return request<JobCard>("/jobcards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateJobCard(id: string, input: JobCardInput): Promise<JobCard> {
  return request<JobCard>(`/jobcards/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteJobCard(id: string): Promise<void> {
  await request<void>(`/jobcards/${id}`, {
    method: "DELETE",
  });
}
