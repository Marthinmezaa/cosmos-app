import { Link } from "react-router-dom";
import { obtenerDashboard } from "../api/dashboard";
import { useAsync } from "../hooks/useAsync";
import { formatFecha, formatGuaranies } from "../lib/format";
import type { ClienteEnMora, CuotaProxima } from "../lib/types";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function CuotasTable({ cuotas, vacioLabel }: { cuotas: CuotaProxima[]; vacioLabel: string }) {
  if (cuotas.length === 0) {
    return <p className="p-4 text-sm text-slate-500 dark:text-slate-400">{vacioLabel}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-500 dark:text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Cliente</th>
          <th className="px-4 py-2 font-medium">Cuota</th>
          <th className="px-4 py-2 font-medium">Vence</th>
          <th className="px-4 py-2 font-medium">Monto</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {cuotas.map((cuota) => (
          <tr key={cuota.cuotaId}>
            <td className="px-4 py-2">
              <Link to={`/clientes/${cuota.clienteId}`} className="text-purple-600 hover:underline dark:text-purple-400">
                {cuota.clienteNombre}
              </Link>
            </td>
            <td className="px-4 py-2">#{cuota.numeroCuota}</td>
            <td className="px-4 py-2">{formatFecha(cuota.fechaVencimiento)}</td>
            <td className="px-4 py-2">{formatGuaranies(cuota.montoACobrar)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ClientesEnMoraTable({ clientes }: { clientes: ClienteEnMora[] }) {
  if (clientes.length === 0) {
    return <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Sin clientes en mora.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-500 dark:text-slate-400">
        <tr>
          <th className="px-4 py-2 font-medium">Cliente</th>
          <th className="px-4 py-2 font-medium">Cuota vencida</th>
          <th className="px-4 py-2 font-medium">Meses en mora</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {clientes.map((cliente) => (
          <tr key={cliente.cuotaId}>
            <td className="px-4 py-2">
              <Link to={`/clientes/${cliente.clienteId}`} className="text-purple-600 hover:underline dark:text-purple-400">
                {cliente.clienteNombre}
              </Link>
            </td>
            <td className="px-4 py-2">{formatFecha(cliente.fechaVencimiento)}</td>
            <td className="px-4 py-2">
              <span
                className={
                  cliente.alerta
                    ? "rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    : "text-slate-700 dark:text-slate-300"
                }
              >
                {cliente.mesesMora}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DashboardPage() {
  const { data, loading, error } = useAsync(obtenerDashboard, []);

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Cargando dashboard…</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cuotas que vencen hoy" value={String(data.cuotasHoy.length)} />
        <StatCard label="Cuotas que vencen esta semana" value={String(data.cuotasSemana.length)} />
        <StatCard label="Ingresos del mes" value={formatGuaranies(data.ingresosMes)} />
        <StatCard label="Egresos del mes" value={formatGuaranies(data.egresosMes)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Vencen hoy
          </h2>
          <CuotasTable cuotas={data.cuotasHoy} vacioLabel="No hay cuotas que venzan hoy." />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Vencen esta semana
          </h2>
          <CuotasTable cuotas={data.cuotasSemana} vacioLabel="No hay cuotas que venzan esta semana." />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Instalaciones por tipo de vehículo
          </h2>
          {data.instalacionesPorTipo.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Todavía no hay instalaciones registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.instalacionesPorTipo.map((item) => (
                <li key={item.tipo} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{item.tipo}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{item.cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Clientes en mora
          </h2>
          <ClientesEnMoraTable clientes={data.clientesEnMora} />
        </section>
      </div>
    </div>
  );
}
