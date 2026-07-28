import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { crearContrato } from "../../api/contratos";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api-client";
import { formatGuaranies } from "../../lib/format";
import type { CrearContratoResponse } from "../../lib/types";

export function ContratoAltaPage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const { usuario } = useAuth();

  const [instalador, setInstalador] = useState("");
  const [precioNormal, setPrecioNormal] = useState("");
  const [precioPromocional, setPrecioPromocional] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [tipoVenta, setTipoVenta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creado, setCreado] = useState<CrearContratoResponse | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const resultado = await crearContrato({
        clienteId,
        instalador: instalador || undefined,
        precioNormal: Number(precioNormal),
        precioPromocional: Number(precioPromocional),
        fechaInicio: fechaInicio || undefined,
        tipoVenta,
      });
      setCreado(resultado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el contrato");
    } finally {
      setSubmitting(false);
    }
  }

  if (creado) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-900/20">
        <h1 className="text-lg font-semibold text-green-800 dark:text-green-200">Contrato creado</h1>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          Contrato #{creado.contrato.id} · primera cuota {formatGuaranies(creado.primeraCuota.montoACobrar)}
        </p>
        {usuario?.rol === "admin" && (
          <Link
            to={`/contratos/${creado.contrato.id}`}
            className="mt-4 inline-block rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Ver contrato
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nuevo contrato</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Cliente #{clienteId}</p>

      <div>
        <label htmlFor="tipoVenta" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tipo de venta
        </label>
        <input
          id="tipoVenta"
          type="text"
          required
          value={tipoVenta}
          onChange={(e) => setTipoVenta(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="instalador" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Instalador (opcional)
        </label>
        <input
          id="instalador"
          type="text"
          value={instalador}
          onChange={(e) => setInstalador(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="precioNormal" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Precio normal
          </label>
          <input
            id="precioNormal"
            type="number"
            min="0"
            step="1"
            required
            value={precioNormal}
            onChange={(e) => setPrecioNormal(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="precioPromocional" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Precio promocional
          </label>
          <input
            id="precioPromocional"
            type="number"
            min="0"
            step="1"
            required
            value={precioPromocional}
            onChange={(e) => setPrecioPromocional(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="fechaInicio" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Fecha de inicio (opcional, hoy por defecto)
        </label>
        <input
          id="fechaInicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {submitting ? "Creando…" : "Crear contrato"}
      </button>
    </form>
  );
}
