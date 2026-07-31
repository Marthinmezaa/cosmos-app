import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import {
  actualizarActivoUsuario,
  crearUsuarioAdminOVendedor,
  listarUsuariosAdminVendedor,
  resetearPassword,
} from "./usuarios.service";
import { actualizarActivoSchema, crearUsuarioSchema, listarUsuariosQuerySchema } from "./usuarios.schema";

function parseUsuarioId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw badRequest("Id de usuario inválido");
  }
  return id;
}

export async function crearUsuario(req: Request, res: Response): Promise<void> {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const usuario = await crearUsuarioAdminOVendedor(parsed.data);
  res.status(201).json(usuario);
}

export async function resetPasswordUsuario(req: Request, res: Response): Promise<void> {
  const usuarioId = parseUsuarioId(req.params.id);
  const resultado = await resetearPassword(usuarioId);
  res.json(resultado);
}

export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  const parsed = listarUsuariosQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Parámetros de búsqueda inválidos");
  }

  const usuarios = await listarUsuariosAdminVendedor(parsed.data);
  res.json(usuarios);
}

export async function actualizarActivo(req: Request, res: Response): Promise<void> {
  const usuarioId = parseUsuarioId(req.params.id);
  const parsed = actualizarActivoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const usuario = await actualizarActivoUsuario(usuarioId, parsed.data.activo, req.user!.id);
  res.json(usuario);
}
