import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { dashboardQuerySchema } from "./dashboard.schema";
import { obtenerResumenDashboard } from "./dashboard.service";

export async function obtenerDashboard(req: Request, res: Response): Promise<void> {
  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Parámetros inválidos");
  }

  const resumen = await obtenerResumenDashboard(parsed.data.mes, parsed.data.anio);
  res.json(resumen);
}
