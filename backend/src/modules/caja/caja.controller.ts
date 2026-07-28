import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { crearMovimientoSchema, listarMovimientosQuerySchema } from "./caja.schema";
import { crearMovimiento, listarMovimientos } from "./caja.service";

export async function crearMovimientoHandler(req: Request, res: Response): Promise<void> {
  const parsed = crearMovimientoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos invalidos");
  }

  const resultado = await crearMovimiento(parsed.data);
  res.status(201).json(resultado);
}

export async function listarMovimientosHandler(req: Request, res: Response): Promise<void> {
  const parsed = listarMovimientosQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Parametros de busqueda invalidos");
  }

  const resultado = await listarMovimientos(parsed.data);
  res.json(resultado);
}
