import { z } from "zod";

const requerido = (campo: string) => ({ required_error: `${campo} es obligatorio` });

export const crearMovimientoSchema = z.object({
  tipo: z.enum(["ingreso", "egreso"], requerido("El tipo de movimiento")),
  categoria: z.string(requerido("La categoria")).trim().min(1, "La categoria es obligatoria"),
  monto: z.number(requerido("El monto")).positive("El monto debe ser mayor a cero"),
  fecha: z.string().date("Fecha invalida (usar YYYY-MM-DD)").optional(),
  concepto: z.string().trim().min(1).optional(),
  receptor: z.string().trim().min(1).optional(),
  emisor: z.string().trim().min(1).optional(),
});

export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>;

export const listarMovimientosQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12).optional(),
  anio: z.coerce.number().int().min(2000).optional(),
  tipo: z.enum(["ingreso", "egreso"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListarMovimientosQuery = z.infer<typeof listarMovimientosQuerySchema>;
