import {
  QUERY_MAX_CHARS,
  RETRIEVAL_METHODS,
  TOP_K_MAX,
  TOP_K_MIN,
  type RetrievalMethod,
  type RetrieveRequest,
} from "./types";

export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export type ValidationResult =
  | { ok: true; value: Required<Omit<RetrieveRequest, "scope">> & { scope: { video_id: string | null } } }
  | { ok: false; message: string };

/**
 * Validate untrusted input and rebuild it from allowed fields only, so a client
 * can never smuggle extra fields (for example a creator ID) through to the backend.
 */
export function parseRetrieveInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) return { ok: false, message: "Body must be a JSON object." };
  const raw = input as Record<string, unknown>;

  const query = typeof raw.query === "string" ? raw.query.trim() : "";
  if (!query) return { ok: false, message: "Enter a question." };
  if (query.length > QUERY_MAX_CHARS) return { ok: false, message: `Question must be at most ${QUERY_MAX_CHARS} characters.` };

  const method = (raw.method ?? "bm25") as RetrievalMethod;
  if (!RETRIEVAL_METHODS.includes(method)) return { ok: false, message: "Unknown retrieval method." };

  const topK = raw.top_k ?? 10;
  if (typeof topK !== "number" || !Number.isInteger(topK) || topK < TOP_K_MIN || topK > TOP_K_MAX) {
    return { ok: false, message: `Results must be a whole number from ${TOP_K_MIN} to ${TOP_K_MAX}.` };
  }

  const scope = raw.scope as { video_id?: unknown } | undefined;
  const videoRaw = scope?.video_id;
  let videoId: string | null = null;
  if (videoRaw !== undefined && videoRaw !== null && videoRaw !== "") {
    if (typeof videoRaw !== "string" || !VIDEO_ID_RE.test(videoRaw.trim())) {
      return { ok: false, message: "Video ID may contain only letters, digits, '-' and '_'." };
    }
    videoId = videoRaw.trim();
  }

  return { ok: true, value: { query, method, top_k: topK, scope: { video_id: videoId } } };
}
