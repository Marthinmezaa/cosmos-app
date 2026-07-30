import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

// R2 es compatible con la API de S3: mismo SDK, solo cambia el endpoint (el de la
// cuenta de Cloudflare en vez de AWS) y "region" es un valor fijo sin efecto real.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
