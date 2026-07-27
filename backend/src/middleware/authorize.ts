import type { NextFunction, Request, Response } from "express";
import type { Rol } from "../types/auth";
import { forbidden } from "../utils/errors";

export function authorize(...allowedRoles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      throw forbidden("No tenés permisos para acceder a este recurso");
    }
    next();
  };
}
