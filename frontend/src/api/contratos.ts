import { apiRequest } from "../lib/api-client";
import type { Contrato, ContratoConCuotas, CrearContratoInput, CrearContratoResponse, PagarCuotasInput, PagarCuotasResponse } from "../lib/types";

export function crearContrato(input: CrearContratoInput): Promise<CrearContratoResponse> {
  return apiRequest<CrearContratoResponse>("/api/contratos", { method: "POST", body: input });
}

export function listarContratosDeCliente(clienteId: number): Promise<Contrato[]> {
  return apiRequest<Contrato[]>("/api/contratos", { query: { clienteId } });
}

export function obtenerContrato(id: number): Promise<ContratoConCuotas> {
  return apiRequest<ContratoConCuotas>(`/api/contratos/${id}`);
}

export function pagarCuotas(contratoId: number, input: PagarCuotasInput = {}): Promise<PagarCuotasResponse> {
  return apiRequest<PagarCuotasResponse>(`/api/contratos/${contratoId}/pagos`, { method: "POST", body: input });
}
