import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import {
  actualizarClienteSchema,
  actualizarEquipoSchema,
  actualizarVehiculoSchema,
  crearClienteSchema,
  listarClientesQuerySchema,
} from "./clientes.schema";
import {
  actualizarClienteDatos,
  actualizarEquipoDeCliente,
  actualizarVehiculoDeCliente,
  crearClienteCompleto,
  listarClientes,
  obtenerClienteCompleto,
} from "./clientes.service";

function parseId(rawId: string, entidad: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    throw badRequest(`Id de ${entidad} inválido`);
  }
  return id;
}

export async function crearCliente(req: Request, res: Response): Promise<void> {
  const parsed = crearClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await crearClienteCompleto(parsed.data);
  res.status(201).json(resultado);
}

export async function listarClientesHandler(req: Request, res: Response): Promise<void> {
  const parsed = listarClientesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Parámetros de búsqueda inválidos");
  }

  const resultado = await listarClientes(parsed.data);
  res.json(resultado);
}

export async function obtenerCliente(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, "cliente");
  const resultado = await obtenerClienteCompleto(id);
  res.json(resultado);
}

export async function actualizarCliente(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, "cliente");
  const parsed = actualizarClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await actualizarClienteDatos(id, parsed.data);
  res.json(resultado);
}

export async function actualizarVehiculo(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, "cliente");
  const vehiculoId = parseId(req.params.vehiculoId, "vehículo");
  const parsed = actualizarVehiculoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await actualizarVehiculoDeCliente(id, vehiculoId, parsed.data);
  res.json(resultado);
}

export async function actualizarEquipo(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id, "cliente");
  const equipoId = parseId(req.params.equipoId, "equipo");
  const parsed = actualizarEquipoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await actualizarEquipoDeCliente(id, equipoId, parsed.data);
  res.json(resultado);
}
