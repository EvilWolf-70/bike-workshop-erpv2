import type { Customer, CustomerInput, CustomerHistory } from "../../types/customer";
import { request } from "./apiClient";

export class DuplicateError extends Error {
  existing: Customer;
  constructor(message: string, existing: Customer) {
    super(message);
    this.name = "DuplicateError";
    this.existing = existing;
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/customers");
}

export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  return request<Customer | null>(`/customers/phone/${encodeURIComponent(phone)}`);
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  try {
    return await request<Customer>("/customers", {
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

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  try {
    return await request<Customer>(`/customers/${id}`, {
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

export async function deleteCustomer(id: string): Promise<void> {
  await request<void>(`/customers/${id}`, {
    method: "DELETE",
  });
}

export async function fetchCustomerHistory(id: string): Promise<CustomerHistory> {
  return request<CustomerHistory>(`/customers/${id}/history`);
}
