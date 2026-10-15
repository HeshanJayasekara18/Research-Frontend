"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { Icon } from "@/components/shell/Icon";
import { cn, pill } from "@/components/ui/styles";

import { V2_IS_SYNTHETIC } from "../../lib/demoVideos";
import { METHODS } from "../../lib/methods";
import { BOT_NAME } from "../BotOrb";
import { EvidenceCard } from "../EvidenceCard";
import type { AiNote, Turn } from "./model";

const META = "text-[0.76rem] text-label-3";

const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } } as const;

export function UserMessage({ turn }: { turn: Turn }) {
  const s = turn.scope;
  const where = s.videoId ? `video ${s.videoId}` : s.domain ? `${s.domain} domain` : "all videos";
  return (
    <motion.div {...enter} className="flex flex-col items-end gap-1">
      <p className="m-0 max-w-[min(85%,640px)] whitespace-pre-wrap rounded-[18px] rounded-br-md bg-tint px-4 py-2.5 text-[0.95rem] leading-relaxed text-white wrap-anywhere" lang="si">
        {turn.query}
      </p>
      <span className={META}>
        Corpus {s.corpus.toUpperCase()} · {where} · {METHODS[turn.method].short}
      </span>
    </motion.div>
  );
}

const NOTE: Record<AiNote, string> = {
  llm_disabled: "AI answering is not available yet (no language model is configured on the server). Here are the retrieved comments.",
  no_video: "AI answers need a single video selected. Here are the retrieved comments.",
  no_results: "",
  insufficient_evidence: "Not enough evidence in these comments to write an answer, so none was generated. Here are the retrieved comments.",
  ask_failed: "The AI answer could not be generated. Here are the retrieved comments.",
};

export function AssistantMessage({ turn, onRetry }: { turn: Turn; onRetry: (id: string) => void }) {
  const r = turn.retrieval;
  const synthetic = turn.scope.corpus === "v2" && V2_IS_SYNTHETIC;
  const maxScore = r?.results.reduce((m, c) => Math.max(m, c.score), 0) ?? 0;
  const compareHref = `/knowledge-assistant/evidence?${new URLSearchParams({
    q: turn.query,
    // The Evidence & Analysis page searches Corpus V1 only.
    ...(turn.scope.corpus === "v1" && turn.scope.videoId ? { video: turn.scope.videoId } : {}),
  }).toString()}`;

  return (
    <motion.div {...enter} className="flex gap-3">
      <span className="mt-0.5 grid size-7 flex-none place-items-center rounded-full bg-tint-soft text-tint" aria-hidden>
        <Icon name="sparkle" size={15} />
      </span>
      <div className="grid min-w-0 flex-1 gap-3">
        <span className="text-[0.82rem] font-semibold text-label-2">{BOT_NAME}</span>

        {/* ---- loading ---- */}
        {turn.status === "submitting" && !r && (
          <p className="m-0 flex items-center gap-2 text-label-2">
            <Dots /> Searching comments…
          </p>
        )}

        {/* ---- error (question is kept; retry) ---- */}
        {turn.status === "error" && turn.error && (
          <div className="grid gap-2 rounded-2xl border border-danger/35 bg-danger/8 px-4 py-3" role="alert">
            <p className="m-0 font-medium">
              {turn.error.code === "network_error" || turn.error.status >= 502
                ? "Couldn't reach the assistant service."
                : "This search couldn't be completed."}
            </p>
            <p className="m-0 text-[0.86rem] text-label-2">{turn.error.message}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onRetry(turn.id)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-separator bg-surface px-3 text-[0.82rem] font-medium hover:bg-fill"
              >
                Retry
              </button>
              <span className={META}>
                {turn.error.code}
                {turn.error.requestId ? ` · ref ${turn.error.requestId}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* ---- real generated answer ---- */}
        {turn.status === "answered" && turn.answer?.answer && (
          <div className="grid gap-3">
            <p className="m-0 whitespace-pre-line text-[0.97rem] leading-relaxed" lang="si">
              {turn.answer.answer}
            </p>
            {turn.answer.citations.length > 0 && (
              <div className="grid gap-1.5">
                <span className="text-[0.74rem] font-semibold uppercase tracking-[0.04em] text-label-3">Cited evidence</span>
                <ol className="m-0 grid list-none gap-1.5 p-0">
                  {turn.answer.citations.map((c) => (
                    <li key={c.label} className="rounded-xl border border-separator bg-surface px-3 py-2 text-[0.86rem]">
                      <strong className="text-tint">[{c.label}]</strong> <span lang="si">{c.comment_text}</span>
                      <span className={cn(META, "block")}>
                        rank {c.retrieval_rank} · video {c.video_id}
                        {c.matched_terms.length ? ` · matched: ${c.matched_terms.join(", ")}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <span className={META}>
              Generated by {turn.answer.generation.provider} · {turn.answer.generation.model}. Check it against the cited comments.
            </span>
          </div>
        )}

        {/* ---- no generated answer: say why ---- */}
        {turn.status === "retrieval_only" && turn.aiNote && turn.aiNote !== "no_results" && (
          <p className="m-0 text-label-2">
            {NOTE[turn.aiNote]}
            {turn.aiNoteDetail && <span className={cn(META, "block")}>{turn.aiNoteDetail}</span>}
          </p>
        )}
        {turn.status === "submitting" && r && (
          <p className="m-0 flex items-center gap-2 text-label-2">
            <Dots /> Writing an answer from these comments…
          </p>
        )}

        {/* ---- no match ---- */}
        {turn.aiNote === "no_results" && (
          <div className="grid gap-1 rounded-2xl border border-dashed border-separator px-4 py-3">
            <p className="m-0 font-medium">No matching comments were retrieved for this query.</p>
            <p className="m-0 text-[0.86rem] text-label-2">
              That doesn&apos;t mean nobody talked about it. Try rephrasing, choosing another video, or switching the retrieval method.
            </p>
          </div>
        )}

        {/* ---- retrieved comments ---- */}
        {r && r.results.length > 0 && (
          <details className="group rounded-2xl border border-separator bg-surface px-4 py-2" open={turn.status !== "answered"}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 py-1.5 [&::-webkit-details-marker]:hidden">
              <span className="text-[0.88rem] font-semibold">
                {turn.status === "answered" ? "All retrieved candidates" : "Retrieved comments"} ({r.result_count})
              </span>
              <span className={META}>
                of {r.scope.documents_searched.toLocaleString()} searched · {METHODS[r.method].short}
              </span>
              {synthetic && <span className={pill("warn")}>Synthetic test data</span>}
              <span className="ml-auto text-label-3 transition-transform group-open:rotate-90" aria-hidden>
                <Icon name="arrow" size={14} />
              </span>
            </summary>
            {r.normalization?.used && (
              <p className={cn(META, "m-0 mb-1")}>
                Singlish → Sinhala ({r.normalization.status}): <span lang="si">“{r.normalization.normalized_query}”</span>
              </p>
            )}
            <ol className="m-0 list-none p-0">
              {r.results.map((c) => (
                <EvidenceCard key={c.document_id} comment={c} maxScore={maxScore} synthetic={synthetic} />
              ))}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator py-2">
              <span className={META}>{r.notice}</span>
              <Link href={compareHref} className="text-[0.8rem] font-medium text-tint no-underline">
                Compare methods →
              </Link>
            </div>
          </details>
        )}
      </div>
    </motion.div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-pulse rounded-full bg-tint" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}
