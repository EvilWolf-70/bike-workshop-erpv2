import type { WorkshopProfile } from "../../types/settings";
import { request } from "./apiClient";

export async function fetchWorkshopProfile(): Promise<WorkshopProfile> {
  return request<WorkshopProfile>("/settings");
}

export async function updateWorkshopProfile(input: WorkshopProfile): Promise<WorkshopProfile> {
  return request<WorkshopProfile>("/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
