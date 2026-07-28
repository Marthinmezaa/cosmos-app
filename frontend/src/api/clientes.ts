import { apiRequest } from "../lib/api-client";
import type {
  Cliente,
  ClienteCompleto,
  CrearClienteInput,
  Equipo,
  EstadoCliente,
  ListarClientesResponse,
  Vehiculo,
} from "../lib/types";

export interface ListarClientesParams {
  estado?: EstadoCliente;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}

export function listarClientes(params: ListarClientesParams = {}): Promise<ListarClientesResponse> {
  return apiRequest<ListarClientesResponse>("/api/clientes", { query: { ...params } });
}

export function obtenerCliente(id: number): Promise<ClienteCompleto> {
  return apiRequest<ClienteCompleto>(`/api/clientes/${id}`);
}

export function crearCliente(input: CrearClienteInput): Promise<ClienteCompleto> {
  return apiRequest<ClienteCompleto>("/api/clientes", { method: "POST", body: input });
}

export interface ActualizarClienteInput {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  estado?: EstadoCliente;
}

export function actualizarCliente(id: number, input: ActualizarClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>(`/api/clientes/${id}`, { method: "PATCH", body: input });
}

export type ActualizarVehiculoInput = Partial<Omit<Vehiculo, "id">>;

export function actualizarVehiculo(clienteId: number, input: ActualizarVehiculoInput): Promise<Vehiculo> {
  return apiRequest<Vehiculo>(`/api/clientes/${clienteId}/vehiculo`, { method: "PATCH", body: input });
}

export type ActualizarEquipoInput = Partial<Omit<Equipo, "id">>;

export function actualizarEquipo(clienteId: number, input: ActualizarEquipoInput): Promise<Equipo> {
  return apiRequest<Equipo>(`/api/clientes/${clienteId}/equipo`, { method: "PATCH", body: input });
}
