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

export const listarUsuariosQuerySchema = z.object({
  rol: z.enum(["admin", "vendedor"]).optional(),
  // z.coerce.boolean() no sirve para query params: Boolean("false") da true. Se
  // valida el string explícito y recién ahí se convierte.
  activo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  busqueda: z.string().trim().min(1).optional(),
});

export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;

export const actualizarActivoSchema = z.object({
  activo: z.boolean(),
});

export type ActualizarActivoInput = z.infer<typeof actualizarActivoSchema>;
