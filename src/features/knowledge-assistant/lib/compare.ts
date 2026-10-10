import type { RetrievalMethod, RetrievedComment, RetrieveResponse } from "../api/types";

export interface MethodRun {
  method: RetrievalMethod;
  response?: RetrieveResponse;
  error?: string;
}

export interface Candidate {
  comment: RetrievedComment;
  /** method -> 1-based rank within that method's list */
  ranks: Partial<Record<RetrievalMethod, number>>;
  foundBy: number;
  bestRank: number;
  meanRank: number;
}

export interface MethodSummary {
  method: RetrievalMethod;
  retrieved: number;
  /** Share of this method's results also returned by at least one other method (0..1). */
  agreement: number | null;
  /** Top results with score normalised to this method's best score (0..1). */
  top: { documentId: string; rank: number; score: number; relative: number }[];
}

/**
 * Pool all methods' results by document ID. Ordering is a display aid (found by more
 * methods first, then better average rank), not a new retrieval model and not a
 * relevance judgement.
 */
export function poolCandidates(runs: MethodRun[]): Candidate[] {
  const pool = new Map<string, Candidate>();
  for (const run of runs) {
    for (const c of run.response?.results ?? []) {
      const entry = pool.get(c.document_id) ?? { comment: c, ranks: {}, foundBy: 0, bestRank: Infinity, meanRank: 0 };
      entry.ranks[run.method] = c.rank;
      pool.set(c.document_id, entry);
    }
  }
  const out = [...pool.values()].map((e) => {
    const ranks = Object.values(e.ranks) as number[];
    return { ...e, foundBy: ranks.length, bestRank: Math.min(...ranks), meanRank: ranks.reduce((a, b) => a + b, 0) / ranks.length };
  });
  return out.sort(
    (a, b) => b.foundBy - a.foundBy || a.meanRank - b.meanRank || a.bestRank - b.bestRank || a.comment.document_id.localeCompare(b.comment.document_id),
  );
}

export function summarize(runs: MethodRun[], topN = 5): MethodSummary[] {
  const ok = runs.filter((r) => r.response);
  return runs.map((run) => {
    const results = run.response?.results ?? [];
    const others = new Set(
      ok.filter((o) => o.method !== run.method).flatMap((o) => o.response!.results.map((c) => c.document_id)),
    );
    const max = results.reduce((m, c) => Math.max(m, c.score), 0);
    return {
      method: run.method,
      retrieved: results.length,
      agreement: results.length && ok.length > 1 ? results.filter((c) => others.has(c.document_id)).length / results.length : null,
      top: results.slice(0, topN).map((c) => ({
        documentId: c.document_id,
        rank: c.rank,
        score: c.score,
        relative: max > 0 ? c.score / max : 0,
      })),
    };
  });
}
