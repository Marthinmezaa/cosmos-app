import { z } from "zod";

const CONTENT_TYPE_A_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const presignUploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Tipo de archivo no soportado (solo JPEG, PNG o WEBP)" }),
  }),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export function extensionParaContentType(contentType: string): string {
  return CONTENT_TYPE_A_EXTENSION[contentType];
}
