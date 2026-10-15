"use client";

import { useCallback, useRef, useState } from "react";

import { askYoubeyo, KnowledgeAssistantError, retrieveComments } from "../../api/client";
import type { RetrievalMethod } from "../../api/types";
import { newTurnId, type Turn, type TurnScope } from "./model";

const asError = (err: unknown) =>
  err instanceof KnowledgeAssistantError ? err : new KnowledgeAssistantError(0, "unknown_error", "Something went wrong.");

/**
 * Conversation state. Each turn calls the existing proxy routes:
 *   1. POST /api/knowledge-assistant/retrieve   (always)
 *   2. POST /api/knowledge-assistant/ask        (only if an LLM is enabled AND one video is selected AND step 1 found comments)
 * Nothing is generated client-side: without a real /v1/ask answer the turn is "retrieval_only".
 */
export function useChat({ llmEnabled, onSearched }: { llmEnabled: boolean; onSearched?: (t: Turn) => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const inflight = useRef<AbortController | null>(null);

  const patch = useCallback((id: string, p: Partial<Turn>) => {
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));
  }, []);

  const execute = useCallback(
    async (turn: Turn) => {
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const { scope, method, query } = turn;

      let retrieval;
      try {
        retrieval = await retrieveComments(
          { query, method, top_k: 10, scope: { corpus: scope.corpus, domain: scope.domain, video_id: scope.videoId } },
          ctrl.signal,
        );
      } catch (err) {
        if (ctrl.signal.aborted) return;
        patch(turn.id, { status: "error", error: asError(err) });
        return;
      }
      onSearched?.(turn);

      if (retrieval.results.length === 0) return patch(turn.id, { status: "retrieval_only", retrieval, aiNote: "no_results" });
      if (!llmEnabled) return patch(turn.id, { status: "retrieval_only", retrieval, aiNote: "llm_disabled" });
      if (!scope.videoId) return patch(turn.id, { status: "retrieval_only", retrieval, aiNote: "no_video" });

      // Show the retrieved comments while the answer is being generated.
      patch(turn.id, { retrieval });
      try {
        const answer = await askYoubeyo({ query, method, scope: { corpus: scope.corpus, video_id: scope.videoId } }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (answer.status === "answered" && answer.answer) patch(turn.id, { status: "answered", answer });
        else patch(turn.id, { status: "retrieval_only", answer, aiNote: "insufficient_evidence" });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        patch(turn.id, { status: "retrieval_only", aiNote: "ask_failed", aiNoteDetail: asError(err).message });
      }
    },
    [llmEnabled, onSearched, patch],
  );

  const send = useCallback(
    (query: string, scope: TurnScope, method: RetrievalMethod) => {
      const turn: Turn = { id: newTurnId(), query: query.trim(), scope, method, status: "submitting" };
      setTurns((ts) => [...ts, turn]);
      void execute(turn);
      return turn.id;
    },
    [execute],
  );

  const retry = useCallback(
    (id: string) => {
      const t = turns.find((x) => x.id === id);
      if (!t) return;
      const fresh: Turn = { id: t.id, query: t.query, scope: t.scope, method: t.method, status: "submitting" };
      setTurns((ts) => ts.map((x) => (x.id === id ? fresh : x)));
      void execute(fresh);
    },
    [turns, execute],
  );

  const reset = useCallback(() => {
    inflight.current?.abort();
    setTurns([]);
  }, []);

  /** Restore a saved conversation (finished turns only). */
  const load = useCallback((saved: Turn[]) => {
    inflight.current?.abort();
    setTurns(saved);
  }, []);

  const busy = turns.some((t) => t.status === "submitting");
  return { turns, send, retry, reset, load, busy };
}
