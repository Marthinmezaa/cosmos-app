import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { r2Client } from "../../config/r2";
import { extensionParaContentType, type PresignUploadInput } from "./uploads.schema";

const URL_EXPIRA_EN_SEGUNDOS = 5 * 60;

/**
 * Genera una URL prefirmada de subida (PUT) directa a R2: el archivo va del
 * navegador a Cloudflare sin pasar por este servidor. La key es siempre un
 * UUID generado acá (nunca el nombre de archivo del cliente), para que dos
 * fotos no puedan pisarse ni un nombre raro rompa la URL pública.
 */
export async function generarUploadPresignado(input: PresignUploadInput) {
  const extension = extensionParaContentType(input.contentType);
  const key = `clientes/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: URL_EXPIRA_EN_SEGUNDOS });
  const publicUrl = `${env.R2_PUBLIC_URL_BASE}/${key}`;

  return { uploadUrl, publicUrl };
}
