import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { login as loginRequest, me as meRequest } from "../api/auth";
import { setAuthToken } from "../lib/api-client";
import type { Usuario } from "../lib/types";

const TOKEN_STORAGE_KEY = "cosmostrak_token";

interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    setAuthToken(token);
    meRequest()
      .then(setUsuario)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { token, usuario: usuarioLogueado } = await loginRequest(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuthToken(token);
    setUsuario(usuarioLogueado);
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
