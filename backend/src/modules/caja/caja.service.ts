import { insertMovimiento, listMovimientos, type CajaRow } from "./caja.repository";
import type { CrearMovimientoInput, ListarMovimientosQuery } from "./caja.schema";

function toPublicMovimiento(row: CajaRow) {
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    monto: row.monto,
    fecha: row.fecha,
    concepto: row.concepto,
    receptor: row.receptor,
    emisor: row.emisor,
  };
}

export async function crearMovimiento(input: CrearMovimientoInput) {
  const movimiento = await insertMovimiento(input);
  return toPublicMovimiento(movimiento);
}

export async function listarMovimientos(query: ListarMovimientosQuery) {
  const { data, total } = await listMovimientos(query);
  return {
    data: data.map(toPublicMovimiento),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
