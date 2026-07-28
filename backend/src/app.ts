import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { clientesRouter } from "./modules/clientes/clientes.routes";
import { contratosRouter } from "./modules/contratos/contratos.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes";
import { healthRouter } from "./routes/health.route";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/clientes", clientesRouter);
  app.use("/api/contratos", contratosRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
