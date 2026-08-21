const BASE_URL = "/api";

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  existing?: any;
  errors?: any[];
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiEnvelope<T> = await response.json().catch(() => ({
    success: false,
    message: "Failed to parse server response",
    data: null as unknown as T,
  }));

  if (!response.ok || !data.success) {
    if (response.status === 409 && data.existing) {
      const err = new Error(data.message || "Duplicate resource") as any;
      err.name = "DuplicateError";
      err.existing = data.existing;
      throw err;
    }

    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new Error(data.message || "An unexpected error occurred");
  }

  return data.data;
}
