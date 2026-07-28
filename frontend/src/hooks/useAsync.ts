import { useEffect, useState } from "react";
import { ApiError } from "../lib/api-client";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err instanceof ApiError ? err.message : "Error inesperado" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}
