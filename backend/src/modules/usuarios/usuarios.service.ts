import { badRequest, conflict } from "../../utils/errors";
import { enviarPasswordTemporal } from "../../utils/mailer";
import { generateTemporaryPassword, hashPassword } from "../../utils/password";
import {
  findUsuarioByEmail,
  findUsuarioById,
  insertUsuario,
  listUsuariosAdminVendedor,
  updateActivo,
  updatePasswordHash,
  type ListUsuariosFilter,
  type UsuarioRow,
} from "./usuarios.repository";
import type { CrearUsuarioInput } from "./usuarios.schema";

export function toPublicUsuario(row: UsuarioRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    clienteId: row.cliente_id,
    activo: row.activo,
    createdAt: row.created_at,
  };
}

export async function crearUsuarioAdminOVendedor(input: CrearUsuarioInput) {
  const existente = await findUsuarioByEmail(input.email);
  if (existente) {
    throw conflict("Ya existe un usuario con ese email");
  }

  const passwordHash = await hashPassword(input.password);
  const usuario = await insertUsuario({
    nombre: input.nombre,
    email: input.email,
    passwordHash,
    rol: input.rol,
  });

  return toPublicUsuario(usuario);
}

export async function resetearPassword(usuarioId: number) {
  const usuario = await findUsuarioById(usuarioId);
  if (!usuario) {
    throw badRequest("El usuario no existe");
  }

  const passwordTemporal = generateTemporaryPassword();
  const passwordHash = await hashPassword(passwordTemporal);
  await updatePasswordHash(usuarioId, passwordHash);
  await enviarPasswordTemporal(usuario.email, usuario.nombre, passwordTemporal);

  return { usuario: toPublicUsuario(usuario), passwordTemporal };
}

export async function listarUsuariosAdminVendedor(filter: ListUsuariosFilter) {
  const usuarios = await listUsuariosAdminVendedor(filter);
  return usuarios.map(toPublicUsuario);
}

export async function actualizarActivoUsuario(usuarioId: number, activo: boolean, usuarioActualId: number) {
  if (usuarioId === usuarioActualId && !activo) {
    throw badRequest("No podés desactivar tu propia cuenta");
  }

  const usuario = await updateActivo(usuarioId, activo);
  if (!usuario) {
    throw badRequest("El usuario no existe");
  }

  return toPublicUsuario(usuario);
}
