import type { Cuota } from "./types";

const DIAS_GRACIA = 5;

export function estadoCuota(cuota: Cuota): { label: string; className: string } {
  if (cuota.estado === "pagada") {
    return { label: "Pagada", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(`${cuota.fechaVencimiento}T00:00:00`);
  const limiteDescuento = new Date(vencimiento);
  limiteDescuento.setDate(limiteDescuento.getDate() + DIAS_GRACIA);

  if (hoy <= vencimiento) {
    return { label: "Pendiente", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  }
  if (hoy <= limiteDescuento) {
    return { label: "Vencida (con descuento)", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  }
  return { label: "En mora", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
}
