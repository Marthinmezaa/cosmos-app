import { z } from "zod";

const emailSchema = z
  .string()
  .email("Email inválido")
  .transform((email) => email.trim().toLowerCase());

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto"),
  email: emailSchema,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  // El rol 'cliente' no se crea acá: se genera al dar de alta un cliente (punto 4).
  rol: z.enum(["admin", "vendedor"]),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
