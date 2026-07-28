import { pool } from "../../config/db";

export interface MetaMensualRow {
  id: number;
  mes: number;
  anio: number;
  meta_ventas: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertMetaInput {
  mes: number;
  anio: number;
  metaVentas: number;
}

export async function insertMeta(input: InsertMetaInput): Promise<MetaMensualRow> {
  const { rows } = await pool.query<MetaMensualRow>(
    `INSERT INTO metas_mensuales (mes, anio, meta_ventas) VALUES ($1, $2, $3) RETURNING *`,
    [input.mes, input.anio, input.metaVentas],
  );
  return rows[0];
}

export async function updateMeta(id: number, metaVentas: number): Promise<MetaMensualRow | null> {
  const { rows } = await pool.query<MetaMensualRow>(
    `UPDATE metas_mensuales SET meta_ventas = $2 WHERE id = $1 RETURNING *`,
    [id, metaVentas],
  );
  return rows[0] ?? null;
}

export async function findMetaById(id: number): Promise<MetaMensualRow | null> {
  const { rows } = await pool.query<MetaMensualRow>("SELECT * FROM metas_mensuales WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function findMetaByMesAnio(mes: number, anio: number): Promise<MetaMensualRow | null> {
  const { rows } = await pool.query<MetaMensualRow>(
    "SELECT * FROM metas_mensuales WHERE mes = $1 AND anio = $2",
    [mes, anio],
  );
  return rows[0] ?? null;
}

export async function listMetas(): Promise<MetaMensualRow[]> {
  const { rows } = await pool.query<MetaMensualRow>("SELECT * FROM metas_mensuales ORDER BY anio DESC, mes DESC");
  return rows;
}
