import { sumMovimientosDelMes, sumSaldoEnCaja } from "../caja/caja.repository";
import { findMetaByMesAnio } from "../metas/metas.repository";
import {
  countClientesActivos,
  listClientesEnMora,
  listCuotasProximas,
  listInstalacionesDelMesPorTipo,
  listInstalacionesPorAnio,
  obtenerCuotasDelMes,
  sumFacturacionDelMes,
  type CuotaProximaRow,
  type InstalacionesPorAnioMesRow,
} from "./dashboard.repository";

const ANIOS_AVANCE_ANUAL = 3;
const MESES_DEL_ANIO = 12;

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

/** Instalaciones acumuladas mes a mes, un array de 12 valores por anio (para el grafico "avance anual"). */
function armarAvanceAnual(anios: number[], filas: InstalacionesPorAnioMesRow[]) {
  return anios.map((anio) => {
    const porMes = new Array<number>(MESES_DEL_ANIO).fill(0);
    for (const fila of filas) {
      if (fila.anio === anio) porMes[fila.mes - 1] = Number(fila.cantidad);
    }

    const acumulado: number[] = [];
    let corrida = 0;
    for (const cantidad of porMes) {
      corrida += cantidad;
      acumulado.push(corrida);
    }

    return { anio, valores: acumulado };
  });
}

export async function obtenerResumenDashboard(mes: number, anio: number) {
  const aniosAvanceAnual = Array.from({ length: ANIOS_AVANCE_ANUAL }, (_, i) => anio - ANIOS_AVANCE_ANUAL + 1 + i);

  const [
    cuotasHoy,
    cuotasSemana,
    clientesEnMora,
    cuotasDelMes,
    facturacionDelMes,
    clientesActivos,
    instalacionesDelMesPorTipo,
    instalacionesPorAnio,
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
    listInstalacionesPorAnio(aniosAvanceAnual),
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
    avanceAnual: armarAvanceAnual(aniosAvanceAnual, instalacionesPorAnio),

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
