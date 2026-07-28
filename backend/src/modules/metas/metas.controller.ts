import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { actualizarMetaSchema, crearMetaSchema } from "./metas.schema";
import { actualizarMeta, crearMeta, listarMetas } from "./metas.service";

function parseMetaId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw badRequest("Id de meta inválido");
  }
  return id;
}

export async function crearMetaHandler(req: Request, res: Response): Promise<void> {
  const parsed = crearMetaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await crearMeta(parsed.data);
  res.status(201).json(resultado);
}

export async function actualizarMetaHandler(req: Request, res: Response): Promise<void> {
  const id = parseMetaId(req.params.id);
  const parsed = actualizarMetaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await actualizarMeta(id, parsed.data);
  res.json(resultado);
}

export async function listarMetasHandler(_req: Request, res: Response): Promise<void> {
  const resultado = await listarMetas();
  res.json(resultado);
}
