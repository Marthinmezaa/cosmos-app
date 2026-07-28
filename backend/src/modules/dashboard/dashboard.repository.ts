import { pool } from "../../config/db";

export interface CuotaProximaRow {
  cuota_id: number;
  contrato_id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_a_cobrar: string;
}

const SELECT_CUOTAS_PENDIENTES = `
  SELECT
    cu.id AS cuota_id,
    cu.contrato_id,
    cl.id AS cliente_id,
    cl.nombre AS cliente_nombre,
    cl.apellido AS cliente_apellido,
    cu.numero_cuota,
    cu.fecha_vencimiento,
    cu.monto_a_cobrar
  FROM cuotas cu
  JOIN contratos co ON co.id = cu.contrato_id
  JOIN clientes cl ON cl.id = co.cliente_id
  WHERE cu.estado = 'pendiente' AND cu.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::int
  ORDER BY cu.fecha_vencimiento ASC
`;

export async function listCuotasProximas(diasHaciaAdelante: number): Promise<CuotaProximaRow[]> {
  const { rows } = await pool.query<CuotaProximaRow>(SELECT_CUOTAS_PENDIENTES, [diasHaciaAdelante]);
  return rows;
}

export async function sumIngresosDelMes(): Promise<string> {
  const { rows } = await pool.query<{ total: string | null }>(
    `SELECT SUM(monto_pagado) AS total
     FROM cuotas
     WHERE estado = 'pagada' AND date_trunc('month', fecha_pago) = date_trunc('month', CURRENT_DATE)`,
  );
  return rows[0]?.total ?? "0";
}

export async function sumEgresosDelMes(): Promise<string> {
  const { rows } = await pool.query<{ total: string | null }>(
    `SELECT SUM(monto) AS total
     FROM caja
     WHERE tipo = 'egreso' AND date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)`,
  );
  return rows[0]?.total ?? "0";
}

export interface InstalacionesPorTipoRow {
  tipo: string;
  cantidad: string;
}

export async function listInstalacionesPorTipo(): Promise<InstalacionesPorTipoRow[]> {
  const { rows } = await pool.query<InstalacionesPorTipoRow>(
    `SELECT tipo, COUNT(*) AS cantidad FROM vehiculos GROUP BY tipo ORDER BY cantidad DESC`,
  );
  return rows;
}

export interface ClienteEnMoraRow {
  cliente_id: number;
  cliente_nombre: string;
  cliente_apellido: string;
  contrato_id: number;
  cuota_id: number;
  numero_cuota: number;
  fecha_vencimiento: string;
  meses_mora: number;
}

export async function listClientesEnMora(): Promise<ClienteEnMoraRow[]> {
  const { rows } = await pool.query<ClienteEnMoraRow>(
    `SELECT
       cl.id AS cliente_id,
       cl.nombre AS cliente_nombre,
       cl.apellido AS cliente_apellido,
       co.id AS contrato_id,
       cu.id AS cuota_id,
       cu.numero_cuota,
       cu.fecha_vencimiento,
       FLOOR((CURRENT_DATE - cu.fecha_vencimiento) / 30)::int AS meses_mora
     FROM cuotas cu
     JOIN contratos co ON co.id = cu.contrato_id
     JOIN clientes cl ON cl.id = co.cliente_id
     WHERE cu.estado = 'pendiente' AND cu.fecha_vencimiento + INTERVAL '5 days' < CURRENT_DATE
     ORDER BY meses_mora DESC`,
  );
  return rows;
}
