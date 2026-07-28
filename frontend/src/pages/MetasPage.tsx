import { type FormEvent, useState } from "react";
import { actualizarMeta, crearMeta, listarMetas } from "../api/metas";
import { useAsync } from "../hooks/useAsync";
import { ApiError } from "../lib/api-client";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function EditarMeta({ id, valorInicial, onGuardado }: { id: number; valorInicial: number; onGuardado: () => void }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(valorInicial));
  const [guardando, setGuardando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-purple-600 hover:underline dark:text-purple-400"
      >
        Editar
      </button>
    );
  }

  async function guardar(): Promise<void> {
    setGuardando(true);
    try {
      await actualizarMeta(id, Number(valor));
      setEditando(false);
      onGuardado();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button type="button" onClick={guardar} disabled={guardando} className="text-purple-600 hover:underline dark:text-purple-400">
        Guardar
      </button>
      <button type="button" onClick={() => setEditando(false)} className="text-slate-500 hover:underline dark:text-slate-400">
        Cancelar
      </button>
    </div>
  );
}

export function MetasPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [metaVentas, setMetaVentas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, reload } = useAsync(listarMetas, []);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await crearMeta({ mes, anio, metaVentas: Number(metaVentas) });
      setMetaVentas("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la meta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Metas de ventas</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label htmlFor="mes" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Mes
          </label>
          <select
            id="mes"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="anio" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Año
          </label>
          <input
            id="anio"
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="metaVentas" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Meta de ventas
          </label>
          <input
            id="metaVentas"
            type="number"
            min="0"
            required
            value={metaVentas}
            onChange={(e) => setMetaVentas(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {submitting ? "Guardando…" : "Guardar meta"}
          </button>
        </div>
        {error && <p className="sm:col-span-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}

      {data && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Período</th>
                <th className="px-4 py-2 font-medium">Meta de ventas</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    Todavía no hay metas cargadas.
                  </td>
                </tr>
              )}
              {data.map((meta) => (
                <tr key={meta.id}>
                  <td className="px-4 py-2">
                    {MESES[meta.mes - 1]} {meta.anio}
                  </td>
                  <td className="px-4 py-2">{meta.metaVentas}</td>
                  <td className="px-4 py-2">
                    <EditarMeta id={meta.id} valorInicial={meta.metaVentas} onGuardado={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
