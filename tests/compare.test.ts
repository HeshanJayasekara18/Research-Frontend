import { describe, expect, it } from "vitest";

import type { RetrievedComment, RetrieveResponse } from "@/features/knowledge-assistant/api/types";
import { poolCandidates, summarize, type MethodRun } from "@/features/knowledge-assistant/lib/compare";

const c = (id: string, rank: number, score: number): RetrievedComment => ({
  rank, document_id: id, video_id: "v", text: id, likes: 0, video_url: null, score, score_type: "bm25", views: null,
});
const resp = (results: RetrievedComment[]) => ({ results } as unknown as RetrieveResponse);

const runs: MethodRun[] = [
  { method: "bm25", response: resp([c("A", 1, 10), c("B", 2, 5)]) },
  { method: "labse", response: resp([c("B", 1, 0.9), c("C", 2, 0.45)]) },
  { method: "multiview_hybrid", error: "unavailable" },
];

describe("poolCandidates", () => {
  it("dedupes by document and orders by methods-found, then mean rank", () => {
    const pooled = poolCandidates(runs);
    expect(pooled.map((p) => p.comment.document_id)).toEqual(["B", "A", "C"]);
    expect(pooled[0].ranks).toEqual({ bm25: 2, labse: 1 });
    expect(pooled[0].foundBy).toBe(2);
  });
});

describe("summarize", () => {
  it("computes agreement and per-method relative scores; failed runs are empty", () => {
    const [bm25, labse, failed] = summarize(runs);
    expect(bm25.agreement).toBe(0.5);
    expect(labse.agreement).toBe(0.5);
    expect(bm25.top.map((t) => t.relative)).toEqual([1, 0.5]);
    expect(failed).toMatchObject({ retrieved: 0, agreement: null, top: [] });
  });

  it("has no agreement value with a single successful method", () => {
    expect(summarize([runs[0]])[0].agreement).toBeNull();
  });
});
