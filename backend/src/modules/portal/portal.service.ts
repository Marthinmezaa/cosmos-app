import { findClienteById } from "../clientes/clientes.repository";
import { toPublicCliente } from "../clientes/clientes.service";
import { findContratosByClienteId } from "../contratos/contratos.repository";
import { toPublicContrato, toPublicCuota } from "../contratos/contratos.service";
import { listCuotasByContratoId } from "../cuotas/cuotas.repository";
import { notFound } from "../../utils/errors";

/**
 * Estado de cuenta de solo lectura del cliente logueado. Reutiliza los mismos
 * repositorios y mapeos a DTO público que ya usa el CRUD admin de clientes/
 * contratos (regla de negocio 4 del portal: nunca exponer más de lo propio).
 */
export async function obtenerEstadoCuenta(clienteId: number) {
  const cliente = await findClienteById(clienteId);
  if (!cliente) {
    throw notFound("El cliente no existe");
  }

  const contratos = await findContratosByClienteId(clienteId);
  const contratosConCuotas = await Promise.all(
    contratos.map(async (contrato) => {
      const cuotas = await listCuotasByContratoId(contrato.id);
      return { contrato: toPublicContrato(contrato), cuotas: cuotas.map(toPublicCuota) };
    }),
  );

  return { cliente: toPublicCliente(cliente), contratos: contratosConCuotas };
}
