import { apiRequest } from "../lib/api-client";
import type { LoginResponse, Usuario } from "../lib/types";

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", { method: "POST", body: { email, password } });
}

export function me(): Promise<Usuario> {
  return apiRequest<Usuario>("/api/auth/me");
}
