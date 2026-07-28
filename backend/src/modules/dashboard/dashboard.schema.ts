import { z } from "zod";

// Por defecto, el mes/anio actual (regla de negocio 6: dashboard en tiempo real).
const hoy = () => new Date();

export const dashboardQuerySchema = z.object({
  mes: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .default(() => hoy().getMonth() + 1),
  anio: z.coerce
    .number()
    .int()
    .min(2000)
    .default(() => hoy().getFullYear()),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
