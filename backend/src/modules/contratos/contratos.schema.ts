import { z } from "zod";

const requerido = (campo: string) => ({ required_error: `${campo} es obligatorio` });

// vendedorId NO se acepta acá a propósito (regla de negocio 5): siempre sale de
// req.user, nunca del body, ni siquiera si el admin lo manda.
export const crearContratoSchema = z
  .object({
    clienteId: z.number(requerido("El cliente")).int().positive(),
    instalador: z.string().trim().min(1).optional(),
    precioNormal: z.number(requerido("El precio normal")).positive(),
    precioPromocional: z.number(requerido("El precio promocional")).nonnegative(),
    fechaInicio: z.string().date("Fecha inválida (usar YYYY-MM-DD)").optional(),
    tipoVenta: z.string(requerido("El tipo de venta")).trim().min(1),
  })
  .refine((data) => data.precioPromocional <= data.precioNormal, {
    message: "El precio promocional no puede ser mayor al precio normal",
    path: ["precioPromocional"],
  });

export type CrearContratoInput = z.infer<typeof crearContratoSchema>;

export const pagarCuotasSchema = z.object({
  cantidadMeses: z.number().int().min(1, "Debe pagar al menos 1 mes").max(24, "Máximo 24 meses por pago").default(1),
  fechaPago: z.string().date("Fecha inválida (usar YYYY-MM-DD)").optional(),
  cobrador: z.string().trim().min(1).optional(),
});

export type PagarCuotasInput = z.infer<typeof pagarCuotasSchema>;
