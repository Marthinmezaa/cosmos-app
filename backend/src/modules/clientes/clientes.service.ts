import { pool } from "../../config/db";
import { translatePgError } from "../../utils/db-errors";
import { notFound } from "../../utils/errors";
import {
  findClienteById,
  findEquipoById,
  findEquiposByClienteId,
  findVehiculoById,
  findVehiculosByClienteId,
  insertCliente,
  insertEquipo,
  insertFoto,
  insertVehiculo,
  listClientes,
  listFotosByClienteId,
  updateCliente,
  updateEquipo,
  updateVehiculo,
  type ClienteRow,
  type EquipoRow,
  type FotoRow,
  type VehiculoRow,
} from "./clientes.repository";
import type {
  ActualizarClienteInput,
  ActualizarEquipoInput,
  ActualizarVehiculoInput,
  CrearClienteInput,
  ListarClientesQuery,
} from "./clientes.schema";

export function toPublicCliente(row: ClienteRow) {
  return {
    id: row.id,
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    idClienteCode: row.id_cliente_code,
    fechaAlta: row.fecha_alta,
    estado: row.estado,
    trakzeeUsuario: row.trakzee_usuario,
    trakzeePassword: row.trakzee_password,
  };
}

function toPublicVehiculo(row: VehiculoRow) {
  return {
    id: row.id,
    tipo: row.tipo,
    marca: row.marca,
    modelo: row.modelo,
    anio: row.anio,
    color: row.color,
    chapa: row.chapa,
    chasis: row.chasis,
    kilometraje: row.kilometraje,
  };
}

function toPublicEquipo(row: EquipoRow) {
  return {
    id: row.id,
    marcaEquipo: row.marca_equipo,
    imei: row.imei,
    numeroChip: row.numero_chip,
    operadora: row.operadora,
  };
}

function toPublicFoto(row: FotoRow) {
  return { id: row.id, urlR2: row.url_r2 };
}

export async function crearClienteCompleto(input: CrearClienteInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cliente = await insertCliente(client, {
      cedula: input.cliente.cedula,
      nombre: input.cliente.nombre,
      apellido: input.cliente.apellido,
      telefono: input.cliente.telefono,
      fechaAlta: input.cliente.fechaAlta,
      trakzeeUsuario: input.cliente.trakzeeUsuario,
      trakzeePassword: input.cliente.trakzeePassword,
    });

    const vehiculo = await insertVehiculo(client, {
      clienteId: cliente.id,
      tipo: input.vehiculo.tipo,
      marca: input.vehiculo.marca,
      modelo: input.vehiculo.modelo,
      anio: input.vehiculo.anio,
      color: input.vehiculo.color,
      chapa: input.vehiculo.chapa,
      chasis: input.vehiculo.chasis,
      kilometraje: input.vehiculo.kilometraje,
    });

    const equipo = await insertEquipo(client, {
      clienteId: cliente.id,
      marcaEquipo: input.equipo.marcaEquipo,
      imei: input.equipo.imei,
      numeroChip: input.equipo.numeroChip,
      operadora: input.equipo.operadora,
    });

    const fotos = [];
    for (const foto of input.fotos) {
      fotos.push(await insertFoto(client, cliente.id, foto.urlR2));
    }

    await client.query("COMMIT");

    return {
      cliente: toPublicCliente(cliente),
      // El alta siempre crea uno solo (regla de negocio, ver clientes.schema.ts):
      // se envuelve en array acá para que la forma coincida con obtenerClienteCompleto,
      // que sí puede traer varios en un cliente con flota.
      vehiculos: [toPublicVehiculo(vehiculo)],
      equipos: [toPublicEquipo(equipo)],
      fotos: fotos.map(toPublicFoto),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw translatePgError(err) ?? err;
  } finally {
    client.release();
  }
}

export async function listarClientes(query: ListarClientesQuery) {
  const { data, total } = await listClientes({
    estado: query.estado,
    busqueda: query.busqueda,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    data: data.map(toPublicCliente),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function obtenerClienteCompleto(id: number) {
  const cliente = await findClienteById(id);
  if (!cliente) {
    throw notFound("El cliente no existe");
  }

  // Un cliente con flota tiene varios vehículos/equipos (ej. 9-14): siempre listas,
  // nunca un solo registro.
  const [vehiculos, equipos, fotos] = await Promise.all([
    findVehiculosByClienteId(id),
    findEquiposByClienteId(id),
    listFotosByClienteId(id),
  ]);

  return {
    cliente: toPublicCliente(cliente),
    vehiculos: vehiculos.map(toPublicVehiculo),
    equipos: equipos.map(toPublicEquipo),
    fotos: fotos.map(toPublicFoto),
  };
}

export async function actualizarClienteDatos(id: number, input: ActualizarClienteInput) {
  const existente = await findClienteById(id);
  if (!existente) {
    throw notFound("El cliente no existe");
  }

  try {
    const actualizado = await updateCliente(id, input);
    return toPublicCliente(actualizado!);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}

export async function actualizarVehiculoDeCliente(
  clienteId: number,
  vehiculoId: number,
  input: ActualizarVehiculoInput,
) {
  const existente = await findVehiculoById(vehiculoId);
  if (!existente || existente.cliente_id !== clienteId) {
    throw notFound("El vehículo no existe para este cliente");
  }

  try {
    const actualizado = await updateVehiculo(vehiculoId, input);
    return toPublicVehiculo(actualizado!);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}

export async function actualizarEquipoDeCliente(clienteId: number, equipoId: number, input: ActualizarEquipoInput) {
  const existente = await findEquipoById(equipoId);
  if (!existente || existente.cliente_id !== clienteId) {
    throw notFound("El equipo no existe para este cliente");
  }

  try {
    const actualizado = await updateEquipo(equipoId, input);
    return toPublicEquipo(actualizado!);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}
