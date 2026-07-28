import { translatePgError } from "../../utils/db-errors";
import { notFound } from "../../utils/errors";
import { findMetaById, insertMeta, listMetas, updateMeta, type MetaMensualRow } from "./metas.repository";
import type { ActualizarMetaInput, CrearMetaInput } from "./metas.schema";

function toPublicMeta(row: MetaMensualRow) {
  return { id: row.id, mes: row.mes, anio: row.anio, metaVentas: row.meta_ventas };
}

export async function crearMeta(input: CrearMetaInput) {
  try {
    const meta = await insertMeta(input);
    return toPublicMeta(meta);
  } catch (err) {
    throw translatePgError(err) ?? err;
  }
}

export async function actualizarMeta(id: number, input: ActualizarMetaInput) {
  const existente = await findMetaById(id);
  if (!existente) {
    throw notFound("La meta no existe");
  }

  const actualizada = await updateMeta(id, input.metaVentas);
  return toPublicMeta(actualizada!);
}

export async function listarMetas() {
  const metas = await listMetas();
  return metas.map(toPublicMeta);
}
