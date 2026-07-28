import {
  listClientesEnMora,
  listCuotasProximas,
  listInstalacionesPorTipo,
  sumEgresosDelMes,
  sumIngresosDelMes,
  type CuotaProximaRow,
} from "./dashboard.repository";

// Cliente en mora 3+ meses: alerta visual (regla de negocio 3). La desactivación sigue siendo siempre manual.
const MESES_MORA_ALERTA = 3;

function toPublicCuotaProxima(row: CuotaProximaRow) {
  return {
    cuotaId: row.cuota_id,
    contratoId: row.contrato_id,
    clienteId: row.cliente_id,
    clienteNombre: `${row.cliente_nombre} ${row.cliente_apellido}`,
    numeroCuota: row.numero_cuota,
    fechaVencimiento: row.fecha_vencimiento,
    montoACobrar: row.monto_a_cobrar,
  };
}

export async function obtenerResumenDashboard() {
  const [cuotasHoy, cuotasSemana, ingresosMes, egresosMes, instalacionesPorTipo, clientesEnMora] = await Promise.all([
    listCuotasProximas(0),
    listCuotasProximas(7),
    sumIngresosDelMes(),
    sumEgresosDelMes(),
    listInstalacionesPorTipo(),
    listClientesEnMora(),
  ]);

  return {
    cuotasHoy: cuotasHoy.map(toPublicCuotaProxima),
    cuotasSemana: cuotasSemana.map(toPublicCuotaProxima),
    ingresosMes,
    egresosMes,
    instalacionesPorTipo: instalacionesPorTipo.map((row) => ({
      tipo: row.tipo,
      cantidad: Number(row.cantidad),
    })),
    clientesEnMora: clientesEnMora.map((row) => ({
      clienteId: row.cliente_id,
      clienteNombre: `${row.cliente_nombre} ${row.cliente_apellido}`,
      contratoId: row.contrato_id,
      cuotaId: row.cuota_id,
      numeroCuota: row.numero_cuota,
      fechaVencimiento: row.fecha_vencimiento,
      mesesMora: row.meses_mora,
      alerta: row.meses_mora >= MESES_MORA_ALERTA,
    })),
  };
}
