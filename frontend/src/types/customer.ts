export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  vehicleCount: number;
  totalJobs: number;
  totalSpend: number;
  lastVisit: string | null; // ISO date, null if never visited
  createdAt: string;
}

export type CustomerInput = Pick<Customer, "name" | "phone" | "whatsapp" | "address">;

export interface CustomerHistoryVehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
}

export interface CustomerHistoryJob {
  id: string;
  jobCardNumber: string;
  vehicleRegistration: string;
  date: string;
  status: "Pending" | "In Progress" | "Completed" | "Delivered";
  total: number;
}

export interface CustomerHistory {
  vehicles: CustomerHistoryVehicle[];
  jobs: CustomerHistoryJob[];
}
