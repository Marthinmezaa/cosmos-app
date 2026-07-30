import type { Request, Response } from "express";
import { obtenerEstadoCuenta } from "./portal.service";

export async function obtenerEstadoCuentaHandler(req: Request, res: Response): Promise<void> {
  // clienteId sale siempre de req.user, nunca de params: un cliente jamás debe
  // poder pedir el estado de cuenta de otro pasando un id distinto.
  const resultado = await obtenerEstadoCuenta(req.user!.clienteId!);
  res.json(resultado);
}
