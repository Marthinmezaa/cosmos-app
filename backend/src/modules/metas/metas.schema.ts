import { z } from "zod";

const requerido = (campo: string) => ({ required_error: `${campo} es obligatorio` });

export const crearMetaSchema = z.object({
  mes: z.number(requerido("El mes")).int().min(1).max(12),
  anio: z.number(requerido("El año")).int().min(2000),
  metaVentas: z.number(requerido("La meta de ventas")).int().min(0),
});

export type CrearMetaInput = z.infer<typeof crearMetaSchema>;

export const actualizarMetaSchema = z.object({
  metaVentas: z.number(requerido("La meta de ventas")).int().min(0),
});

export type ActualizarMetaInput = z.infer<typeof actualizarMetaSchema>;
