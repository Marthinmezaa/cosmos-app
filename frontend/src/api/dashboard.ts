import { apiRequest } from "../lib/api-client";
import type { DashboardResumen } from "../lib/types";

export function obtenerDashboard(mes: number, anio: number): Promise<DashboardResumen> {
  return apiRequest<DashboardResumen>("/api/dashboard", { query: { mes, anio } });
}
