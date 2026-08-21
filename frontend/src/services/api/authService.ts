import type { AuthUser, LoginInput } from "../../types/auth";
import { request } from "./apiClient";

export async function login(input: LoginInput): Promise<AuthUser> {
  const result = await request<{ user: AuthUser; token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (result.token) {
    localStorage.setItem("token", result.token);
  }

  return result.user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const user = await request<AuthUser>("/auth/me");
    return user;
  } catch (error) {
    localStorage.removeItem("token");
    return null;
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem("token");
}
