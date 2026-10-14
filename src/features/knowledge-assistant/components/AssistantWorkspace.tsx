"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/shell/Icon";
import { cn, pill, ui } from "@/components/ui/styles";

import { KnowledgeAssistantError, retrieveComments } from "../api/client";
import { QUERY_MAX_CHARS, type RetrievalMethod, type RetrieveResponse } from "../api/types";
import { useHealth } from "../hooks/useHealth";
import { timeAgo, useRecentSearches, type RecentSearch } from "../hooks/useRecentSearches";
import { defaultMethod, METHOD_ORDER, METHODS } from "../lib/methods";
import { BOT_NAME, BotOrb } from "./BotOrb";
import { EvidenceCard } from "./EvidenceCard";
import { extractVideoId, scopeError, type Scope } from "./ScopePicker";
import { ServiceStatus } from "./ServiceStatus";

// ---- Tailwind class groups for the dark assistant stage ----
// The stage is a size container (@container), so `cqi` units and @max-[…] / @min-[…]
// variants respond to the space the stage actually has, with or without the sidebar.
const STAGE =
  "@container relative mx-auto flex min-h-[calc(100dvh-56px)] w-full flex-col items-center gap-(--gap) overflow-hidden " +
  "rounded-[clamp(18px,2.4cqi,32px)] text-label max-md:min-h-[calc(100dvh-124px)] max-md:rounded-[22px] " +
  "px-[clamp(12px,4cqi,64px)] pb-[clamp(28px,4cqi,56px)] pt-[clamp(14px,2cqi,28px)] " +
  "[--col:clamp(280px,62cqi,860px)] [--gap:clamp(16px,2.2cqi,30px)] [--orb:clamp(112px,15cqi,220px)] " +
  "[@media(max-height:760px)]:[--gap:clamp(12px,1.6cqi,20px)] [@media(max-height:760px)]:[--orb:clamp(88px,11cqi,140px)] " +
  "[@media(max-height:520px)]:[--orb:72px] " +
  "bg-transparent";

/** Before the first search the status pill floats in the corner so the welcome content can centre. */
const TOPBAR_FLOATING =
  "absolute inset-x-[clamp(12px,3cqi,40px)] top-[clamp(12px,2cqi,24px)] [@media(max-height:520px)]:static [@media(max-height:520px)]:w-full";

/** Centred column shared by the composer, suggestions, recent list and errors. */
const COLUMN = "w-[min(100%,var(--col))] @max-[900px]:w-full @min-[1600px]:w-[min(100%,1040px)]";

const TOOL =
  "inline-flex min-h-[34px] min-w-0 items-center gap-1.5 rounded-full border border-separator bg-surface px-3 text-[0.82rem] text-label-2 " +
  "hover:border-tint/40 hover:text-label focus-within:border-tint/40 focus-within:text-label @min-[1600px]:min-h-10 @min-[1600px]:text-[0.95rem]";

const TOOL_INPUT = "w-full min-w-0 border-0 bg-transparent text-[0.82rem] text-label outline-none @min-[1600px]:text-[0.95rem]";

const GHOST_BTN =
  "inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-separator bg-surface px-3.5 " +
  "text-[0.85rem] text-label no-underline hover:bg-fill";

const PANEL = "w-full min-w-0 rounded-[20px] border border-separator bg-surface shadow-soft p-[clamp(14px,2cqi,24px)] backdrop-blur-md";

const META = "text-[0.78rem] text-label-3 wrap-anywhere";

interface Suggestion {
  icon: IconName;
  title: string;
  text: string;
  query: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: "chat",
    title: "What do viewers ask?",
    text: "Find the questions your audience keeps asking.",
    query: "Viewers la ahana prashna monawada?",
  },
  {
    icon: "heart",
    title: "What do they love?",
    text: "See what people praise in the comments.",
    query: "Viewers la kamathi monawa gena da?",
  },
  {
    icon: "sparkle",
    title: "Content ideas",
    text: "Spot topics viewers want you to cover next.",
    query: "Ilanga video eka monawa gena karanna kiyala viewers la kiyanne?",
  },
];

export function AssistantWorkspace() {
  const health = useHealth();
  const recent = useRecentSearches();
  const ids = useId();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>({ mode: "video", videoId: "" });
  const [method, setMethod] = useState<RetrievalMethod>("bm25");
  const methodTouched = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<KnowledgeAssistantError | null>(null);
  const [response, setResponse] = useState<RetrieveResponse | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Pick the default method once we know whether meaning search is available.
  useEffect(() => {
    if (!methodTouched.current && health.health) setMethod(defaultMethod(health.semanticReady));
  }, [health.health, health.semanticReady]);

  const scopeErr = scopeError(scope);
  const showScopeErr = scope.mode === "video" && scope.videoId.trim() !== "" && scopeErr;
  const canSend = query.trim().length > 0 && !scopeErr && !loading;
  const sendHint = !query.trim() ? "Type a question" : scopeErr ? "Add a video ID or link, or choose All videos" : undefined;

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

  function applySuggestion(s: Suggestion) {
    setQuery(s.query);
    inputRef.current?.focus();
  }

  function reopen(r: RecentSearch) {
    const s: Scope = r.videoId ? { mode: "video", videoId: r.videoId } : { mode: "all", videoId: "" };
    methodTouched.current = true;
    setQuery(r.query);
    setScope(s);
    setMethod(r.method);
    void run(r.query, s, r.method);
  }

  function reset() {
    inflight.current?.abort();
    setQuery("");
    setResponse(null);
    setError(null);
    setLoading(false);
    inputRef.current?.focus();
  }

  const compareHref = response
    ? `/knowledge-assistant/evidence?${new URLSearchParams({
        q: response.query,
        ...(response.scope.video_id ? { video: response.scope.video_id } : {}),
      }).toString()}`
    : "/knowledge-assistant/evidence";

  const maxScore = response?.results.reduce((m, r) => Math.max(m, r.score), 0) ?? 0;
  const started = Boolean(response || loading || error);

  return (
    <div className={cn(STAGE, started ? "[--orb:clamp(56px,6cqi,80px)] [@media(max-height:760px)]:[--orb:52px]" : "justify-center")}>
      <div className={cn("flex items-center justify-between gap-2", started ? "w-full" : TOPBAR_FLOATING)}>
        {started ? (
          <button type="button" className={GHOST_BTN} onClick={reset}>
            + New search
          </button>
        ) : (
          <span />
        )}
        <ServiceStatus state={health} />
      </div>

      <header className="flex max-w-(--col) flex-col items-center text-center @max-[900px]:max-w-full">
        <div className={cn("size-(--orb) transition-[width,height] duration-300", !started && "mb-[clamp(14px,2cqi,26px)]")}>
          <BotOrb size="100%" thinking={loading} priority />
        </div>
        {!started && (
          <>
            <p className="m-0 text-[clamp(1.35rem,2.6cqi,2.4rem)] font-semibold tracking-[-0.02em] text-label-3">
              Hi, I&apos;m {BOT_NAME}
            </p>
            <h1 className="text-balance text-[clamp(1.6rem,3.6cqi,3.2rem)] font-bold leading-[1.12] tracking-[-0.025em]">
              How can I help today?
            </h1>
            <p className="mt-3 max-w-[46ch] text-pretty text-[clamp(0.85rem,1.1cqi,1rem)] text-label-3 [@media(max-height:520px)]:hidden [@media(max-height:760px)]:mt-1.5">
              Ask about your audience in Singlish, Sinhala or English. I&apos;ll find what your viewers actually said.
            </p>
          </>
        )}
      </header>

      <form
        className={cn(
          COLUMN,
          "glow-border rounded-[22px] border border-tint/30 bg-tint-soft p-1",
          "shadow-soft",
        )}
        onSubmit={onSubmit}
        aria-busy={loading}
      >
        <div className="flex items-center gap-2 px-3 pb-2 pt-1.5 text-[0.8rem] text-label-2 @max-[640px]:text-[0.75rem] @min-[1600px]:text-[0.95rem]">
          <Icon name="sparkle" size={14} />
          Searches your YouTube comments. Written answers are coming soon.
        </div>
        <div className="rounded-[18px] border border-separator bg-surface px-3.5 pb-2.5 pt-3.5 @max-[300px]:px-2.5">
          <label htmlFor={`${ids}-q`} className="sr-only">
            Your question
          </label>
          <textarea
            id={`${ids}-q`}
            ref={inputRef}
            className={
              // text-base (16px) stops iOS from zooming into the field.
              "block max-h-[40dvh] min-h-[52px] w-full resize-y border-0 bg-transparent px-1 pb-2.5 pt-1 text-base leading-normal text-label " +
              "placeholder:text-label-3 focus:outline-none @min-[1600px]:text-[1.15rem]"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) onSubmit(e);
            }}
            maxLength={QUERY_MAX_CHARS}
            rows={2}
            placeholder="Ask me anything about your viewers…"
          />

          <div className="flex items-end justify-between gap-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                className={cn(TOOL, "flex-none cursor-pointer whitespace-nowrap @max-[640px]:order-1")}
                aria-pressed={scope.mode === "all"}
                onClick={() => setScope({ ...scope, mode: scope.mode === "video" ? "all" : "video" })}
                title="Switch between one video and all videos"
              >
                <Icon name={scope.mode === "video" ? "video" : "globe"} size={15} />
                {scope.mode === "video" ? "One video" : "All videos"}
              </button>

              {scope.mode === "video" && (
                // On phones the video field takes its own row; method + send share the next.
                <span className={cn(TOOL, "max-w-[260px] flex-[1_1_150px] @max-[640px]:order-2 @max-[640px]:max-w-none @max-[640px]:basis-full")}>
                  <label htmlFor={`${ids}-v`} className="sr-only">
                    Video ID or YouTube link
                  </label>
                  <input
                    id={`${ids}-v`}
                    className={cn(TOOL_INPUT, "aria-[invalid=true]:text-danger")}
                    value={scope.videoId}
                    onChange={(e) => setScope({ ...scope, videoId: e.target.value })}
                    placeholder="Video ID or link"
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={Boolean(showScopeErr)}
                  />
                </span>
              )}

              <span className={cn(TOOL, "@max-[640px]:order-3 @max-[640px]:flex-auto")}>
                <Icon name="chart" size={15} />
                <label htmlFor={`${ids}-m`} className="sr-only">
                  Retrieval method
                </label>
                <select
                  id={`${ids}-m`}
                  className={cn(TOOL_INPUT, "[&_option]:bg-surface [&_option]:text-label")}
                  value={method}
                  onChange={(e) => {
                    methodTouched.current = true;
                    setMethod(e.target.value as RetrievalMethod);
                  }}
                  title={METHODS[method].description}
                >
                  {METHOD_ORDER.map((m) => {
                    const off = METHODS[m].semantic && !health.semanticReady;
                    return (
                      <option key={m} value={m} disabled={off}>
                        {METHODS[m].short}
                        {METHODS[m].experimental ? " (exp.)" : ""}
                        {off ? " (unavailable)" : ""}
                      </option>
                    );
                  })}
                </select>
              </span>
            </div>

            <button
              className={
                "grid size-10 flex-none -rotate-90 cursor-pointer place-items-center rounded-full border-0 bg-linear-to-br from-[#38bdf8] to-[#2563eb] text-white " +
                "shadow-[0_6px_18px_rgba(56,189,248,0.35)] transition active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none " +
                "@min-[1600px]:size-[46px]"
              }
              type="submit"
              disabled={!canSend}
              aria-label={loading ? "Searching" : "Send"}
              title={sendHint}
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden />
              ) : (
                <Icon name="arrow" size={18} />
              )}
            </button>
          </div>
        </div>
        {showScopeErr && <p className="mx-3 mb-1 mt-2 text-[0.8rem] text-danger">{scopeErr}</p>}
      </form>

      {!started && (
        <>
          <ul className={cn(COLUMN, "m-0 grid list-none grid-cols-3 gap-3 p-0 @max-[640px]:grid-cols-1 @max-[640px]:gap-2")}>
            {SUGGESTIONS.map((s) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className={
                    "grid size-full cursor-pointer content-start gap-1.5 rounded-2xl border border-separator bg-surface px-4 py-3.5 text-left text-label " +
                    "transition hover:-translate-y-px hover:border-tint/40 hover:bg-fill @max-[640px]:px-3.5 @max-[640px]:py-3"
                  }
                >
                  <span className="inline-flex items-center gap-2 text-[0.92rem] font-semibold @min-[1600px]:text-[1.05rem]">
                    <Icon name={s.icon} size={16} /> {s.title}
                  </span>
                  <span className="text-[0.8rem] text-label-3 @max-[300px]:hidden @min-[1600px]:text-[0.95rem]">{s.text}</span>
                </button>
              </li>
            ))}
          </ul>

          {recent.items.length > 0 && (
            <section className={COLUMN} aria-labelledby={`${ids}-recent`}>
              <div className="mb-1.5 flex items-center justify-between">
                <h2 id={`${ids}-recent`} className="text-[0.74rem] font-semibold uppercase tracking-[0.04em] text-label-3">
                  Recent
                </h2>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-[0.8rem] text-label-3 hover:text-label"
                  onClick={recent.clear}
                >
                  Clear
                </button>
              </div>
              <ul className="m-0 grid list-none gap-0.5 p-0">
                {recent.items.slice(0, 6).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => reopen(r)}
                      title={r.query}
                      className={
                        "grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-2.5 py-2 " +
                        "text-left text-label-3 hover:bg-fill @max-[640px]:grid-cols-[auto_minmax(0,1fr)]"
                      }
                    >
                      <Icon name="clock" size={14} />
                      <span className="truncate text-[0.88rem] text-label">{r.query}</span>
                      <span className="whitespace-nowrap text-[0.75rem] @max-[640px]:col-start-2">
                        {r.videoId ?? "All videos"} · {timeAgo(r.at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {error && (
        <div className={cn(COLUMN, "grid gap-1 rounded-2xl border border-danger/40 bg-danger/8 px-4 py-3.5 wrap-anywhere")} role="alert">
          <strong>{error.message}</strong>
          <span className="text-[0.78rem] text-label-3">
            {error.code}
            {error.requestId ? ` · ref ${error.requestId}` : ""}
          </span>
        </div>
      )}

      {loading && !response && <ResultsSkeleton />}

      {response && (
        <section
          ref={resultsRef}
          tabIndex={-1}
          className="grid w-[min(100%,clamp(280px,72cqi,1000px))] gap-4 outline-none @max-[900px]:w-full"
          aria-label="Results"
        >
          <article className={PANEL}>
            <div className="mb-2.5 flex flex-wrap items-center gap-3">
              <BotOrb size={36} />
              <div className="grid min-w-40 flex-1">
                <h2 className="text-[1.02rem] font-semibold">{BOT_NAME}&apos;s answer</h2>
                <span className={META}>Generated answers are the next milestone</span>
              </div>
              <span className={pill("warn")}>Coming soon</span>
            </div>
            <p className="m-0 text-label-2">
              For now I show the comments that best match your question, so you can read what viewers said yourself.
              Written answers, grounded in these comments and checked against them, will appear here.
            </p>
          </article>

          <article className={PANEL}>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <div className="grid min-w-0">
                <h2 className="text-[1.02rem] font-semibold">Supporting comments</h2>
                <span className={META}>
                  {response.result_count} of {response.scope.documents_searched.toLocaleString()} comments ·{" "}
                  {response.scope.type === "video" ? `video ${response.scope.video_id}` : "all videos"} ·{" "}
                  {METHODS[response.method].short}
                </span>
              </div>
              <Link href={compareHref} className={GHOST_BTN}>
                Compare methods <Icon name="arrow" size={15} />
              </Link>
            </div>

            {response.normalization && (
              <p className="mb-2 mt-1 flex flex-wrap items-center gap-2.5 wrap-anywhere">
                <span className={pill()}>Singlish → Sinhala: {response.normalization.status}</span>
                {response.normalization.used ? (
                  <span lang="si">“{response.normalization.normalized_query}”</span>
                ) : (
                  <span className={META}>Normalised form not used</span>
                )}
              </p>
            )}

            {response.results.length === 0 ? (
              <div className="grid gap-1 rounded-[14px] border border-dashed border-separator p-5">
                <strong>No matching comments found.</strong>
                <span className="text-label-2">
                  That doesn&apos;t mean nobody talked about it. Try rephrasing, or switch to a meaning-based method.
                </span>
              </div>
            ) : (
              <ol className="m-0 list-none p-0">
                {response.results.map((c) => (
                  <EvidenceCard key={c.document_id} comment={c} maxScore={maxScore} />
                ))}
              </ol>
            )}
            <p className="mb-0 mt-3 flex items-start gap-2 border-t border-separator pt-3 text-[0.8rem] text-label-3">
              <Icon name="info" size={15} /> {response.notice}
            </p>
          </article>
        </section>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className={PANEL} aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-2 py-3">
          <div className={cn(ui.skeleton, "h-3.5 w-[85%]")} />
          <div className={cn(ui.skeleton, "h-3.5 w-[60%]")} />
        </div>
      ))}
    </div>
  );
}
