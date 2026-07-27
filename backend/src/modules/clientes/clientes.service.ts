import { pool } from "../../config/db";
import { translatePgError } from "../../utils/db-errors";
import { notFound } from "../../utils/errors";
import {
  findClienteById,
  findEquipoByClienteId,
  findVehiculoByClienteId,
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

function toPublicCliente(row: ClienteRow) {
  return {
    id: row.id,
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    idClienteCode: row.id_cliente_code,
    fechaAlta: row.fecha_alta,
    estado: row.estado,
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
      vehiculo: toPublicVehiculo(vehiculo),
      equipo: toPublicEquipo(equipo),
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

  const [vehiculo, equipo, fotos] = await Promise.all([
    findVehiculoByClienteId(id),
    findEquipoByClienteId(id),
    listFotosByClienteId(id),
  ]);

  return {
    cliente: toPublicCliente(cliente),
    vehiculo: vehiculo ? toPublicVehiculo(vehiculo) : null,
    equipo: equipo ? toPublicEquipo(equipo) : null,
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

export async function actualizarVehiculoDeCliente(clienteId: number, input: ActualizarVehiculoInput) {
  const existente = await findVehiculoByClienteId(clienteId);
  if (!existente) {
    throw notFound("El cliente no tiene un vehículo registrado");
  }

  try {
    const actualizado = await updateVehiculo(clienteId, input);
    return toPublicVehiculo(actualizado!);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}

export async function actualizarEquipoDeCliente(clienteId: number, input: ActualizarEquipoInput) {
  const existente = await findEquipoByClienteId(clienteId);
  if (!existente) {
    throw notFound("El cliente no tiene un equipo registrado");
  }

  try {
    const actualizado = await updateEquipo(clienteId, input);
    return toPublicEquipo(actualizado!);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}
