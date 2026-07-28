import { apiRequest } from "../lib/api-client";
import type { ListarMovimientosCajaResponse, TipoMovimientoCaja } from "../lib/types";

export interface ListarMovimientosParams {
  mes?: number;
  anio?: number;
  tipo?: TipoMovimientoCaja;
  page?: number;
  pageSize?: number;
}

export function listarMovimientos(params: ListarMovimientosParams = {}): Promise<ListarMovimientosCajaResponse> {
  return apiRequest<ListarMovimientosCajaResponse>("/api/caja", { query: { ...params } });
}

export interface CrearMovimientoInput {
  tipo: TipoMovimientoCaja;
  categoria: string;
  monto: number;
  fecha?: string;
  concepto?: string;
  receptor?: string;
  emisor?: string;
}

export function crearMovimiento(input: CrearMovimientoInput) {
  return apiRequest("/api/caja", { method: "POST", body: input });
}
