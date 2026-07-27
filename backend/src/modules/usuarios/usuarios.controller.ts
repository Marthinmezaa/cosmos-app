import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { crearUsuarioAdminOVendedor, resetearPassword } from "./usuarios.service";
import { crearUsuarioSchema } from "./usuarios.schema";

export async function crearUsuario(req: Request, res: Response): Promise<void> {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const usuario = await crearUsuarioAdminOVendedor(parsed.data);
  res.status(201).json(usuario);
}

export async function resetPasswordUsuario(req: Request, res: Response): Promise<void> {
  const usuarioId = Number(req.params.id);
  if (!Number.isInteger(usuarioId)) {
    throw badRequest("Id de usuario inválido");
  }

  const resultado = await resetearPassword(usuarioId);
  res.json(resultado);
}
