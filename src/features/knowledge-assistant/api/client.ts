import type { ApiErrorBody, AskRequest, AskResponse, HealthResponse, RetrieveRequest, RetrieveResponse } from "./types";

/** Browser-side client. Talks ONLY to this app's Route Handlers, never to the Python service. */

export class KnowledgeAssistantError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "KnowledgeAssistantError";
  }
}

const FRIENDLY: Record<string, string> = {
  video_not_found: "This video has no indexed comments yet.",
  method_unavailable: "This method is not available on the server right now. Try BM25.",
  engine_not_ready: "The retrieval engine is still starting. Try again in a moment.",
  global_scope_disabled: "Select a video to search.",
  upstream_timeout: "The retrieval service took too long to respond.",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new KnowledgeAssistantError(0, "network_error", "Network error. Check your connection.");
  }
  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok || body === null) {
    const err = (body as ApiErrorBody | null)?.error;
    const code = err?.code ?? "unknown_error";
    const detail = err?.details?.map((d) => d.msg).filter(Boolean).join("; ");
    const message = FRIENDLY[code] ?? (detail ? `${err?.message} ${detail}` : err?.message) ?? `Request failed (${res.status}).`;
    throw new KnowledgeAssistantError(res.status, code, message, err?.request_id ?? res.headers.get("X-Request-ID") ?? undefined);
  }
  return body as T;
}

export function retrieveComments(req: RetrieveRequest, signal?: AbortSignal) {
  return request<RetrieveResponse>("/api/knowledge-assistant/retrieve", { method: "POST", body: JSON.stringify(req), signal });
}

export function askYoubeyo(req: AskRequest, signal?: AbortSignal) {
  return request<AskResponse>("/api/knowledge-assistant/ask", { method: "POST", body: JSON.stringify(req), signal });
}

export function getHealth(signal?: AbortSignal) {
  return request<HealthResponse>("/api/knowledge-assistant/health", { signal });
}
