import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { obtenerEstadoCuentaHandler } from "./portal.controller";

export const portalRouter = Router();

portalRouter.use(authenticate);

// Solo el propio cliente ve su estado de cuenta (portal de solo lectura, sin :id en la URL).
portalRouter.get("/estado-cuenta", authorize("cliente"), asyncHandler(obtenerEstadoCuentaHandler));
