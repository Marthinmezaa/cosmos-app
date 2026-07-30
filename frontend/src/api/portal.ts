import { apiRequest } from "../lib/api-client";
import type { EstadoCuenta } from "../lib/types";

export function obtenerEstadoCuenta(): Promise<EstadoCuenta> {
  return apiRequest<EstadoCuenta>("/api/portal/estado-cuenta");
}
