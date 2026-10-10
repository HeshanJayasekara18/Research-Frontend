"use client";

import type { HealthState } from "../hooks/useHealth";

export function ServiceStatus({ state }: { state: HealthState }) {
  if (state.error) return <span className="pill pill-bad" role="status">● Service offline</span>;
  if (!state.health) return <span className="pill" role="status">Connecting…</span>;
  const h = state.health;
  return (
    <span className="pill pill-ok" role="status" title={`Service v${h.version} · API ${h.api_version}`}>
      ● {h.corpus_documents.toLocaleString()} comments · {h.videos} videos
      {h.semantic.index_present ? " · meaning search on" : ""}
    </span>
  );
}
