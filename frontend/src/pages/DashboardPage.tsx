import { useState } from "react";
import { Link } from "react-router-dom";
import { obtenerDashboard } from "../api/dashboard";
import { useAsync } from "../hooks/useAsync";
import { formatFecha, formatGuaranies } from "../lib/format";
import type { ClienteEnMora, CuotaProxima } from "../lib/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPorcentaje(valor: number): string {
  return `${Math.round(valor * 100)}%`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
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
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const { data, loading, error } = useAsync(() => obtenerDashboard(mes, anio), [mes, anio]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando dashboard…</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cuotas del mes"
              value={String(data.cuotasDelMes.total)}
              sub={`${data.cuotasDelMes.pagadas} pagadas · ${data.cuotasDelMes.vencidas} vencidas · ${data.cuotasDelMes.vigentes} vigentes`}
            />
            <StatCard label="% de pago" value={formatPorcentaje(data.cuotasDelMes.porcentajePago)} />
            <StatCard label="% de atraso" value={formatPorcentaje(data.cuotasDelMes.porcentajeAtraso)} />
            <StatCard label="Clientes activos" value={String(data.clientesActivos)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Facturación del mes" value={formatGuaranies(data.facturacionDelMes)} />
            <StatCard label="Ingresos del mes (caja)" value={formatGuaranies(data.caja.ingresosDelMes)} />
            <StatCard label="Egresos del mes (caja)" value={formatGuaranies(data.caja.egresosDelMes)} />
            <StatCard label="Saldo en caja" value={formatGuaranies(data.caja.saldoEnCaja)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                Instalaciones del mes por tipo de vehículo
              </h2>
              {data.instalacionesDelMesPorTipo.length === 0 ? (
                <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No hay instalaciones este mes.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.instalacionesDelMesPorTipo.map((item) => (
                    <li key={item.tipo} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{item.tipo}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.cantidad}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Meta de ventas del mes</h2>
              {data.meta === null ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No hay meta cargada para {MESES[mes - 1]} {anio}.{" "}
                  <Link to="/metas" className="text-purple-600 hover:underline dark:text-purple-400">
                    Cargar meta
                  </Link>
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {data.meta.instalado} / {data.meta.metaVentas}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">instalaciones vs. meta</p>
                  </div>
                  <span
                    className={
                      data.meta.superada
                        ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }
                  >
                    {data.meta.superada ? "Meta superada" : "A trabajar"}
                  </span>
                </div>
              )}
            </section>
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

          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
              Clientes en mora
            </h2>
            <ClientesEnMoraTable clientes={data.clientesEnMora} />
          </section>
        </>
      )}
    </div>
  );
}
