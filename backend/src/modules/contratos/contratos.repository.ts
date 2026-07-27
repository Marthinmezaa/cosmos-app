import type { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";

type Queryable = Pool | PoolClient;

export interface ContratoRow {
  id: number;
  cliente_id: number;
  vendedor_id: number;
  instalador: string | null;
  precio_normal: string;
  precio_promocional: string;
  fecha_inicio: string;
  tipo_venta: string;
  created_at: Date;
  updated_at: Date;
}

export interface InsertContratoInput {
  clienteId: number;
  vendedorId: number;
  instalador?: string;
  precioNormal: number;
  precioPromocional: number;
  fechaInicio?: string;
  tipoVenta: string;
}

export async function insertContrato(db: Queryable, input: InsertContratoInput): Promise<ContratoRow> {
  const { rows } = await db.query<ContratoRow>(
    `INSERT INTO contratos (cliente_id, vendedor_id, instalador, precio_normal, precio_promocional, fecha_inicio, tipo_venta)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7)
     RETURNING *`,
    [
      input.clienteId,
      input.vendedorId,
      input.instalador ?? null,
      input.precioNormal,
      input.precioPromocional,
      input.fechaInicio ?? null,
      input.tipoVenta,
    ],
  );
  return rows[0];
}

export async function findContratoById(id: number): Promise<ContratoRow | null> {
  const { rows } = await pool.query<ContratoRow>("SELECT * FROM contratos WHERE id = $1", [id]);
  return rows[0] ?? null;
}
