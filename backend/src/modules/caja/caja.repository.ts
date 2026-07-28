import { pool } from "../../config/db";

export interface CajaRow {
  id: number;
  cuota_id: number | null;
  tipo: "ingreso" | "egreso";
  categoria: string;
  monto: string;
  fecha: string;
  concepto: string | null;
  receptor: string | null;
  emisor: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertMovimientoInput {
  tipo: "ingreso" | "egreso";
  categoria: string;
  monto: number;
  fecha?: string;
  concepto?: string;
  receptor?: string;
  emisor?: string;
}

export async function insertMovimiento(input: InsertMovimientoInput): Promise<CajaRow> {
  const { rows } = await pool.query<CajaRow>(
    `INSERT INTO caja (tipo, categoria, monto, fecha, concepto, receptor, emisor)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7)
     RETURNING *`,
    [input.tipo, input.categoria, input.monto, input.fecha ?? null, input.concepto ?? null, input.receptor ?? null, input.emisor ?? null],
  );
  return rows[0];
}

export interface ListMovimientosParams {
  mes?: number;
  anio?: number;
  tipo?: "ingreso" | "egreso";
  page: number;
  pageSize: number;
}

export async function listMovimientos(params: ListMovimientosParams): Promise<{ data: CajaRow[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.mes !== undefined) {
    values.push(params.mes);
    conditions.push(`EXTRACT(MONTH FROM fecha) = $${values.length}`);
  }

  if (params.anio !== undefined) {
    values.push(params.anio);
    conditions.push(`EXTRACT(YEAR FROM fecha) = $${values.length}`);
  }

  if (params.tipo) {
    values.push(params.tipo);
    conditions.push(`tipo = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await pool.query<{ count: string }>(`SELECT count(*) FROM caja ${whereClause}`, values);

  const offset = (params.page - 1) * params.pageSize;
  values.push(params.pageSize, offset);

  const { rows } = await pool.query<CajaRow>(
    `SELECT * FROM caja ${whereClause} ORDER BY fecha DESC, id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { data: rows, total: Number(totalResult.rows[0].count) };
}

export async function sumSaldoEnCaja(): Promise<string> {
  const { rows } = await pool.query<{ saldo: string | null }>(
    `SELECT
       COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0) - COALESCE(SUM(monto) FILTER (WHERE tipo = 'egreso'), 0) AS saldo
     FROM caja`,
  );
  return rows[0]?.saldo ?? "0";
}

export async function sumMovimientosDelMes(tipo: "ingreso" | "egreso", mes: number, anio: number): Promise<string> {
  const { rows } = await pool.query<{ total: string | null }>(
    `SELECT SUM(monto) AS total FROM caja WHERE tipo = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3`,
    [tipo, mes, anio],
  );
  return rows[0]?.total ?? "0";
}
