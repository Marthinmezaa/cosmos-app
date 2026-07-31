import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultPathForRol } from "../lib/roles";
import type { Rol } from "../lib/types";

interface NavItem {
  to: string;
  label: string;
  roles: Rol[];
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["admin"], end: true },
  { to: "/clientes", label: "Clientes", roles: ["admin"] },
  { to: "/clientes/nuevo", label: "Alta de cliente", roles: ["admin", "vendedor"] },
  { to: "/caja", label: "Caja", roles: ["admin"] },
  { to: "/metas", label: "Metas", roles: ["admin"] },
  { to: "/usuarios", label: "Usuarios", roles: ["admin"] },
  { to: "/mi-cuenta", label: "Mi cuenta", roles: ["cliente"] },
];

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return `text-sm font-medium ${
    isActive
      ? "text-purple-600 dark:text-purple-400"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
  }`;
}

export function Layout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  if (!usuario) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(usuario.rol));
  // Las rutas del menú son el "home" de cada sección: ahí no hace falta botón de
  // volver. Cualquier otra ruta (ficha de cliente, detalle de contrato, alta de
  // contrato) se llega haciendo clic en algo, así que necesita una forma de volver
  // sin depender del menú (antes, en celular, la única salida era reabrir el menú
  // hamburguesa y tocar "Dashboard" de nuevo).
  const esRutaDeMenu = NAV_ITEMS.some((item) => item.to === location.pathname);

  // navigate(-1) rompe si se entra directo a la página (link compartido, recarga):
  // no hay historial propio a donde volver, así que en ese caso se manda a la
  // pantalla principal del rol en vez de sacar a la persona de la aplicación.
  function volver(): void {
    const state = window.history.state as { idx?: number } | null;
    if (state && typeof state.idx === "number" && state.idx > 0) {
      navigate(-1);
    } else {
      navigate(defaultPathForRol(usuario!.rol));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-semibold">Cosmostrak</span>
            <nav className="hidden flex-wrap gap-4 md:flex">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-3 text-sm md:flex">
            <span className="text-slate-500 dark:text-slate-400">
              {usuario.nombre} · {usuario.rol}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Salir
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="rounded-md border border-slate-300 p-2 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {menuAbierto ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuAbierto && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 md:hidden dark:border-slate-800">
            <nav className="flex flex-col gap-3">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                {usuario.nombre} · {usuario.rol}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 p-6">
        {!esRutaDeMenu && (
          <button
            type="button"
            onClick={volver}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
