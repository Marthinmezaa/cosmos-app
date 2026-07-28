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

export interface CuotasDelMesRow {
  total: string;
  pagadas: string;
  vencidas: string;
  vigentes: string;
}

export async function obtenerCuotasDelMes(mes: number, anio: number): Promise<CuotasDelMesRow> {
  const { rows } = await pool.query<CuotasDelMesRow>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE estado = 'pagada') AS pagadas,
       COUNT(*) FILTER (WHERE estado = 'pendiente' AND fecha_vencimiento < CURRENT_DATE) AS vencidas,
       COUNT(*) FILTER (WHERE estado = 'pendiente' AND fecha_vencimiento >= CURRENT_DATE) AS vigentes
     FROM cuotas
     WHERE EXTRACT(MONTH FROM fecha_vencimiento) = $1 AND EXTRACT(YEAR FROM fecha_vencimiento) = $2`,
    [mes, anio],
  );
  return rows[0];
}

export async function sumFacturacionDelMes(mes: number, anio: number): Promise<string> {
  const { rows } = await pool.query<{ total: string | null }>(
    `SELECT SUM(monto_a_cobrar) AS total FROM cuotas
     WHERE EXTRACT(MONTH FROM fecha_vencimiento) = $1 AND EXTRACT(YEAR FROM fecha_vencimiento) = $2`,
    [mes, anio],
  );
  return rows[0]?.total ?? "0";
}

export async function countClientesActivos(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM clientes WHERE estado = 'activo'`);
  return Number(rows[0].count);
}

export interface InstalacionesPorTipoRow {
  tipo: string;
  cantidad: string;
}

/** "Instalacion" = contrato nuevo iniciado en el mes/anio, categorizado por el tipo de vehiculo del cliente. */
export async function listInstalacionesDelMesPorTipo(mes: number, anio: number): Promise<InstalacionesPorTipoRow[]> {
  const { rows } = await pool.query<InstalacionesPorTipoRow>(
    `SELECT v.tipo, COUNT(*) AS cantidad
     FROM contratos co
     JOIN clientes cl ON cl.id = co.cliente_id
     JOIN vehiculos v ON v.cliente_id = cl.id
     WHERE EXTRACT(MONTH FROM co.fecha_inicio) = $1 AND EXTRACT(YEAR FROM co.fecha_inicio) = $2
     GROUP BY v.tipo
     ORDER BY cantidad DESC`,
    [mes, anio],
  );
  return rows;
}
