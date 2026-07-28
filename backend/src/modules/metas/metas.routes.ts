import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { actualizarMetaHandler, crearMetaHandler, listarMetasHandler } from "./metas.controller";

export const metasRouter = Router();

metasRouter.use(authenticate, authorize("admin"));

metasRouter.post("/", asyncHandler(crearMetaHandler));
metasRouter.get("/", asyncHandler(listarMetasHandler));
metasRouter.patch("/:id", asyncHandler(actualizarMetaHandler));
