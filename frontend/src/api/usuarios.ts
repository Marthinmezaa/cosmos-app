import { apiRequest } from "../lib/api-client";
import type { CrearUsuarioInput, ResetPasswordResponse, RolGestionable, Usuario } from "../lib/types";

export interface ListarUsuariosParams {
  rol?: RolGestionable;
  activo?: boolean;
  busqueda?: string;
}

export function listarUsuarios(params: ListarUsuariosParams = {}): Promise<Usuario[]> {
  return apiRequest<Usuario[]>("/api/usuarios", {
    query: {
      rol: params.rol,
      activo: params.activo === undefined ? undefined : String(params.activo),
      busqueda: params.busqueda,
    },
  });
}

export function crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
  return apiRequest<Usuario>("/api/usuarios", { method: "POST", body: input });
}

export function resetearPassword(id: number): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>(`/api/usuarios/${id}/reset-password`, { method: "PATCH" });
}

export function actualizarActivo(id: number, activo: boolean): Promise<Usuario> {
  return apiRequest<Usuario>(`/api/usuarios/${id}/activo`, { method: "PATCH", body: { activo } });
}
