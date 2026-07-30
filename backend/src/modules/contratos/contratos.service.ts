import type { PoolClient } from "pg";
import { findClienteById } from "../clientes/clientes.repository";
import {
  findPendienteMasAntiguaByContratoId,
  insertCuotaSiguiente,
  insertPrimeraCuota,
  listCuotasByContratoId,
  marcarCuotaPagada,
  type CuotaRow,
} from "../cuotas/cuotas.repository";
import { pool } from "../../config/db";
import { translatePgError } from "../../utils/db-errors";
import { badRequest, conflict, notFound } from "../../utils/errors";
import { findContratoById, findContratosByClienteId, insertContrato, type ContratoRow } from "./contratos.repository";
import type { CrearContratoInput, PagarCuotasInput } from "./contratos.schema";

export function toPublicContrato(row: ContratoRow) {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    vendedorId: row.vendedor_id,
    instalador: row.instalador,
    precioNormal: row.precio_normal,
    precioPromocional: row.precio_promocional,
    fechaInicio: row.fecha_inicio,
    tipoVenta: row.tipo_venta,
  };
}

export function toPublicCuota(row: CuotaRow) {
  return {
    id: row.id,
    numeroCuota: row.numero_cuota,
    fechaVencimiento: row.fecha_vencimiento,
    fechaPago: row.fecha_pago,
    montoPagado: row.monto_pagado,
    montoACobrar: row.monto_a_cobrar,
    estado: row.estado,
    cobrador: row.cobrador,
  };
}

export async function crearContratoConPrimeraCuota(input: CrearContratoInput, vendedorId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cliente = await findClienteById(input.clienteId);
    if (!cliente) {
      throw notFound("El cliente no existe");
    }
    if (cliente.estado !== "activo") {
      throw badRequest("No se puede crear un contrato para un cliente suspendido");
    }

    const contrato = await insertContrato(client, {
      clienteId: input.clienteId,
      vendedorId,
      instalador: input.instalador,
      precioNormal: input.precioNormal,
      precioPromocional: input.precioPromocional,
      fechaInicio: input.fechaInicio,
      tipoVenta: input.tipoVenta,
    });

    const primeraCuota = await insertPrimeraCuota(client, {
      contratoId: contrato.id,
      fechaVencimiento: contrato.fecha_inicio,
      montoACobrar: contrato.precio_promocional,
    });

    await client.query("COMMIT");

    return { contrato: toPublicContrato(contrato), primeraCuota: toPublicCuota(primeraCuota) };
  } catch (err) {
    await client.query("ROLLBACK");
    throw translatePgError(err) ?? err;
  } finally {
    client.release();
  }
}

export async function listarContratosPorCliente(clienteId: number) {
  const contratos = await findContratosByClienteId(clienteId);
  return contratos.map(toPublicContrato);
}

export async function obtenerContratoConCuotas(id: number) {
  const contrato = await findContratoById(id);
  if (!contrato) {
    throw notFound("El contrato no existe");
  }

  const cuotas = await listCuotasByContratoId(id);

  return { contrato: toPublicContrato(contrato), cuotas: cuotas.map(toPublicCuota) };
}

/**
 * Busca la cuota pendiente más antigua del contrato; si no hay ninguna (porque la
 * última ya se pagó), genera la siguiente. Así siempre hay una única cuota "en
 * juego" por contrato, nunca varias sin resolver acumulándose.
 */
async function obtenerOCrearSiguientePendiente(client: PoolClient, contrato: ContratoRow): Promise<CuotaRow> {
  const pendiente = await findPendienteMasAntiguaByContratoId(client, contrato.id);
  if (pendiente) return pendiente;
  return insertCuotaSiguiente(client, contrato.id, contrato.precio_promocional);
}

export async function pagarCuotas(contratoId: number, input: PagarCuotasInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const contrato = await findContratoById(contratoId);
    if (!contrato) {
      throw notFound("El contrato no existe");
    }

    const fechaPago = input.fechaPago ?? new Date().toISOString().slice(0, 10);
    const cuotasPagadas: CuotaRow[] = [];

    for (let i = 0; i < input.cantidadMeses; i++) {
      const pendiente = await obtenerOCrearSiguientePendiente(client, contrato);
      const pagada = await marcarCuotaPagada(client, pendiente.id, {
        fechaPago,
        precioPromocional: contrato.precio_promocional,
        precioNormal: contrato.precio_normal,
        cobrador: input.cobrador,
      });

      if (!pagada) {
        throw conflict("La cuota ya había sido pagada por otra operación, reintentá");
      }

      cuotasPagadas.push(pagada);
    }

    // Deja siempre una cuota "próxima" lista, aunque no se haya pagado (regla de
    // negocio 2: al llegar el siguiente mes sin pago, esa cuota queda como alerta
    // de renovación vía el cálculo de mora en tiempo real, regla 6).
    const siguienteCuota = await obtenerOCrearSiguientePendiente(client, contrato);

    await client.query("COMMIT");

    return {
      cuotasPagadas: cuotasPagadas.map(toPublicCuota),
      siguienteCuota: toPublicCuota(siguienteCuota),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw translatePgError(err) ?? err;
  } finally {
    client.release();
  }
}
