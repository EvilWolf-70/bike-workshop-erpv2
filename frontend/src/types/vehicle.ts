export interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  year?: number;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  engineNumber: string;
  chassisNumber: string;
  odometer: number; // km
  totalJobs: number;
  lastServiceDate: string | null;
  createdAt: string;
}

export type VehicleInput = Pick<
  Vehicle,
  "registrationNumber" | "brand" | "model" | "year" | "ownerId" | "engineNumber" | "chassisNumber" | "odometer"
>;

export interface VehicleHistoryJob {
  id: string;
  jobCardNumber: string;
  date: string;
  status: "Pending" | "In Progress" | "Completed" | "Delivered";
  complaint: string;
  total: number;
}

export interface VehicleHistory {
  jobs: VehicleHistoryJob[];
}
