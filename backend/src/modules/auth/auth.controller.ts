import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { login } from "./auth.service";
import { loginSchema } from "./auth.schema";

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await login(parsed.data);
  res.json(resultado);
}

export function meHandler(req: Request, res: Response): void {
  res.json(req.user);
}
