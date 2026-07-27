import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Error no controlado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    ...(env.NODE_ENV !== "production" && err instanceof Error ? { detail: err.message } : {}),
  });
}
