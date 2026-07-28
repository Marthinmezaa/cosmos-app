import { sumMovimientosDelMes, sumSaldoEnCaja } from "../caja/caja.repository";
import { findMetaByMesAnio } from "../metas/metas.repository";
import {
  countClientesActivos,
  listClientesEnMora,
  listCuotasProximas,
  listInstalacionesDelMesPorTipo,
  obtenerCuotasDelMes,
  sumFacturacionDelMes,
  type CuotaProximaRow,
} from "./dashboard.repository";

// Cliente en mora 3+ meses: alerta visual (regla de negocio 3). La desactivacion sigue siendo siempre manual.
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

function calcularPorcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : parte / total;
}

export async function obtenerResumenDashboard(mes: number, anio: number) {
  const [
    cuotasHoy,
    cuotasSemana,
    clientesEnMora,
    cuotasDelMes,
    facturacionDelMes,
    clientesActivos,
    instalacionesDelMesPorTipo,
    ingresosDelMes,
    egresosDelMes,
    saldoEnCaja,
    meta,
  ] = await Promise.all([
    listCuotasProximas(0),
    listCuotasProximas(7),
    listClientesEnMora(),
    obtenerCuotasDelMes(mes, anio),
    sumFacturacionDelMes(mes, anio),
    countClientesActivos(),
    listInstalacionesDelMesPorTipo(mes, anio),
    sumMovimientosDelMes("ingreso", mes, anio),
    sumMovimientosDelMes("egreso", mes, anio),
    sumSaldoEnCaja(),
    findMetaByMesAnio(mes, anio),
  ]);

  const total = Number(cuotasDelMes.total);
  const pagadas = Number(cuotasDelMes.pagadas);
  const vencidas = Number(cuotasDelMes.vencidas);
  const vigentes = Number(cuotasDelMes.vigentes);

  const instalacionesPorTipo = instalacionesDelMesPorTipo.map((row) => ({
    tipo: row.tipo,
    cantidad: Number(row.cantidad),
  }));
  const totalInstalado = instalacionesPorTipo.reduce((acc, row) => acc + row.cantidad, 0);

  return {
    periodo: { mes, anio },

    cuotasDelMes: {
      total,
      pagadas,
      vencidas,
      vigentes,
      porcentajeAtraso: calcularPorcentaje(vencidas, total),
      porcentajePago: calcularPorcentaje(pagadas, total),
    },

    clientesActivos,
    facturacionDelMes,
    caja: { ingresosDelMes, egresosDelMes, saldoEnCaja },
    instalacionesDelMesPorTipo: instalacionesPorTipo,

    meta: meta
      ? {
          metaVentas: meta.meta_ventas,
          instalado: totalInstalado,
          superada: totalInstalado >= meta.meta_ventas,
        }
      : null,

    cuotasHoy: cuotasHoy.map(toPublicCuotaProxima),
    cuotasSemana: cuotasSemana.map(toPublicCuotaProxima),
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
