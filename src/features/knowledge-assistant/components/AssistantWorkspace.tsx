"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/shell/Icon";

import { KnowledgeAssistantError, retrieveComments } from "../api/client";
import { QUERY_MAX_CHARS, type RetrievalMethod, type RetrieveResponse } from "../api/types";
import { useHealth } from "../hooks/useHealth";
import { timeAgo, useRecentSearches, type RecentSearch } from "../hooks/useRecentSearches";
import { defaultMethod, METHODS } from "../lib/methods";
import { EvidenceCard } from "./EvidenceCard";
import { MethodSelect } from "./MethodSelect";
import { extractVideoId, ScopePicker, scopeError, type Scope } from "./ScopePicker";
import { ServiceStatus } from "./ServiceStatus";
import styles from "./workspace.module.css";

const EXAMPLES = [
  "Me wetakolu video eke poththa ain karana eka gana viewers la monawada kiyanne?",
  "Bandi full magic mix eka kade ganna thiyenawada?",
  "Viewers la kamathi monawa gena da?",
];

export function AssistantWorkspace() {
  const health = useHealth();
  const recent = useRecentSearches();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>({ mode: "video", videoId: "" });
  const [method, setMethod] = useState<RetrievalMethod>("bm25");
  const methodTouched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<KnowledgeAssistantError | null>(null);
  const [response, setResponse] = useState<RetrieveResponse | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // Pick the default method once we know whether meaning search is available.
  useEffect(() => {
    if (!methodTouched.current && health.health) setMethod(defaultMethod(health.semanticReady));
  }, [health.health, health.semanticReady]);

  const scopeErr = scopeError(scope);
  const canSend = query.trim().length > 0 && !scopeErr && !loading;

  async function run(q: string, s: Scope, m: RetrievalMethod) {
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    setLoading(true);
    setError(null);
    const videoId = s.mode === "video" ? extractVideoId(s.videoId) : null;
    try {
      const res = await retrieveComments({ query: q.trim(), method: m, top_k: 10, scope: { video_id: videoId } }, ctrl.signal);
      setResponse(res);
      recent.add({ query: q.trim(), videoId, method: m });
      requestAnimationFrame(() => resultsRef.current?.focus());
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setResponse(null);
      setError(err instanceof KnowledgeAssistantError ? err : new KnowledgeAssistantError(0, "unknown_error", "Something went wrong."));
    } finally {
      if (inflight.current === ctrl) setLoading(false);
    }
  }

  function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (canSend) void run(query, scope, method);
  }

  function reopen(r: RecentSearch) {
    const s: Scope = r.videoId ? { mode: "video", videoId: r.videoId } : { mode: "all", videoId: "" };
    methodTouched.current = true;
    setQuery(r.query);
    setScope(s);
    setMethod(r.method);
    void run(r.query, s, r.method);
  }

  const compareHref = response
    ? `/knowledge-assistant/evidence?${new URLSearchParams({
        q: response.query,
        ...(response.scope.video_id ? { video: response.scope.video_id } : {}),
      }).toString()}`
    : "/knowledge-assistant/evidence";

  const maxScore = response?.results.reduce((m, r) => Math.max(m, r.score), 0) ?? 0;

  return (
    <div className={styles.layout}>
      <aside className={styles.side} aria-label="Recent searches">
        <button
          type="button"
          className="btn btn-plain"
          onClick={() => {
            setQuery("");
            setResponse(null);
            setError(null);
          }}
        >
          + New search
        </button>
        <div className={styles.recentHead}>
          <h2 className={styles.sideTitle}>Recent</h2>
          {recent.items.length > 0 && (
            <button type="button" className={styles.iconBtn} onClick={recent.clear} aria-label="Clear recent searches">
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
        {recent.items.length === 0 ? (
          <p className="caption">Your searches appear here. They are stored only in this browser.</p>
        ) : (
          <ul className={styles.recent}>
            {recent.items.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => reopen(r)} title={r.query}>
                  <span className={styles.recentQ}>{r.query}</span>
                  <span className="caption">
                    {r.videoId ?? "All videos"} · {timeAgo(r.at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.tip}>
          <strong>Ask in Singlish!</strong>
          <span className="caption">You can ask in Sinhala, English or a mix. Spelling doesn&apos;t need to be perfect.</span>
        </div>
      </aside>

      <div className={styles.main}>
        <section className={styles.hero}>
          <div>
            <h1 className="page-title">Your Creator Knowledge Assistant</h1>
            <p className="page-subtitle">
              Ask a question and see what your audience actually said, ranked from your YouTube comments.
            </p>
          </div>
          <ServiceStatus state={health} />
        </section>

        <form className={`card ${styles.composer}`} onSubmit={onSubmit} aria-busy={loading}>
          <div className={styles.controls}>
            <ScopePicker value={scope} onChange={setScope} />
            <MethodSelect
              value={method}
              semanticReady={health.semanticReady}
              onChange={(m) => {
                methodTouched.current = true;
                setMethod(m);
              }}
            />
          </div>
          <label htmlFor="ka-query" className="sr-only">
            Your question
          </label>
          <textarea
            id="ka-query"
            className={styles.textarea}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(e);
            }}
            maxLength={QUERY_MAX_CHARS}
            rows={3}
            placeholder="e.g. Machan, mama aluth camera ekak ganna hithanawa. Audience eka recommend karanne mokadda?"
          />
          <div className={styles.composerFoot}>
            <div className={styles.examples}>
              {!query &&
                EXAMPLES.map((ex) => (
                  <button key={ex} type="button" className="pill" onClick={() => setQuery(ex)}>
                    {ex.length > 42 ? `${ex.slice(0, 42)}…` : ex}
                  </button>
                ))}
            </div>
            <span className="caption" aria-live="polite">
              {query.length}/{QUERY_MAX_CHARS}
            </span>
            <button className="btn btn-primary" type="submit" disabled={!canSend}>
              <Icon name="send" size={16} />
              {loading ? "Searching…" : "Send"}
            </button>
          </div>
        </form>

        {error && (
          <div className={`card ${styles.error}`} role="alert">
            <strong>{error.message}</strong>
            <span className="caption">
              {error.code}
              {error.requestId ? ` · ref ${error.requestId}` : ""}
            </span>
          </div>
        )}

        {loading && !response && <ResultsSkeleton />}

        {response && (
          <section ref={resultsRef} tabIndex={-1} className={styles.results} aria-label="Results">
            <article className={`card ${styles.answer}`}>
              <div className={styles.answerHead}>
                <span className={styles.bot} aria-hidden>
                  <Icon name="sparkle" />
                </span>
                <div>
                  <h2 className="section-title">Assistant answer</h2>
                  <span className="caption">Generated answers are the next milestone</span>
                </div>
                <span className="pill pill-warn">Coming soon</span>
              </div>
              <p className="muted">
                For now the assistant shows the comments that best match your question, so you can read what viewers said
                yourself. Written answers, grounded in these comments and checked against them, will appear here.
              </p>
            </article>

            <article className="card">
              <div className={styles.evidenceHead}>
                <div>
                  <h2 className="section-title">Supporting comments</h2>
                  <span className="caption">
                    {response.result_count} of {response.scope.documents_searched.toLocaleString()} comments ·{" "}
                    {response.scope.type === "video" ? `video ${response.scope.video_id}` : "all videos"} ·{" "}
                    {METHODS[response.method].short}
                  </span>
                </div>
                <Link href={compareHref} className="btn btn-plain">
                  Compare methods <Icon name="arrow" size={16} />
                </Link>
              </div>

              {response.normalization && (
                <p className={styles.norm}>
                  <span className="pill">Singlish → Sinhala: {response.normalization.status}</span>
                  {response.normalization.used ? (
                    <span lang="si">“{response.normalization.normalized_query}”</span>
                  ) : (
                    <span className="caption">Normalised form not used</span>
                  )}
                </p>
              )}

              {response.results.length === 0 ? (
                <div className={styles.empty}>
                  <strong>No matching comments found.</strong>
                  <span className="muted">
                    That doesn&apos;t mean nobody talked about it. Try rephrasing, or switch to a meaning-based method.
                  </span>
                </div>
              ) : (
                <ol className={styles.evidenceList}>
                  {response.results.map((c) => (
                    <EvidenceCard key={c.document_id} comment={c} maxScore={maxScore} />
                  ))}
                </ol>
              )}
              <p className={styles.notice}>
                <Icon name="info" size={15} /> {response.notice}
              </p>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="card" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "grid", gap: 8, padding: "12px 0" }}>
          <div className="skeleton" style={{ height: 14, width: "85%" }} />
          <div className="skeleton" style={{ height: 14, width: "60%" }} />
        </div>
      ))}
    </div>
  );
}
