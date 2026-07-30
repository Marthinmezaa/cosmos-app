import type { Request, Response } from "express";
import { badRequest } from "../../utils/errors";
import { presignUploadSchema } from "./uploads.schema";
import { generarUploadPresignado } from "./uploads.service";

export async function presignUploadHandler(req: Request, res: Response): Promise<void> {
  const parsed = presignUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const resultado = await generarUploadPresignado(parsed.data);
  res.json(resultado);
}
