import "server-only";

import type { ApiErrorBody } from "../api/types";

/** Server-side client for the C3 FastAPI service. Never import from client components. */

export interface UpstreamResult {
  status: number;
  body: unknown;
}

function config() {
  const baseUrl = process.env.KNOWLEDGE_ASSISTANT_API_URL;
  if (!baseUrl) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey: process.env.KNOWLEDGE_ASSISTANT_API_KEY ?? "",
    timeoutMs: Number(process.env.KNOWLEDGE_ASSISTANT_TIMEOUT_MS ?? 15000) || 15000,
  };
}

export function errorBody(code: string, message: string, requestId?: string): ApiErrorBody {
  return { error: { code, message, ...(requestId ? { request_id: requestId } : {}) } };
}

export async function callRagService(path: "/v1/retrieve" | "/v1/ask" | "/v1/health", init: { method: "GET" | "POST"; body?: unknown; requestId: string }): Promise<UpstreamResult> {
  const cfg = config();
  if (!cfg) {
    return { status: 500, body: errorBody("upstream_not_configured", "KNOWLEDGE_ASSISTANT_API_URL is not set.", init.requestId) };
  }

  const headers: Record<string, string> = { Accept: "application/json", "X-Request-ID": init.requestId };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (cfg.apiKey) headers["X-Service-Key"] = cfg.apiKey;

  let response: Response;
  try {
    response = await fetch(`${cfg.baseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
  } catch (err) {
    const timeout = err instanceof DOMException && err.name === "TimeoutError";
    return {
      status: timeout ? 504 : 502,
      body: errorBody(timeout ? "upstream_timeout" : "upstream_unreachable", "The retrieval service is unavailable. Try again shortly.", init.requestId),
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: 502, body: errorBody("upstream_bad_response", "The retrieval service returned an invalid response.", init.requestId) };
  }

  // A 401 from the backend means OUR service key is wrong, not that the user is logged out.
  if (response.status === 401) {
    console.error(`[knowledge-assistant] backend rejected service key (request_id=${init.requestId})`);
    return { status: 502, body: errorBody("upstream_misconfigured", "The retrieval service is unavailable.", init.requestId) };
  }
  return { status: response.status, body };
}
