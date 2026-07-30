import { obtenerEstadoCuenta } from "../api/portal";
import { useAsync } from "../hooks/useAsync";
import { estadoCuota } from "../lib/cuotas";
import { formatFecha, formatGuaranies } from "../lib/format";

export function MiCuentaPage() {
  const { data, loading, error } = useAsync(() => obtenerEstadoCuenta(), []);

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Cargando…</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return null;

  const { cliente, contratos } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Hola, {cliente.nombre} {cliente.apellido}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cliente {cliente.idClienteCode}</p>
      </div>

      {contratos.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Todavía no tenés un servicio contratado.
        </p>
      )}

      {contratos.map(({ contrato, cuotas }) => (
        <section key={contrato.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Servicio desde {formatFecha(contrato.fechaInicio)}
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Vencimiento</th>
                <th className="px-4 py-2 font-medium">Pago</th>
                <th className="px-4 py-2 font-medium">Monto</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cuotas.map((cuota) => {
                const estado = estadoCuota(cuota);
                return (
                  <tr key={cuota.id}>
                    <td className="px-4 py-2">{cuota.numeroCuota}</td>
                    <td className="px-4 py-2">{formatFecha(cuota.fechaVencimiento)}</td>
                    <td className="px-4 py-2">{cuota.fechaPago ? formatFecha(cuota.fechaPago) : "—"}</td>
                    <td className="px-4 py-2">{formatGuaranies(cuota.montoPagado ?? cuota.montoACobrar)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.className}`}>{estado.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
