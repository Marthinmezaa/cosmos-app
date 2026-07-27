import { Router } from "express";
import { checkDatabaseConnection } from "../config/db";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const databaseConnected = await checkDatabaseConnection();

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "unreachable",
    timestamp: new Date().toISOString(),
  });
});
