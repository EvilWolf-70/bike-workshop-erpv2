export type JobStatus = "Pending" | "In Progress" | "Completed" | "Delivered";

export interface JobCardPart {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** Set when this line was picked from Inventory, so billing can deduct stock. Absent for one-off/non-stocked parts. */
  inventoryItemId?: string;
}

export interface JobCard {
  id: string;
  jobCardNumber: string;
  vehicleId: string;
  vehicleRegistration: string;
  vehicleBrand: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  complaint: string;
  inspectionNotes: string;
  assignedMechanic: string;
  parts: JobCardPart[];
  labourCost: number;
  status: JobStatus;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export type JobCardInput = Pick<
  JobCard,
  "vehicleId" | "complaint" | "inspectionNotes" | "assignedMechanic" | "parts" | "labourCost" | "status"
>;

export function jobCardTotal(job: Pick<JobCard, "parts" | "labourCost">): number {
  const partsTotal = job.parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  return partsTotal + (job.labourCost || 0);
}
