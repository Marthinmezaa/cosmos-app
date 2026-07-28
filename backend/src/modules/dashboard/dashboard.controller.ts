import type { Request, Response } from "express";
import { obtenerResumenDashboard } from "./dashboard.service";

export async function obtenerDashboard(_req: Request, res: Response): Promise<void> {
  const resumen = await obtenerResumenDashboard();
  res.json(resumen);
}
