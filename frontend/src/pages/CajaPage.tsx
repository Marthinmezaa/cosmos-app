import { type FormEvent, useState } from "react";
import { crearMovimiento, listarMovimientos } from "../api/caja";
import { useAsync } from "../hooks/useAsync";
import { ApiError } from "../lib/api-client";
import { formatFecha, formatGuaranies } from "../lib/format";
import type { TipoMovimientoCaja } from "../lib/types";

const PAGE_SIZE = 20;
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function CajaPage() {
  const [tipo, setTipo] = useState<TipoMovimientoCaja>("ingreso");
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [concepto, setConcepto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<TipoMovimientoCaja | "">("");
  const [filtroMes, setFiltroMes] = useState<number | "">("");
  const [filtroAnio, setFiltroAnio] = useState<number | "">("");
  const [page, setPage] = useState(1);

  const { data, loading, reload } = useAsync(
    () =>
      listarMovimientos({
        tipo: filtroTipo || undefined,
        mes: filtroMes || undefined,
        anio: filtroAnio || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [filtroTipo, filtroMes, filtroAnio, page],
  );

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await crearMovimiento({
        tipo,
        categoria,
        monto: Number(monto),
        fecha: fecha || undefined,
        concepto: concepto || undefined,
      });
      setCategoria("");
      setMonto("");
      setFecha("");
      setConcepto("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Caja</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimientoCaja)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Categoría
          </label>
          <input
            id="categoria"
            type="text"
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="monto" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Monto
          </label>
          <input
            id="monto"
            type="number"
            min="0"
            step="1"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="fecha" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Fecha (hoy por defecto)
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="concepto" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Concepto (opcional)
          </label>
          <input
            id="concepto"
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {submitting ? "Guardando…" : "Registrar movimiento"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <select
          value={filtroTipo}
          onChange={(e) => {
            setPage(1);
            setFiltroTipo(e.target.value as TipoMovimientoCaja | "");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <select
          value={filtroMes}
          onChange={(e) => {
            setPage(1);
            setFiltroMes(e.target.value ? Number(e.target.value) : "");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">Todos los meses</option>
          {MESES.map((nombre, index) => (
            <option key={nombre} value={index + 1}>
              {nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Año"
          value={filtroAnio}
          onChange={(e) => {
            setPage(1);
            setFiltroAnio(e.target.value ? Number(e.target.value) : "");
          }}
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}

      {data && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Concepto</th>
                <th className="px-4 py-2 font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No hay movimientos.
                  </td>
                </tr>
              )}
              {data.data.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-4 py-2">{formatFecha(mov.fecha)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        mov.tipo === "ingreso"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }
                    >
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2">{mov.categoria}</td>
                  <td className="px-4 py-2">{mov.concepto || "—"}</td>
                  <td className="px-4 py-2">{formatGuaranies(mov.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Página {data.page} de {totalPaginas} · {data.total} movimientos
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPaginas}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
