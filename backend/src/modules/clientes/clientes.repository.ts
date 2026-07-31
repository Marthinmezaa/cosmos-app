import type { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";
import { buildUpdateClause } from "../../utils/sql";

type Queryable = Pool | PoolClient;

export interface ClienteRow {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  id_cliente_code: string;
  fecha_alta: string;
  estado: "activo" | "suspendido";
  trakzee_usuario: string | null;
  trakzee_password: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehiculoRow {
  id: number;
  cliente_id: number;
  tipo: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  chapa: string | null;
  chasis: string | null;
  kilometraje: number;
  created_at: Date;
  updated_at: Date;
}

export interface EquipoRow {
  id: number;
  cliente_id: number;
  marca_equipo: string;
  imei: string;
  numero_chip: string;
  operadora: string;
  created_at: Date;
  updated_at: Date;
}

export interface FotoRow {
  id: number;
  cliente_id: number;
  url_r2: string;
  created_at: Date;
}

export interface InsertClienteInput {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  fechaAlta?: string;
  trakzeeUsuario?: string;
  trakzeePassword?: string;
}

export async function insertCliente(db: Queryable, input: InsertClienteInput): Promise<ClienteRow> {
  const { rows } = await db.query<ClienteRow>(
    `INSERT INTO clientes (cedula, nombre, apellido, telefono, fecha_alta, trakzee_usuario, trakzee_password)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7)
     RETURNING *`,
    [
      input.cedula,
      input.nombre,
      input.apellido,
      input.telefono,
      input.fechaAlta ?? null,
      input.trakzeeUsuario ?? null,
      input.trakzeePassword ?? null,
    ],
  );
  return rows[0];
}

export interface InsertVehiculoInput {
  clienteId: number;
  tipo: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  chapa?: string;
  chasis?: string;
  kilometraje: number;
}

export async function insertVehiculo(db: Queryable, input: InsertVehiculoInput): Promise<VehiculoRow> {
  const { rows } = await db.query<VehiculoRow>(
    `INSERT INTO vehiculos (cliente_id, tipo, marca, modelo, anio, color, chapa, chasis, kilometraje)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.clienteId,
      input.tipo,
      input.marca,
      input.modelo,
      input.anio,
      input.color ?? null,
      input.chapa ?? null,
      input.chasis ?? null,
      input.kilometraje,
    ],
  );
  return rows[0];
}

export interface InsertEquipoInput {
  clienteId: number;
  marcaEquipo: string;
  imei: string;
  numeroChip: string;
  operadora: string;
}

export async function insertEquipo(db: Queryable, input: InsertEquipoInput): Promise<EquipoRow> {
  const { rows } = await db.query<EquipoRow>(
    `INSERT INTO equipos (cliente_id, marca_equipo, imei, numero_chip, operadora)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.clienteId, input.marcaEquipo, input.imei, input.numeroChip, input.operadora],
  );
  return rows[0];
}

export async function insertFoto(db: Queryable, clienteId: number, urlR2: string): Promise<FotoRow> {
  const { rows } = await db.query<FotoRow>(
    "INSERT INTO fotos (cliente_id, url_r2) VALUES ($1, $2) RETURNING *",
    [clienteId, urlR2],
  );
  return rows[0];
}

export async function findClienteById(id: number): Promise<ClienteRow | null> {
  const { rows } = await pool.query<ClienteRow>("SELECT * FROM clientes WHERE id = $1", [id]);
  return rows[0] ?? null;
}

// Un cliente con flota tiene varias filas acá (ej. 9-14 vehículos/equipos): nunca
// asumir una sola fila por cliente, ver clientes.service.ts obtenerClienteCompleto.
export async function findVehiculosByClienteId(clienteId: number): Promise<VehiculoRow[]> {
  const { rows } = await pool.query<VehiculoRow>(
    "SELECT * FROM vehiculos WHERE cliente_id = $1 ORDER BY id ASC",
    [clienteId],
  );
  return rows;
}

export async function findEquiposByClienteId(clienteId: number): Promise<EquipoRow[]> {
  const { rows } = await pool.query<EquipoRow>(
    "SELECT * FROM equipos WHERE cliente_id = $1 ORDER BY id ASC",
    [clienteId],
  );
  return rows;
}

export async function findVehiculoById(id: number): Promise<VehiculoRow | null> {
  const { rows } = await pool.query<VehiculoRow>("SELECT * FROM vehiculos WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function findEquipoById(id: number): Promise<EquipoRow | null> {
  const { rows } = await pool.query<EquipoRow>("SELECT * FROM equipos WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function listFotosByClienteId(clienteId: number): Promise<FotoRow[]> {
  const { rows } = await pool.query<FotoRow>(
    "SELECT * FROM fotos WHERE cliente_id = $1 ORDER BY created_at ASC",
    [clienteId],
  );
  return rows;
}

export interface ListClientesFilter {
  estado?: "activo" | "suspendido";
  busqueda?: string;
  page: number;
  pageSize: number;
}

export async function listClientes(filter: ListClientesFilter): Promise<{ data: ClienteRow[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filter.estado) {
    values.push(filter.estado);
    conditions.push(`estado = $${values.length}`);
  }

  if (filter.busqueda) {
    values.push(`%${filter.busqueda}%`);
    const param = `$${values.length}`;
    conditions.push(
      `(cedula ILIKE ${param} OR nombre ILIKE ${param} OR apellido ILIKE ${param} OR id_cliente_code ILIKE ${param})`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await pool.query<{ count: string }>(
    `SELECT count(*) FROM clientes ${whereClause}`,
    values,
  );

  const offset = (filter.page - 1) * filter.pageSize;
  values.push(filter.pageSize, offset);

  const dataResult = await pool.query<ClienteRow>(
    `SELECT * FROM clientes ${whereClause} ORDER BY id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { data: dataResult.rows, total: Number(totalResult.rows[0].count) };
}

export interface UpdateClienteInput {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  estado?: "activo" | "suspendido";
  trakzeeUsuario?: string;
  trakzeePassword?: string;
}

export async function updateCliente(id: number, input: UpdateClienteInput): Promise<ClienteRow | null> {
  const fields: Record<string, unknown> = {
    nombre: input.nombre,
    apellido: input.apellido,
    telefono: input.telefono,
    estado: input.estado,
    trakzee_usuario: input.trakzeeUsuario,
    trakzee_password: input.trakzeePassword,
  };

  const { setClause, values } = buildUpdateClause(fields);
  if (!setClause) return findClienteById(id);

  const { rows } = await pool.query<ClienteRow>(
    `UPDATE clientes SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  );
  return rows[0] ?? null;
}

export interface UpdateVehiculoInput {
  tipo?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  color?: string;
  chapa?: string;
  chasis?: string;
  kilometraje?: number;
}

// Por id de vehículo, nunca por cliente_id: un cliente con flota tiene varias filas
// en vehiculos, y actualizar por cliente_id pisaría el kilometraje de todos sus
// vehículos a la vez.
export async function updateVehiculo(vehiculoId: number, input: UpdateVehiculoInput): Promise<VehiculoRow | null> {
  const { setClause, values } = buildUpdateClause(input);
  if (!setClause) return findVehiculoById(vehiculoId);

  const { rows } = await pool.query<VehiculoRow>(
    `UPDATE vehiculos SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, vehiculoId],
  );
  return rows[0] ?? null;
}

export interface UpdateEquipoInput {
  marcaEquipo?: string;
  imei?: string;
  numeroChip?: string;
  operadora?: string;
}

// Por id de equipo, nunca por cliente_id (mismo motivo que updateVehiculo).
export async function updateEquipo(equipoId: number, input: UpdateEquipoInput): Promise<EquipoRow | null> {
  const { setClause, values } = buildUpdateClause({
    marca_equipo: input.marcaEquipo,
    imei: input.imei,
    numero_chip: input.numeroChip,
    operadora: input.operadora,
  });
  if (!setClause) return findEquipoById(equipoId);

  const { rows } = await pool.query<EquipoRow>(
    `UPDATE equipos SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, equipoId],
  );
  return rows[0] ?? null;
}
