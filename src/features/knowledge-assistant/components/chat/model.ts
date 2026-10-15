import type { KnowledgeAssistantError } from "../../api/client";
import type { AskResponse, CorpusId, Domain, RetrievalMethod, RetrieveResponse } from "../../api/types";

/** Scope captured at send time, so later control changes never alter earlier turns. */
export interface TurnScope {
  corpus: CorpusId;
  domain: Domain | null;
  videoId: string | null;
}

/**
 * One question + the backend's response.
 *  - submitting:      request in flight
 *  - answered:        real /v1/ask answer (with citations) + retrieved comments
 *  - retrieval_only:  retrieved comments, no generated answer (see `aiNote`)
 *  - error:           request failed; the question is kept and can be retried
 */
export type TurnStatus = "submitting" | "answered" | "retrieval_only" | "error";

/** Why a retrieval-only turn has no AI answer (always stated to the user). */
export type AiNote = "llm_disabled" | "no_video" | "no_results" | "insufficient_evidence" | "ask_failed";

export interface Turn {
  id: string;
  query: string;
  scope: TurnScope;
  method: RetrievalMethod;
  status: TurnStatus;
  retrieval?: RetrieveResponse;
  answer?: AskResponse;
  aiNote?: AiNote;
  aiNoteDetail?: string;
  error?: KnowledgeAssistantError;
}

let seq = 0;
export const newTurnId = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;
