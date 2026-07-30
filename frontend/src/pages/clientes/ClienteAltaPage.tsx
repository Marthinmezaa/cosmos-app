import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { crearCliente } from "../../api/clientes";
import { subirFoto } from "../../api/uploads";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api-client";
import type { ClienteCompleto } from "../../lib/types";

interface FotoEnCurso {
  id: string;
  nombreArchivo: string;
  estado: "subiendo" | "lista" | "error";
  url: string | null;
  error?: string;
}

interface FormState {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  trakzeeUsuario: string;
  trakzeePassword: string;
  tipo: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  chapa: string;
  chasis: string;
  kilometraje: string;
  marcaEquipo: string;
  imei: string;
  numeroChip: string;
  operadora: string;
}

const INITIAL_STATE: FormState = {
  cedula: "",
  nombre: "",
  apellido: "",
  telefono: "",
  trakzeeUsuario: "",
  trakzeePassword: "",
  tipo: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  chapa: "",
  chasis: "",
  kilometraje: "",
  marcaEquipo: "",
  imei: "",
  numeroChip: "",
  operadora: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

export function ClienteAltaPage() {
  const { usuario } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [fotos, setFotos] = useState<FotoEnCurso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creado, setCreado] = useState<ClienteCompleto | null>(null);

  function setField(name: keyof FormState, value: string): void {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function agregarFotos(event: ChangeEvent<HTMLInputElement>): void {
    const archivos = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const archivo of archivos) {
      const id = crypto.randomUUID();
      setFotos((fs) => [...fs, { id, nombreArchivo: archivo.name, estado: "subiendo", url: null }]);

      subirFoto(archivo)
        .then((url) => {
          setFotos((fs) => fs.map((f) => (f.id === id ? { ...f, estado: "lista", url } : f)));
        })
        .catch((err) => {
          const mensaje = err instanceof ApiError ? err.message : "No se pudo subir la foto";
          setFotos((fs) => fs.map((f) => (f.id === id ? { ...f, estado: "error", error: mensaje } : f)));
        });
    }
  }

  function quitarFoto(id: string): void {
    setFotos((fs) => fs.filter((f) => f.id !== id));
  }

  const hayFotosSubiendo = fotos.some((f) => f.estado === "subiendo");

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const resultado = await crearCliente({
        cliente: {
          cedula: form.cedula,
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          trakzeeUsuario: form.trakzeeUsuario || undefined,
          trakzeePassword: form.trakzeePassword || undefined,
        },
        vehiculo: {
          tipo: form.tipo,
          marca: form.marca,
          modelo: form.modelo,
          anio: Number(form.anio),
          color: form.color || undefined,
          chapa: form.chapa || undefined,
          chasis: form.chasis || undefined,
          kilometraje: form.kilometraje ? Number(form.kilometraje) : undefined,
        },
        equipo: {
          marcaEquipo: form.marcaEquipo,
          imei: form.imei,
          numeroChip: form.numeroChip,
          operadora: form.operadora,
        },
        fotos: fotos.filter((f) => f.estado === "lista" && f.url).map((f) => ({ urlR2: f.url! })),
      });
      setCreado(resultado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el cliente");
    } finally {
      setSubmitting(false);
    }
  }

  if (creado) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-900/20">
        <h1 className="text-lg font-semibold text-green-800 dark:text-green-200">Cliente registrado</h1>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          {creado.cliente.idClienteCode} · {creado.cliente.nombre} {creado.cliente.apellido}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_STATE);
              setFotos([]);
              setCreado(null);
            }}
            className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Dar de alta otro cliente
          </button>
          <Link
            to={`/clientes/${creado.cliente.id}/contratos/nuevo`}
            className="rounded-md border border-purple-300 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-white dark:border-purple-800 dark:text-purple-300"
          >
            Crear contrato para este cliente
          </Link>
          {usuario?.rol === "admin" && (
            <Link
              to={`/clientes/${creado.cliente.id}`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200"
            >
              Ver ficha del cliente
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Alta de cliente</h1>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Datos del cliente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cédula" name="cedula" value={form.cedula} onChange={setField} required />
          <Field label="Teléfono" name="telefono" value={form.telefono} onChange={setField} required />
          <Field label="Nombre" name="nombre" value={form.nombre} onChange={setField} required />
          <Field label="Apellido" name="apellido" value={form.apellido} onChange={setField} required />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Acceso a Trakzee (opcional)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Credenciales del cliente en la plataforma externa de rastreo (trakzee.uffizio.com), para consultarlas si se
          las olvida. No son la contraseña de este sistema.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Usuario Trakzee" name="trakzeeUsuario" value={form.trakzeeUsuario} onChange={setField} />
          <Field label="Contraseña Trakzee" name="trakzeePassword" value={form.trakzeePassword} onChange={setField} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Vehículo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo" name="tipo" value={form.tipo} onChange={setField} required />
          <Field label="Marca" name="marca" value={form.marca} onChange={setField} required />
          <Field label="Modelo" name="modelo" value={form.modelo} onChange={setField} required />
          <Field label="Año" name="anio" type="number" value={form.anio} onChange={setField} required />
          <Field label="Color" name="color" value={form.color} onChange={setField} />
          <Field label="Chapa" name="chapa" value={form.chapa} onChange={setField} />
          <Field label="Chasis" name="chasis" value={form.chasis} onChange={setField} />
          <Field label="Kilometraje" name="kilometraje" type="number" value={form.kilometraje} onChange={setField} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Equipo GPS</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Marca del equipo" name="marcaEquipo" value={form.marcaEquipo} onChange={setField} required />
          <Field label="Operadora" name="operadora" value={form.operadora} onChange={setField} required />
          <Field label="IMEI" name="imei" value={form.imei} onChange={setField} required />
          <Field label="Número de chip" name="numeroChip" value={form.numeroChip} onChange={setField} required />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Fotos (opcional)</h2>
          <label className="cursor-pointer text-sm font-medium text-purple-600 hover:underline dark:text-purple-400">
            + Agregar fotos
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={agregarFotos} className="hidden" />
          </label>
        </div>
        {fotos.map((foto) => (
          <div key={foto.id} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
            {foto.estado === "lista" && foto.url && (
              <img src={foto.url} alt="" className="h-10 w-10 rounded object-cover" />
            )}
            <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{foto.nombreArchivo}</span>
            {foto.estado === "subiendo" && <span className="text-xs text-slate-500 dark:text-slate-400">Subiendo…</span>}
            {foto.estado === "error" && <span className="text-xs text-red-600 dark:text-red-400">{foto.error}</span>}
            <button
              type="button"
              onClick={() => quitarFoto(foto.id)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              Quitar
            </button>
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || hayFotosSubiendo}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
      >
        {submitting ? "Guardando…" : hayFotosSubiendo ? "Esperando fotos…" : "Registrar cliente"}
      </button>
    </form>
  );
}
