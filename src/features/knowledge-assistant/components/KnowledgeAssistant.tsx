"use client";

import { useEffect, useRef, useState } from "react";

import { getHealth, KnowledgeAssistantError, retrieveComments } from "../api/client";
import {
  METHOD_LABELS,
  QUERY_MAX_CHARS,
  RETRIEVAL_METHODS,
  TOP_K_MAX,
  TOP_K_MIN,
  type HealthResponse,
  type RetrievalMethod,
  type RetrieveResponse,
} from "../api/types";
import { VIDEO_ID_RE } from "../api/validate";
import { RetrievalResults } from "./RetrievalResults";
import styles from "./KnowledgeAssistant.module.css";

const SEMANTIC: RetrievalMethod[] = ["labse", "normalized_labse", "multiview_labse", "multiview_hybrid"];

export function KnowledgeAssistant() {
  const [query, setQuery] = useState("");
  const [videoId, setVideoId] = useState("");
  const [method, setMethod] = useState<RetrievalMethod>("bm25");
  const [topK, setTopK] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<KnowledgeAssistantError | null>(null);
  const [response, setResponse] = useState<RetrieveResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getHealth(ctrl.signal)
      .then(setHealth)
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setHealthError(e instanceof Error ? e.message : "Unavailable");
      });
    return () => ctrl.abort();
  }, []);

  const semanticOff = health ? !health.semantic.index_present : false;
  const videoInvalid = videoId.trim() !== "" && !VIDEO_ID_RE.test(videoId.trim());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || videoInvalid) return;
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await retrieveComments(
        { query: query.trim(), method, top_k: topK, scope: { video_id: videoId.trim() || null } },
        ctrl.signal,
      );
      setResponse(res);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setResponse(null);
      setError(err instanceof KnowledgeAssistantError ? err : new KnowledgeAssistantError(0, "unknown_error", "Something went wrong."));
    } finally {
      if (inflight.current === ctrl) setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1>Knowledge Assistant</h1>
          <p className={styles.sub}>Search a video&apos;s YouTube comments in Singlish, Sinhala or English.</p>
        </div>
        <ServiceBadge health={health} error={healthError} />
      </header>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>Question</span>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={QUERY_MAX_CHARS}
            rows={3}
            placeholder="e.g. Me wetakolu video eke poththa ain karana eka gana viewers la monawada kiyanne?"
            required
          />
          <small className={styles.hint}>{query.length}/{QUERY_MAX_CHARS}</small>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Video ID</span>
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="-3a4abtQH3E"
              aria-invalid={videoInvalid}
              spellCheck={false}
            />
            {videoInvalid && <small className={styles.fieldError}>Letters, digits, - and _ only.</small>}
          </label>

          <label className={styles.field}>
            <span>Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as RetrievalMethod)}>
              {RETRIEVAL_METHODS.map((m) => (
                <option key={m} value={m} disabled={semanticOff && SEMANTIC.includes(m)}>
                  {METHOD_LABELS[m]}
                  {semanticOff && SEMANTIC.includes(m) ? " (unavailable)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className={`${styles.field} ${styles.narrow}`}>
            <span>Results</span>
            <input
              type="number"
              min={TOP_K_MIN}
              max={TOP_K_MAX}
              value={topK}
              onChange={(e) => setTopK(Math.min(TOP_K_MAX, Math.max(TOP_K_MIN, Number(e.target.value) || TOP_K_MIN)))}
            />
          </label>
        </div>

        <button className={styles.submit} type="submit" disabled={loading || !query.trim() || videoInvalid}>
          {loading ? "Searching…" : "Search comments"}
        </button>
      </form>

      {error && (
        <div className={styles.error} role="alert">
          <strong>{error.message}</strong>
          <span className={styles.meta}>
            {error.code}
            {error.requestId ? ` · request ${error.requestId}` : ""}
          </span>
        </div>
      )}

      {response && <RetrievalResults response={response} />}
    </div>
  );
}

function ServiceBadge({ health, error }: { health: HealthResponse | null; error: string | null }) {
  if (error) return <span className={`${styles.badge} ${styles.badgeBad}`}>Service offline</span>;
  if (!health) return <span className={styles.badge}>Checking service…</span>;
  return (
    <span className={`${styles.badge} ${styles.badgeOk}`} title={`v${health.version} · API ${health.api_version}`}>
      {health.corpus_documents.toLocaleString()} comments · {health.videos} videos
      {health.semantic.index_present ? " · LaBSE ready" : ""}
    </span>
  );
}
