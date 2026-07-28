import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { obtenerDashboard } from "./dashboard.controller";

export const dashboardRouter = Router();

// El dashboard expone datos de caja/ingresos y clientes en mora: solo admin.
dashboardRouter.get("/", authenticate, authorize("admin"), asyncHandler(obtenerDashboard));
