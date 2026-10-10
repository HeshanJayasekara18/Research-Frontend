"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/shell/Icon";

import { retrieveComments } from "../api/client";
import { QUERY_MAX_CHARS, type RetrievalMethod } from "../api/types";
import { useHealth } from "../hooks/useHealth";
import { poolCandidates, summarize, type MethodRun } from "../lib/compare";
import { COMPARE_DEFAULT, METHOD_ORDER, METHODS } from "../lib/methods";
import { extractVideoId, ScopePicker, scopeError, type Scope } from "./ScopePicker";
import { ScoreChart } from "./ScoreChart";
import styles from "./analysis.module.css";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];
const MAX_METHODS = 4;

export function EvidenceAnalysis() {
  const params = useSearchParams();
  const health = useHealth();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [scope, setScope] = useState<Scope>(
    params.get("video") ? { mode: "video", videoId: params.get("video")! } : { mode: params.get("q") ? "all" : "video", videoId: "" },
  );
  const [topK, setTopK] = useState(5);
  const [methods, setMethods] = useState<RetrievalMethod[]>(["bm25", "normalized_bm25", "multiview_bm25"]);
  const methodsTouched = useRef(false);
  const [runs, setRuns] = useState<MethodRun[] | null>(null);
  const [ranAt, setRanAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const autoRan = useRef(false);

  useEffect(() => {
    if (!methodsTouched.current && health.health) {
      setMethods(health.semanticReady ? COMPARE_DEFAULT : ["bm25", "char_tfidf", "normalized_bm25", "multiview_bm25"]);
    }
  }, [health.health, health.semanticReady]);

  const scopeErr = scopeError(scope);
  const canRun = query.trim().length > 0 && !scopeErr && methods.length > 0 && !loading;

  async function run() {
    if (!canRun) return;
    setLoading(true);
    setSelected(null);
    const videoId = scope.mode === "video" ? extractVideoId(scope.videoId) : null;
    const settled = await Promise.allSettled(
      methods.map((m) => retrieveComments({ query: query.trim(), method: m, top_k: topK, scope: { video_id: videoId } })),
    );
    const next = methods.map((m, i): MethodRun => {
      const s = settled[i];
      return s.status === "fulfilled" ? { method: m, response: s.value } : { method: m, error: s.reason instanceof Error ? s.reason.message : "Failed" };
    });
    setRuns(next);
    setRanAt(new Date());
    setLoading(false);
  }

  // Arriving from the assistant with ?q=…: run once health is known so method defaults are settled.
  useEffect(() => {
    if (!autoRan.current && params.get("q") && health.health) {
      autoRan.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health.health]);

  function toggle(m: RetrievalMethod) {
    methodsTouched.current = true;
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : prev.length >= MAX_METHODS ? prev : [...prev, m]));
  }

  const summaries = useMemo(() => (runs ? summarize(runs, Math.min(topK, 5)) : []), [runs, topK]);
  const candidates = useMemo(() => (runs ? poolCandidates(runs) : []), [runs]);
  const okRuns = runs?.filter((r) => r.response) ?? [];
  const first = okRuns[0]?.response;
  const selectedCandidate = candidates.find((c) => c.comment.document_id === selected) ?? candidates[0];
  const colour = (m: RetrievalMethod) => SERIES[(runs ?? []).findIndex((r) => r.method === m) % SERIES.length];

  return (
    <div className="page">
      <header className={styles.head}>
        <div>
          <h1 className="page-title">Evidence &amp; Analysis</h1>
          <p className="page-subtitle">Run one question through several retrieval methods and compare what each one finds.</p>
        </div>
      </header>

      <form
        className={`card ${styles.queryCard}`}
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className={styles.queryRow}>
          <span className={styles.qIcon} aria-hidden>
            <Icon name="chat" />
          </span>
          <label htmlFor="ea-query" className="sr-only">
            Question
          </label>
          <textarea
            id="ea-query"
            className={styles.query}
            rows={2}
            maxLength={QUERY_MAX_CHARS}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a question in Singlish, Sinhala or English"
          />
        </div>
        <div className={styles.queryControls}>
          <ScopePicker value={scope} onChange={setScope} />
          <fieldset className={styles.methods}>
            <legend className="field">Methods to compare (up to {MAX_METHODS})</legend>
            <div className={styles.chips}>
              {METHOD_ORDER.map((m) => {
                const off = METHODS[m].semantic && !health.semanticReady;
                const on = methods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={styles.chip}
                    aria-pressed={on}
                    disabled={off || (!on && methods.length >= MAX_METHODS)}
                    title={off ? "Meaning search is not available on the server" : METHODS[m].description}
                    onClick={() => toggle(m)}
                  >
                    {on && <Icon name="check" size={14} />}
                    {METHODS[m].short}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className={styles.runRow}>
            <label className="field">
              Top K
              <select className="input" value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
                {[5, 10, 20].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary" disabled={!canRun}>
              {loading ? "Running…" : "Run comparison"}
            </button>
          </div>
        </div>
      </form>

      {runs && first && (
        <p className={styles.runMeta}>
          <span className="pill">{first.scope.type === "video" ? `Video ${first.scope.video_id}` : "All videos"}</span>
          <span className="caption">
            {first.scope.documents_searched.toLocaleString()} comments searched
            {ranAt ? ` · ${ranAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
        </p>
      )}

      {runs && (
        <section aria-labelledby="mc-title" className="card">
          <div className={styles.sectionHead}>
            <h2 id="mc-title" className="section-title">
              Method comparison
            </h2>
            <span className="caption">Scores are only comparable within one method. Bars show each score relative to that method&apos;s top result.</span>
          </div>
          <div className={styles.methodGrid}>
            {summaries.map((s, i) => {
              const r = runs[i];
              return (
                <div key={s.method} className={styles.methodCard} style={{ "--c": colour(s.method) } as React.CSSProperties}>
                  <div className={styles.methodName}>
                    <strong>{METHODS[s.method].short}</strong>
                    <span className="caption">{METHODS[s.method].label}</span>
                  </div>
                  {r.error ? (
                    <p className={styles.methodErr}>{r.error}</p>
                  ) : (
                    <>
                      <div className={styles.stats}>
                        <div>
                          <b>{s.retrieved}</b>
                          <span className="caption">Retrieved</span>
                        </div>
                        <div>
                          <b>{s.agreement === null ? "–" : `${Math.round(s.agreement * 100)}%`}</b>
                          <span className="caption">Shared with others</span>
                        </div>
                      </div>
                      <ol className={styles.bars}>
                        {s.top.map((t) => (
                          <li key={t.documentId}>
                            <span className="caption">#{t.rank}</span>
                            <span className={styles.track} aria-hidden>
                              <span style={{ width: `${Math.max(4, t.relative * 100)}%` }} />
                            </span>
                            <span className={styles.num}>{t.score.toFixed(s.method.startsWith("multiview") ? 4 : 2)}</span>
                          </li>
                        ))}
                        {s.top.length === 0 && <li className="caption">No matches</li>}
                      </ol>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {runs && (
        <div className={styles.lower}>
          <section aria-labelledby="cand-title" className="card">
            <div className={styles.sectionHead}>
              <h2 id="cand-title" className="section-title">
                Retrieved candidates
              </h2>
              <span className="caption">
                {candidates.length} unique comments, ordered by how many methods found them
              </span>
            </div>
            {candidates.length === 0 ? (
              <p className="muted">No method retrieved any comments. Try rephrasing or a meaning-based method.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Comment</th>
                      {okRuns.map((r) => (
                        <th key={r.method} scope="col" className={styles.rankCol} title={METHODS[r.method].label}>
                          <span className={styles.dot} style={{ background: colour(r.method) }} />
                          {METHODS[r.method].short}
                        </th>
                      ))}
                      <th scope="col">Found by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const isSel = selectedCandidate?.comment.document_id === c.comment.document_id;
                      return (
                        <tr key={c.comment.document_id} aria-selected={isSel} className={isSel ? styles.selRow : undefined}>
                          <td>
                            <button type="button" className={styles.rowBtn} onClick={() => setSelected(c.comment.document_id)}>
                              <span lang="si">{c.comment.text.length > 110 ? `${c.comment.text.slice(0, 110)}…` : c.comment.text}</span>
                            </button>
                          </td>
                          {okRuns.map((r) => (
                            <td key={r.method} className={styles.rankCol}>
                              {c.ranks[r.method] ? `#${c.ranks[r.method]}` : <span className="caption">–</span>}
                            </td>
                          ))}
                          <td>
                            <span className={c.foundBy === okRuns.length && okRuns.length > 1 ? "pill pill-tint" : "pill"}>
                              {c.foundBy}/{okRuns.length}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className={styles.sideStack}>
            <section aria-labelledby="chart-title" className="card">
              <h2 id="chart-title" className="section-title">
                Relative score by rank
              </h2>
              <ScoreChart
                series={summaries
                  .filter((s) => s.top.length)
                  .map((s) => ({ name: METHODS[s.method].short, color: colour(s.method), values: s.top.map((t) => t.relative) }))}
              />
            </section>

            {selectedCandidate && (
              <section aria-labelledby="sel-title" className={`card ${styles.selected}`}>
                <h2 id="sel-title" className="section-title">
                  Selected comment
                </h2>
                <p lang="si">{selectedCandidate.comment.text}</p>
                <div className={styles.selMeta}>
                  {selectedCandidate.comment.likes !== null && (
                    <span className="pill">
                      <Icon name="heart" size={13} /> {selectedCandidate.comment.likes}
                    </span>
                  )}
                  {Object.entries(selectedCandidate.ranks).map(([m, rank]) => (
                    <span key={m} className="pill">
                      {METHODS[m as RetrievalMethod].short} #{rank}
                    </span>
                  ))}
                </div>
                {selectedCandidate.comment.video_url && (
                  <a className="btn btn-plain" href={selectedCandidate.comment.video_url} target="_blank" rel="noopener noreferrer">
                    Open video <code>{selectedCandidate.comment.video_id}</code>
                    <Icon name="external" size={14} />
                  </a>
                )}
              </section>
            )}

            <section className={`card ${styles.honest}`}>
              <h2 className="section-title">Reading these results</h2>
              <p className="caption">
                &ldquo;Shared with others&rdquo; measures agreement between methods, not correctness. Relevance can only be
                measured against human-labelled judgements, which are being collected for the evaluation study. Experimental
                methods are not yet validated.
              </p>
            </section>
          </div>
        </div>
      )}

      {!runs && !loading && (
        <div className={`card ${styles.emptyState}`}>
          <Icon name="chart" size={28} />
          <p className="muted">Enter a question, choose up to four methods and run the comparison.</p>
        </div>
      )}
    </div>
  );
}
