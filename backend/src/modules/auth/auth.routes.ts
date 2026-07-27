import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { asyncHandler } from "../../utils/async-handler";
import { loginHandler, meHandler } from "./auth.controller";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos." },
});

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, asyncHandler(loginHandler));
authRouter.get("/me", authenticate, meHandler);
