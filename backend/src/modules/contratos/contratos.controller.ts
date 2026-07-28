import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { crearContratoConPrimeraCuota, listarContratosPorCliente, obtenerContratoConCuotas, pagarCuotas } from "./contratos.service";
import { crearContratoSchema, listarContratosQuerySchema, pagarCuotasSchema } from "./contratos.schema";

function parseContratoId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw badRequest("Id de contrato inválido");
  }
  return id;
}

export async function crearContrato(req: Request, res: Response): Promise<void> {
  const parsed = crearContratoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  // El vendedor se completa con el usuario logueado, nunca a mano (regla de negocio 5).
  const resultado = await crearContratoConPrimeraCuota(parsed.data, req.user!.id);
  res.status(201).json(resultado);
}

export async function listarContratosHandler(req: Request, res: Response): Promise<void> {
  const parsed = listarContratosQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Parámetros de búsqueda inválidos");
  }

  const resultado = await listarContratosPorCliente(parsed.data.clienteId);
  res.json(resultado);
}

export async function obtenerContrato(req: Request, res: Response): Promise<void> {
  const id = parseContratoId(req.params.id);
  const resultado = await obtenerContratoConCuotas(id);
  res.json(resultado);
}

export async function pagarCuotasContrato(req: Request, res: Response): Promise<void> {
  const id = parseContratoId(req.params.id);
  const parsed = pagarCuotasSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await pagarCuotas(id, parsed.data);
  res.json(resultado);
}
