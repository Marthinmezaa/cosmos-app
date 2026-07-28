import { useState } from "react";
import { Link } from "react-router-dom";
import { listarClientes } from "../../api/clientes";
import { useAsync } from "../../hooks/useAsync";
import { formatFecha } from "../../lib/format";
import type { EstadoCliente } from "../../lib/types";

const PAGE_SIZE = 20;

export function ClientesListPage() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoCliente | "">("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () => listarClientes({ busqueda: busqueda || undefined, estado: estado || undefined, page, pageSize: PAGE_SIZE }),
    [busqueda, estado, page],
  );

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Clientes</h1>
        <Link
          to="/clientes/nuevo"
          className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          + Alta de cliente
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o cédula…"
          value={busqueda}
          onChange={(e) => {
            setPage(1);
            setBusqueda(e.target.value);
          }}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <select
          value={estado}
          onChange={(e) => {
            setPage(1);
            setEstado(e.target.value as EstadoCliente | "");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}

      {data && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cédula</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Alta</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
              {data.data.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">
                    <Link to={`/clientes/${cliente.id}`} className="text-purple-600 hover:underline dark:text-purple-400">
                      {cliente.idClienteCode}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {cliente.nombre} {cliente.apellido}
                  </td>
                  <td className="px-4 py-2">{cliente.cedula}</td>
                  <td className="px-4 py-2">{cliente.telefono}</td>
                  <td className="px-4 py-2">{formatFecha(cliente.fechaAlta)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        cliente.estado === "activo"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }
                    >
                      {cliente.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Página {data.page} de {totalPaginas} · {data.total} clientes
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
