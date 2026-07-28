import { apiRequest } from "../lib/api-client";
import type { DashboardResumen } from "../lib/types";

export function obtenerDashboard(): Promise<DashboardResumen> {
  return apiRequest<DashboardResumen>("/api/dashboard");
}
