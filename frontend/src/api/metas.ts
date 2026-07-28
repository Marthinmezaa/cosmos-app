import { apiRequest } from "../lib/api-client";
import type { MetaMensual } from "../lib/types";

export function listarMetas(): Promise<MetaMensual[]> {
  return apiRequest<MetaMensual[]>("/api/metas");
}

export interface CrearMetaInput {
  mes: number;
  anio: number;
  metaVentas: number;
}

export function crearMeta(input: CrearMetaInput): Promise<MetaMensual> {
  return apiRequest<MetaMensual>("/api/metas", { method: "POST", body: input });
}

export function actualizarMeta(id: number, metaVentas: number): Promise<MetaMensual> {
  return apiRequest<MetaMensual>(`/api/metas/${id}`, { method: "PATCH", body: { metaVentas } });
}
