import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import {
  actualizarCliente,
  actualizarEquipo,
  actualizarVehiculo,
  crearCliente,
  listarClientesHandler,
  obtenerCliente,
} from "./clientes.controller";

export const clientesRouter = Router();

clientesRouter.use(authenticate);

// El vendedor solo puede dar de alta clientes — no lista, ve el detalle ni edita otros clientes.
clientesRouter.post("/", authorize("admin", "vendedor"), asyncHandler(crearCliente));

clientesRouter.get("/", authorize("admin"), asyncHandler(listarClientesHandler));
clientesRouter.get("/:id", authorize("admin"), asyncHandler(obtenerCliente));
clientesRouter.patch("/:id", authorize("admin"), asyncHandler(actualizarCliente));
clientesRouter.patch("/:id/vehiculo", authorize("admin"), asyncHandler(actualizarVehiculo));
clientesRouter.patch("/:id/equipo", authorize("admin"), asyncHandler(actualizarEquipo));
