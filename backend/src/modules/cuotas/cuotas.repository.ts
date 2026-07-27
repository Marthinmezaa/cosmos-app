import type { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";

type Queryable = Pool | PoolClient;

export interface CuotaRow {
  id: number;
  contrato_id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  monto_pagado: string | null;
  monto_a_cobrar: string;
  estado: "pendiente" | "pagada";
  cobrador: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertPrimeraCuotaInput {
  contratoId: number;
  fechaVencimiento?: string;
  montoACobrar: string | number;
}

/** Cuota #1 de un contrato nuevo: vence en fecha_inicio (o CURRENT_DATE si no se especificó). */
export async function insertPrimeraCuota(db: Queryable, input: InsertPrimeraCuotaInput): Promise<CuotaRow> {
  const { rows } = await db.query<CuotaRow>(
    `INSERT INTO cuotas (contrato_id, numero_cuota, fecha_vencimiento, monto_a_cobrar)
     VALUES ($1, 1, COALESCE($2::date, CURRENT_DATE), $3)
     RETURNING *`,
    [input.contratoId, input.fechaVencimiento ?? null, input.montoACobrar],
  );
  return rows[0];
}

/**
 * Genera la cuota siguiente a partir de la última cuota existente del contrato
 * (numero_cuota + 1, un mes después de su vencimiento). Requiere que ya exista al
 * menos una cuota previa (siempre la hay, porque la #1 se crea junto con el contrato).
 */
export async function insertCuotaSiguiente(
  db: Queryable,
  contratoId: number,
  montoACobrar: string | number,
): Promise<CuotaRow> {
  const { rows } = await db.query<CuotaRow>(
    `INSERT INTO cuotas (contrato_id, numero_cuota, fecha_vencimiento, monto_a_cobrar)
     SELECT contrato_id, numero_cuota + 1, fecha_vencimiento + INTERVAL '1 month', $2
     FROM cuotas
     WHERE contrato_id = $1
     ORDER BY numero_cuota DESC
     LIMIT 1
     RETURNING *`,
    [contratoId, montoACobrar],
  );
  return rows[0];
}

export async function findPendienteMasAntiguaByContratoId(db: Queryable, contratoId: number): Promise<CuotaRow | null> {
  const { rows } = await db.query<CuotaRow>(
    `SELECT * FROM cuotas WHERE contrato_id = $1 AND estado = 'pendiente' ORDER BY numero_cuota ASC LIMIT 1`,
    [contratoId],
  );
  return rows[0] ?? null;
}

export interface MarcarCuotaPagadaInput {
  fechaPago: string;
  precioPromocional: string | number;
  precioNormal: string | number;
  cobrador?: string;
}

/**
 * Marca una cuota como pagada y decide el monto según la ventana de descuento
 * (regla de negocio 1): si fechaPago <= fecha_vencimiento + 5 días, precio
 * promocional; si no, precio normal como multa. El cálculo se hace en SQL para
 * que la comparación de fechas la resuelva Postgres, no JS.
 * Devuelve null si la cuota ya no estaba pendiente (pago concurrente).
 */
export async function marcarCuotaPagada(
  db: Queryable,
  cuotaId: number,
  input: MarcarCuotaPagadaInput,
): Promise<CuotaRow | null> {
  const { rows } = await db.query<CuotaRow>(
    `UPDATE cuotas
     SET estado = 'pagada',
         fecha_pago = $2::date,
         monto_pagado = CASE WHEN $2::date <= fecha_vencimiento + INTERVAL '5 days' THEN $3::numeric ELSE $4::numeric END,
         monto_a_cobrar = CASE WHEN $2::date <= fecha_vencimiento + INTERVAL '5 days' THEN $3::numeric ELSE $4::numeric END,
         cobrador = COALESCE($5, cobrador)
     WHERE id = $1 AND estado = 'pendiente'
     RETURNING *`,
    [cuotaId, input.fechaPago, input.precioPromocional, input.precioNormal, input.cobrador ?? null],
  );
  return rows[0] ?? null;
}

export async function listCuotasByContratoId(contratoId: number): Promise<CuotaRow[]> {
  const { rows } = await pool.query<CuotaRow>(
    "SELECT * FROM cuotas WHERE contrato_id = $1 ORDER BY numero_cuota ASC",
    [contratoId],
  );
  return rows;
}
