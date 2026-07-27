import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { crearContrato, obtenerContrato, pagarCuotasContrato } from "./contratos.controller";

export const contratosRouter = Router();

contratosRouter.use(authenticate);

// admin y vendedor pueden vender/crear contratos; el vendedor_id sale del usuario logueado.
contratosRouter.post("/", authorize("admin", "vendedor"), asyncHandler(crearContrato));

// Cobrar cuotas y ver el detalle de un contrato involucra caja/dinero: solo admin.
contratosRouter.get("/:id", authorize("admin"), asyncHandler(obtenerContrato));
contratosRouter.post("/:id/pagos", authorize("admin"), asyncHandler(pagarCuotasContrato));
