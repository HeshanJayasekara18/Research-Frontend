"use client";

import { useEffect, useState } from "react";

import { getHealth } from "../api/client";
import type { HealthResponse } from "../api/types";

export interface HealthState {
  health: HealthResponse | null;
  error: string | null;
  loading: boolean;
  semanticReady: boolean;
}

export function useHealth(): HealthState {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getHealth(ctrl.signal)
      .then(setHealth)
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Service unavailable");
      });
    return () => ctrl.abort();
  }, []);

  return {
    health,
    error,
    loading: !health && !error,
    semanticReady: Boolean(health?.semantic.index_present),
  };
}
