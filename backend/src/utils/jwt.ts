import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Rol } from "../types/auth";

export interface AccessTokenPayload {
  sub: number;
  rol: Rol;
  clienteId: number | null;
}

const ACCESS_TOKEN_EXPIRATION = "8h";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as unknown as AccessTokenPayload;
}
