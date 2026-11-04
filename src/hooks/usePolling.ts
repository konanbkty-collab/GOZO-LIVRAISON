"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PollState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/** Interroge une API à intervalle régulier (suivi temps réel). */
export function usePolling<T>(fn: () => Promise<T>, intervalMs: number, enabled = true): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, run]);

  return { data, loading, error, refresh: run };
}

/** Petit hook fetch utilitaire (POST/PATCH JSON). */
export function useApi() {
  return useCallback(
    async <T,>(url: string, body?: unknown, method = "POST"): Promise<T> => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`);
      return json as T;
    },
    [],
  );
}
