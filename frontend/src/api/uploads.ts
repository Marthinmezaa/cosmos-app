import { apiRequest, ApiError } from "../lib/api-client";

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Sube un archivo directo a Cloudflare R2: pide una URL prefirmada a nuestro
 * backend y despues el PUT del archivo va directo a R2, sin pasar por
 * nuestro servidor. Devuelve la URL pública final (url_r2).
 */
export async function subirFoto(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await apiRequest<PresignResponse>("/api/uploads/presign", {
    method: "POST",
    body: { contentType: file.type },
  });

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new ApiError(res.status, "No se pudo subir la foto a Cloudflare R2");
  }

  return publicUrl;
}
