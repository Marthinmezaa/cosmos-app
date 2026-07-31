import { type FormEvent, useState } from "react";
import { actualizarActivo, crearUsuario, listarUsuarios, resetearPassword } from "../api/usuarios";
import { useAsync } from "../hooks/useAsync";
import { ApiError } from "../lib/api-client";
import type { RolGestionable } from "../lib/types";

const INITIAL_FORM = { nombre: "", email: "", password: "", rol: "vendedor" as RolGestionable };

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={
        activo
          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
      }
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

export function UsuariosPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rolFiltro, setRolFiltro] = useState<RolGestionable | "">("");
  const [busqueda, setBusqueda] = useState("");

  const [passwordTemporal, setPasswordTemporal] = useState<{ nombre: string; passwordTemporal: string } | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [confirmandoDesactivarId, setConfirmandoDesactivarId] = useState<number | null>(null);

  const { data: usuarios, loading, error, reload } = useAsync(
    () => listarUsuarios({ rol: rolFiltro || undefined, busqueda: busqueda || undefined }),
    [rolFiltro, busqueda],
  );

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await crearUsuario(form);
      setForm(INITIAL_FORM);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo crear el usuario");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(id: number, nombre: string): Promise<void> {
    setAccionError(null);
    setProcesandoId(id);
    try {
      const resultado = await resetearPassword(id);
      setPasswordTemporal({ nombre, passwordTemporal: resultado.passwordTemporal });
    } catch (err) {
      setAccionError(err instanceof ApiError ? err.message : "No se pudo resetear la contraseña");
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleToggleActivo(id: number, activo: boolean): Promise<void> {
    setConfirmandoDesactivarId(null);
    setAccionError(null);
    setProcesandoId(id);
    try {
      await actualizarActivo(id, !activo);
      reload();
    } catch (err) {
      setAccionError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado");
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Usuarios (admin / vendedor)</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="sm:col-span-2">
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre
          </label>
          <input
            id="nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="rol" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Rol
          </label>
          <select
            id="rol"
            value={form.rol}
            onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as RolGestionable }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña inicial
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {submitting ? "Creando…" : "Crear usuario"}
          </button>
        </div>
        {formError && <p className="sm:col-span-5 text-sm text-red-600 dark:text-red-400">{formError}</p>}
      </form>

      {passwordTemporal && (
        <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm dark:border-purple-900 dark:bg-purple-900/20">
          <span className="text-purple-800 dark:text-purple-200">
            Nueva contraseña temporal para <strong>{passwordTemporal.nombre}</strong>:{" "}
            <code className="rounded bg-white px-1.5 py-0.5 dark:bg-slate-900">{passwordTemporal.passwordTemporal}</code>{" "}
            (también se envió por email). Se muestra una única vez.
          </span>
          <button
            type="button"
            onClick={() => setPasswordTemporal(null)}
            className="text-purple-600 hover:underline dark:text-purple-400"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <select
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value as RolGestionable | "")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="vendedor">Vendedor</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {accionError && <p className="text-sm text-red-600 dark:text-red-400">{accionError}</p>}
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>}

      {usuarios && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">{usuario.nombre}</td>
                  <td className="px-4 py-2">{usuario.email}</td>
                  <td className="px-4 py-2 capitalize">{usuario.rol}</td>
                  <td className="px-4 py-2">
                    <EstadoBadge activo={usuario.activo} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={procesandoId === usuario.id}
                        onClick={() => handleResetPassword(usuario.id, usuario.nombre)}
                        className="text-purple-600 hover:underline disabled:opacity-40 dark:text-purple-400"
                      >
                        Resetear contraseña
                      </button>
                      {usuario.activo && confirmandoDesactivarId === usuario.id ? (
                        <>
                          <span className="text-slate-500 dark:text-slate-400">¿Seguro?</span>
                          <button
                            type="button"
                            disabled={procesandoId === usuario.id}
                            onClick={() => handleToggleActivo(usuario.id, usuario.activo)}
                            className="text-red-600 hover:underline disabled:opacity-40 dark:text-red-400"
                          >
                            Sí, desactivar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoDesactivarId(null)}
                            className="text-slate-500 hover:underline dark:text-slate-400"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={procesandoId === usuario.id}
                          onClick={() =>
                            usuario.activo
                              ? setConfirmandoDesactivarId(usuario.id)
                              : handleToggleActivo(usuario.id, usuario.activo)
                          }
                          className="text-slate-600 hover:underline disabled:opacity-40 dark:text-slate-300"
                        >
                          {usuario.activo ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </div>
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
