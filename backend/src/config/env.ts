import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID es obligatorio"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID es obligatorio"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY es obligatorio"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME es obligatorio"),
  // URL pública del bucket (R2.dev o dominio propio), sin barra final. Ej:
  // https://pub-xxxxxxxx.r2.dev
  R2_PUBLIC_URL_BASE: z.string().url("R2_PUBLIC_URL_BASE debe ser una URL válida"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Configuración de entorno inválida. Revisá tu archivo .env");
  }

  return parsed.data;
}

export const env = loadEnv();
