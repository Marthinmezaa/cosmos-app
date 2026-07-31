import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { actualizarActivo, crearUsuario, listarUsuarios, resetPasswordUsuario } from "./usuarios.controller";

export const usuariosRouter = Router();

// Solo el admin gestiona cuentas de admin/vendedor. Las cuentas 'cliente' se crean
// junto con el alta de cliente (punto 4), no acá.
usuariosRouter.use(authenticate, authorize("admin"));

usuariosRouter.get("/", asyncHandler(listarUsuarios));
usuariosRouter.post("/", asyncHandler(crearUsuario));
usuariosRouter.patch("/:id/reset-password", asyncHandler(resetPasswordUsuario));
usuariosRouter.patch("/:id/activo", asyncHandler(actualizarActivo));
