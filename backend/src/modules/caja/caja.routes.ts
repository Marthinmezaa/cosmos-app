import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { crearMovimientoHandler, listarMovimientosHandler } from "./caja.controller";

export const cajaRouter = Router();

// Manejo de dinero: solo admin.
cajaRouter.use(authenticate, authorize("admin"));

cajaRouter.post("/", asyncHandler(crearMovimientoHandler));
cajaRouter.get("/", asyncHandler(listarMovimientosHandler));
