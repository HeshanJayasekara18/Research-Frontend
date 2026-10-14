"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn, pill, ui } from "@/components/ui/styles";

import { retrieveComments } from "../api/client";
import { QUERY_MAX_CHARS, type RetrievalMethod } from "../api/types";
import { useHealth } from "../hooks/useHealth";
import { poolCandidates, summarize, type MethodRun } from "../lib/compare";
import { COMPARE_DEFAULT, METHOD_ORDER, METHODS } from "../lib/methods";
import { extractVideoId, ScopePicker, scopeError, type Scope } from "./ScopePicker";
import { ScoreChart } from "./ScoreChart";

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
    <div className={ui.page}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Evidence &amp; Analysis</h1>
          <p className={ui.pageSubtitle}>Run one question through several retrieval methods and compare what each one finds.</p>
        </div>
      </header>

      <form
        className={cn(ui.card, "grid gap-4")}
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-tint-soft text-tint" aria-hidden>
            <Icon name="chat" />
          </span>
          <label htmlFor="ea-query" className="sr-only">
            Question
          </label>
          <textarea
            id="ea-query"
            className="min-w-0 flex-1 resize-y rounded-[14px] border border-separator bg-bg px-3 py-2.5 text-base text-label focus:border-tint focus:outline-none focus:ring-[3px] focus:ring-tint-soft"
            rows={2}
            maxLength={QUERY_MAX_CHARS}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a question in Singlish, Sinhala or English"
          />
        </div>
        <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
          <ScopePicker value={scope} onChange={setScope} />
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cn(ui.field, "mb-1.5 p-0")}>Methods to compare (up to {MAX_METHODS})</legend>
            <div className="flex flex-wrap gap-1.5">
              {METHOD_ORDER.map((m) => {
                const off = METHODS[m].semantic && !health.semanticReady;
                const on = methods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-separator bg-surface px-3 text-[0.82rem] text-label-2 aria-pressed:border-transparent aria-pressed:bg-tint-soft aria-pressed:font-semibold aria-pressed:text-tint disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="flex items-end gap-2.5">
            <label className={ui.field}>
              Top K
              <select className={cn(ui.input, "w-[76px]")} value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
                {[5, 10, 20].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={cn(ui.btn, ui.btnPrimary)} disabled={!canRun}>
              {loading ? "Running…" : "Run comparison"}
            </button>
          </div>
        </div>
      </form>

      {runs && first && (
        <p className="-mt-2 mb-0 flex items-center gap-2.5">
          <span className={pill()}>{first.scope.type === "video" ? `Video ${first.scope.video_id}` : "All videos"}</span>
          <span className={ui.caption}>
            {first.scope.documents_searched.toLocaleString()} comments searched
            {ranAt ? ` · ${ranAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
        </p>
      )}

      {runs && (
        <section aria-labelledby="mc-title" className={ui.card}>
          <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="mc-title" className={ui.sectionTitle}>
              Method comparison
            </h2>
            <span className={ui.caption}>Scores are only comparable within one method. Bars show each score relative to that method&apos;s top result.</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
            {summaries.map((s, i) => {
              const r = runs[i];
              return (
                <div key={s.method} className="grid content-start gap-3 rounded-[14px] border border-t-[3px] border-separator border-t-(--c) bg-bg p-4" style={{ "--c": colour(s.method) } as React.CSSProperties}>
                  <div className="grid">
                    <strong>{METHODS[s.method].short}</strong>
                    <span className={ui.caption}>{METHODS[s.method].label}</span>
                  </div>
                  {r.error ? (
                    <p className="m-0 text-[0.85rem] text-danger">{r.error}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 [&>div]:grid [&_b]:text-[1.4rem] [&_b]:font-bold [&_b]:tabular-nums">
                        <div>
                          <b>{s.retrieved}</b>
                          <span className={ui.caption}>Retrieved</span>
                        </div>
                        <div>
                          <b>{s.agreement === null ? "–" : `${Math.round(s.agreement * 100)}%`}</b>
                          <span className={ui.caption}>Shared with others</span>
                        </div>
                      </div>
                      <ol className="m-0 grid list-none gap-1.5 p-0 [&>li]:grid [&>li]:grid-cols-[26px_1fr_44px] [&>li]:items-center [&>li]:gap-2">
                        {s.top.map((t) => (
                          <li key={t.documentId}>
                            <span className={ui.caption}>#{t.rank}</span>
                            <span className="h-2 overflow-hidden rounded bg-fill [&>span]:block [&>span]:h-full [&>span]:rounded [&>span]:bg-(--c)" aria-hidden>
                              <span style={{ width: `${Math.max(4, t.relative * 100)}%` }} />
                            </span>
                            <span className="text-right text-[0.78rem] tabular-nums text-label-2">{t.score.toFixed(s.method.startsWith("multiview") ? 4 : 2)}</span>
                          </li>
                        ))}
                        {s.top.length === 0 && <li className={ui.caption}>No matches</li>}
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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <section aria-labelledby="cand-title" className={ui.card}>
            <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 id="cand-title" className={ui.sectionTitle}>
                Retrieved candidates
              </h2>
              <span className={ui.caption}>
                {candidates.length} unique comments, ordered by how many methods found them
              </span>
            </div>
            {candidates.length === 0 ? (
              <p className={ui.muted}>No method retrieved any comments. Try rephrasing or a meaning-based method.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full border-collapse text-[0.86rem] [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-separator [&_th]:p-2 [&_th]:text-left [&_th]:text-[0.74rem] [&_th]:font-semibold [&_th]:text-label-3 [&_td]:border-b [&_td]:border-separator [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_tr:last-child_td]:border-b-0">
                  <thead>
                    <tr>
                      <th scope="col">Comment</th>
                      {okRuns.map((r) => (
                        <th key={r.method} scope="col" className="whitespace-nowrap text-center! tabular-nums" title={METHODS[r.method].label}>
                          <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: colour(r.method) }} />
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
                        <tr key={c.comment.document_id} aria-selected={isSel} className={isSel ? "[&>td]:bg-tint-soft" : undefined}>
                          <td>
                            <button type="button" className="block w-full min-w-[220px] cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-left text-label hover:bg-fill" onClick={() => setSelected(c.comment.document_id)}>
                              <span lang="si">{c.comment.text.length > 110 ? `${c.comment.text.slice(0, 110)}…` : c.comment.text}</span>
                            </button>
                          </td>
                          {okRuns.map((r) => (
                            <td key={r.method} className="whitespace-nowrap text-center! tabular-nums">
                              {c.ranks[r.method] ? `#${c.ranks[r.method]}` : <span className={ui.caption}>–</span>}
                            </td>
                          ))}
                          <td>
                            <span className={pill(c.foundBy === okRuns.length && okRuns.length > 1 ? "tint" : "neutral")}>
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

          <div className="grid gap-5">
            <section aria-labelledby="chart-title" className={ui.card}>
              <h2 id="chart-title" className={ui.sectionTitle}>
                Relative score by rank
              </h2>
              <ScoreChart
                series={summaries
                  .filter((s) => s.top.length)
                  .map((s) => ({ name: METHODS[s.method].short, color: colour(s.method), values: s.top.map((t) => t.relative) }))}
              />
            </section>

            {selectedCandidate && (
              <section aria-labelledby="sel-title" className={cn(ui.card, "grid gap-2.5 [&>p]:m-0 [&>p]:leading-[1.55] [&>p]:wrap-anywhere")}>
                <h2 id="sel-title" className={ui.sectionTitle}>
                  Selected comment
                </h2>
                <p lang="si">{selectedCandidate.comment.text}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.comment.likes !== null && (
                    <span className={pill()}>
                      <Icon name="heart" size={13} /> {selectedCandidate.comment.likes}
                    </span>
                  )}
                  {Object.entries(selectedCandidate.ranks).map(([m, rank]) => (
                    <span key={m} className={pill()}>
                      {METHODS[m as RetrievalMethod].short} #{rank}
                    </span>
                  ))}
                </div>
                {selectedCandidate.comment.video_url && (
                  <a className={cn(ui.btn, ui.btnPlain)} href={selectedCandidate.comment.video_url} target="_blank" rel="noopener noreferrer">
                    Open video <code>{selectedCandidate.comment.video_id}</code>
                    <Icon name="external" size={14} />
                  </a>
                )}
              </section>
            )}

            <section className={cn(ui.card, "[&>p]:mt-1.5 [&>p]:mb-0")}>
              <h2 className={ui.sectionTitle}>Reading these results</h2>
              <p className={ui.caption}>
                &ldquo;Shared with others&rdquo; measures agreement between methods, not correctness. Relevance can only be
                measured against human-labelled judgements, which are being collected for the evaluation study. Experimental
                methods are not yet validated.
              </p>
            </section>
          </div>
        </div>
      )}

      {!runs && !loading && (
        <div className={cn(ui.card, "grid justify-items-center gap-2 px-5 py-10 text-center text-label-3")}>
          <Icon name="chart" size={28} />
          <p className={ui.muted}>Enter a question, choose up to four methods and run the comparison.</p>
        </div>
      )}
    </div>
  );
}
