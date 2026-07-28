import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { defaultPathForRol } from "../lib/roles";
import type { Rol } from "../lib/types";

interface ProtectedRouteProps {
  roles?: Rol[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 dark:text-slate-400">Cargando…</div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={defaultPathForRol(usuario.rol)} replace />;
  }

  return <Outlet />;
}
