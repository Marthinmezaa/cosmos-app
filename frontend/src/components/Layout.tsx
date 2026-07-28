import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  { to: "/mi-cuenta", label: "Mi cuenta", roles: ["cliente"] },
];

export function Layout() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(usuario.rol));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-lg font-semibold">Cosmostrak</span>
          <nav className="flex flex-wrap gap-4">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
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
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
