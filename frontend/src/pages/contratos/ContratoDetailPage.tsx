import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerContrato, pagarCuotas } from "../../api/contratos";
import { useAsync } from "../../hooks/useAsync";
import { ApiError } from "../../lib/api-client";
import { formatFecha, formatGuaranies } from "../../lib/format";
import type { Cuota } from "../../lib/types";

const DIAS_GRACIA = 5;

function estadoCuota(cuota: Cuota): { label: string; className: string } {
  if (cuota.estado === "pagada") {
    return { label: "Pagada", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(`${cuota.fechaVencimiento}T00:00:00`);
  const limiteDescuento = new Date(vencimiento);
  limiteDescuento.setDate(limiteDescuento.getDate() + DIAS_GRACIA);

  if (hoy <= vencimiento) {
    return { label: "Pendiente", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  }
  if (hoy <= limiteDescuento) {
    return { label: "Vencida (con descuento)", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  }
  return { label: "En mora", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
}

export function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contratoId = Number(id);

  const { data, loading, error, reload } = useAsync(() => obtenerContrato(contratoId), [contratoId]);

  const [cantidadMeses, setCantidadMeses] = useState("1");
  const [fechaPago, setFechaPago] = useState("");
  const [cobrador, setCobrador] = useState("");
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  async function handlePagar(event: FormEvent): Promise<void> {
    event.preventDefault();
    setErrorPago(null);
    setPagando(true);
    try {
      await pagarCuotas(contratoId, {
        cantidadMeses: Number(cantidadMeses) || 1,
        fechaPago: fechaPago || undefined,
        cobrador: cobrador || undefined,
      });
      setFechaPago("");
      setCobrador("");
      setCantidadMeses("1");
      reload();
    } catch (err) {
      setErrorPago(err instanceof ApiError ? err.message : "No se pudo registrar el pago");
    } finally {
      setPagando(false);
    }
  }

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Cargando…</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return null;

  const { contrato, cuotas } = data;
  const hayPendientes = cuotas.some((c) => c.estado === "pendiente");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Contrato #{contrato.id}</h1>
        <Link to={`/clientes/${contrato.clienteId}`} className="text-sm text-purple-600 hover:underline dark:text-purple-400">
          Ver cliente
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo de venta</p>
          <p className="text-slate-900 dark:text-white">{contrato.tipoVenta}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inicio</p>
          <p className="text-slate-900 dark:text-white">{formatFecha(contrato.fechaInicio)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Precio normal</p>
          <p className="text-slate-900 dark:text-white">{formatGuaranies(contrato.precioNormal)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Precio promocional</p>
          <p className="text-slate-900 dark:text-white">{formatGuaranies(contrato.precioPromocional)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
          Cuotas
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

      {hayPendientes && (
        <form onSubmit={handlePagar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Registrar pago</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cantidadMeses" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Meses a pagar
              </label>
              <input
                id="cantidadMeses"
                type="number"
                min="1"
                max="24"
                value={cantidadMeses}
                onChange={(e) => setCantidadMeses(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="fechaPago" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Fecha de pago (hoy por defecto)
              </label>
              <input
                id="fechaPago"
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="cobrador" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Cobrador (opcional)
              </label>
              <input
                id="cobrador"
                type="text"
                value={cobrador}
                onChange={(e) => setCobrador(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {errorPago && <p className="text-sm text-red-600 dark:text-red-400">{errorPago}</p>}

          <button
            type="submit"
            disabled={pagando}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {pagando ? "Registrando…" : "Registrar pago"}
          </button>
        </form>
      )}
    </div>
  );
}
