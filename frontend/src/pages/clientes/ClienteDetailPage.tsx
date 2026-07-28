import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { actualizarCliente, actualizarEquipo, actualizarVehiculo, obtenerCliente } from "../../api/clientes";
import { listarContratosDeCliente } from "../../api/contratos";
import { useAsync } from "../../hooks/useAsync";
import { ApiError } from "../../lib/api-client";
import { formatFecha, formatGuaranies } from "../../lib/format";
import type { EstadoCliente } from "../../lib/types";

function EditableField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      ) : (
        <p className="text-sm text-slate-900 dark:text-white">{value || "—"}</p>
      )}
    </div>
  );
}

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);

  const cliente = useAsync(() => obtenerCliente(clienteId), [clienteId]);
  const contratos = useAsync(() => listarContratosDeCliente(clienteId), [clienteId]);

  const [editandoCliente, setEditandoCliente] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<EstadoCliente>("activo");
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  const [editandoVehiculo, setEditandoVehiculo] = useState(false);
  const [kilometraje, setKilometraje] = useState("");
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);

  const [editandoEquipo, setEditandoEquipo] = useState(false);
  const [operadora, setOperadora] = useState("");
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  function empezarEdicionCliente(): void {
    if (!cliente.data) return;
    setNombre(cliente.data.cliente.nombre);
    setApellido(cliente.data.cliente.apellido);
    setTelefono(cliente.data.cliente.telefono);
    setEstado(cliente.data.cliente.estado);
    setErrorCliente(null);
    setEditandoCliente(true);
  }

  async function guardarCliente(): Promise<void> {
    setGuardandoCliente(true);
    setErrorCliente(null);
    try {
      await actualizarCliente(clienteId, { nombre, apellido, telefono, estado });
      setEditandoCliente(false);
      cliente.reload();
    } catch (err) {
      setErrorCliente(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoCliente(false);
    }
  }

  async function guardarVehiculo(): Promise<void> {
    setGuardandoVehiculo(true);
    try {
      await actualizarVehiculo(clienteId, { kilometraje: Number(kilometraje) });
      setEditandoVehiculo(false);
      cliente.reload();
    } finally {
      setGuardandoVehiculo(false);
    }
  }

  async function guardarEquipo(): Promise<void> {
    setGuardandoEquipo(true);
    try {
      await actualizarEquipo(clienteId, { operadora });
      setEditandoEquipo(false);
      cliente.reload();
    } finally {
      setGuardandoEquipo(false);
    }
  }

  if (cliente.loading) return <p className="text-slate-500 dark:text-slate-400">Cargando…</p>;
  if (cliente.error) return <p className="text-red-600 dark:text-red-400">{cliente.error}</p>;
  if (!cliente.data) return null;

  const { cliente: datosCliente, vehiculo, equipo, fotos } = cliente.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {datosCliente.nombre} {datosCliente.apellido}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{datosCliente.idClienteCode}</p>
        </div>
        {datosCliente.estado === "activo" && (
          <Link
            to={`/clientes/${clienteId}/contratos/nuevo`}
            className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            + Nuevo contrato
          </Link>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Datos del cliente</h2>
          {!editandoCliente && (
            <button
              type="button"
              onClick={empezarEdicionCliente}
              className="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
            >
              Editar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cédula</p>
            <p className="text-sm text-slate-900 dark:text-white">{datosCliente.cedula}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha de alta</p>
            <p className="text-sm text-slate-900 dark:text-white">{formatFecha(datosCliente.fechaAlta)}</p>
          </div>
          <EditableField label="Nombre" value={editandoCliente ? nombre : datosCliente.nombre} editing={editandoCliente} onChange={setNombre} />
          <EditableField label="Apellido" value={editandoCliente ? apellido : datosCliente.apellido} editing={editandoCliente} onChange={setApellido} />
          <EditableField label="Teléfono" value={editandoCliente ? telefono : datosCliente.telefono} editing={editandoCliente} onChange={setTelefono} />
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Estado</p>
            {editandoCliente ? (
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoCliente)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            ) : (
              <p className="text-sm text-slate-900 dark:text-white">{datosCliente.estado}</p>
            )}
          </div>
        </div>

        {errorCliente && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorCliente}</p>}

        {editandoCliente && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={guardarCliente}
              disabled={guardandoCliente}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditandoCliente(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
          </div>
        )}
      </section>

      {vehiculo && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Vehículo</h2>
            {!editandoVehiculo && (
              <button
                type="button"
                onClick={() => {
                  setKilometraje(String(vehiculo.kilometraje));
                  setEditandoVehiculo(true);
                }}
                className="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Editar kilometraje
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</p>
              <p className="text-sm text-slate-900 dark:text-white">{vehiculo.tipo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Marca / Modelo</p>
              <p className="text-sm text-slate-900 dark:text-white">
                {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chapa</p>
              <p className="text-sm text-slate-900 dark:text-white">{vehiculo.chapa || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kilometraje</p>
              {editandoVehiculo ? (
                <input
                  type="number"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-white">{vehiculo.kilometraje} km</p>
              )}
            </div>
          </div>
          {editandoVehiculo && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={guardarVehiculo}
                disabled={guardandoVehiculo}
                className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoVehiculo(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>
      )}

      {equipo && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Equipo GPS</h2>
            {!editandoEquipo && (
              <button
                type="button"
                onClick={() => {
                  setOperadora(equipo.operadora);
                  setEditandoEquipo(true);
                }}
                className="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
              >
                Editar operadora
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Marca</p>
              <p className="text-sm text-slate-900 dark:text-white">{equipo.marcaEquipo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">IMEI</p>
              <p className="text-sm text-slate-900 dark:text-white">{equipo.imei}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Chip</p>
              <p className="text-sm text-slate-900 dark:text-white">{equipo.numeroChip}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Operadora</p>
              {editandoEquipo ? (
                <input
                  type="text"
                  value={operadora}
                  onChange={(e) => setOperadora(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-sm text-slate-900 dark:text-white">{equipo.operadora}</p>
              )}
            </div>
          </div>
          {editandoEquipo && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={guardarEquipo}
                disabled={guardandoEquipo}
                className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoEquipo(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>
      )}

      {fotos.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Fotos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fotos.map((foto) => (
              <a key={foto.id} href={foto.urlR2} target="_blank" rel="noreferrer">
                <img src={foto.urlR2} alt="" className="aspect-square w-full rounded-md object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Contratos</h2>
        {contratos.loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}
        {contratos.data && contratos.data.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Este cliente todavía no tiene contratos.</p>
        )}
        {contratos.data && contratos.data.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {contratos.data.map((contrato) => (
              <li key={contrato.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <Link to={`/contratos/${contrato.id}`} className="font-medium text-purple-600 hover:underline dark:text-purple-400">
                    Contrato #{contrato.id}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {contrato.tipoVenta} · desde {formatFecha(contrato.fechaInicio)}
                  </p>
                </div>
                <span className="text-slate-700 dark:text-slate-300">{formatGuaranies(contrato.precioPromocional)}/mes</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
