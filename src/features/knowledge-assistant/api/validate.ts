import {
  CORPORA,
  DOMAINS,
  QUERY_MAX_CHARS,
  RETRIEVAL_METHODS,
  TOP_K_MAX,
  TOP_K_MIN,
  type CorpusId,
  type Domain,
  type RetrievalMethod,
} from "./types";

export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export interface ValidScope {
  corpus: CorpusId;
  domain: Domain | null;
  video_id: string | null;
}

export interface ValidRetrieve {
  query: string;
  method: RetrievalMethod;
  top_k: number;
  scope: ValidScope;
}

export interface ValidAsk {
  query: string;
  method: RetrievalMethod;
  scope: { corpus: CorpusId; video_id: string };
}

export type ValidationResult = { ok: true; value: ValidRetrieve } | { ok: false; message: string };
export type AskValidationResult = { ok: true; value: ValidAsk } | { ok: false; message: string };

type Fail = { error: string };

function parseQuery(raw: Record<string, unknown>): string | Fail {
  const query = typeof raw.query === "string" ? raw.query.trim() : "";
  if (!query) return { error: "Enter a question." };
  if (query.length > QUERY_MAX_CHARS) return { error: `Question must be at most ${QUERY_MAX_CHARS} characters.` };
  return query;
}

function parseMethod(raw: Record<string, unknown>, fallback: RetrievalMethod): RetrievalMethod | Fail {
  const method = (raw.method ?? fallback) as RetrievalMethod;
  return RETRIEVAL_METHODS.includes(method) ? method : { error: "Unknown retrieval method." };
}

function parseScope(raw: Record<string, unknown>): ValidScope | Fail {
  const scope = (raw.scope ?? {}) as { corpus?: unknown; domain?: unknown; video_id?: unknown };
  const corpus = (scope.corpus ?? "v1") as CorpusId;
  if (!CORPORA.includes(corpus)) return { error: "Unknown corpus." };

  let domain: Domain | null = null;
  if (scope.domain !== undefined && scope.domain !== null && scope.domain !== "") {
    if (!DOMAINS.includes(scope.domain as Domain)) return { error: "Unknown domain." };
    domain = scope.domain as Domain;
  }

  let videoId: string | null = null;
  const v = scope.video_id;
  if (v !== undefined && v !== null && v !== "") {
    if (typeof v !== "string" || !VIDEO_ID_RE.test(v.trim())) {
      return { error: "Video ID may contain only letters, digits, '-' and '_'." };
    }
    videoId = v.trim();
  }
  return { corpus, domain, video_id: videoId };
}

/**
 * Validate untrusted input and rebuild it from allowed fields only, so a client
 * can never smuggle extra fields (for example a creator ID) through to the backend.
 */
export function parseRetrieveInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) return { ok: false, message: "Body must be a JSON object." };
  const raw = input as Record<string, unknown>;

  const query = parseQuery(raw);
  if (typeof query !== "string") return { ok: false, message: query.error };

  const method = parseMethod(raw, "bm25");
  if (typeof method !== "string") return { ok: false, message: method.error };

  const topK = raw.top_k ?? 10;
  if (typeof topK !== "number" || !Number.isInteger(topK) || topK < TOP_K_MIN || topK > TOP_K_MAX) {
    return { ok: false, message: `Results must be a whole number from ${TOP_K_MIN} to ${TOP_K_MAX}.` };
  }

  const scope = parseScope(raw);
  if ("error" in scope) return { ok: false, message: scope.error };

  return { ok: true, value: { query, method, top_k: topK, scope } };
}

/** /v1/ask input: a video is required (answers are grounded in one video's comments). */
export function parseAskInput(input: unknown): AskValidationResult {
  if (typeof input !== "object" || input === null) return { ok: false, message: "Body must be a JSON object." };
  const raw = input as Record<string, unknown>;

  const query = parseQuery(raw);
  if (typeof query !== "string") return { ok: false, message: query.error };

  const method = parseMethod(raw, "multiview_bm25");
  if (typeof method !== "string") return { ok: false, message: method.error };

  const scope = parseScope(raw);
  if ("error" in scope) return { ok: false, message: scope.error };
  if (!scope.video_id) return { ok: false, message: "Choose a video: answers are grounded in one video's comments." };

  return { ok: true, value: { query, method, scope: { corpus: scope.corpus, video_id: scope.video_id } } };
}
