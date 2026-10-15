import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/knowledge-assistant/retrieve/route";
import { GET } from "@/app/api/knowledge-assistant/health/route";
import { POST as ASK } from "@/app/api/knowledge-assistant/ask/route";
import { parseAskInput, parseRetrieveInput } from "@/features/knowledge-assistant/api/validate";

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/knowledge-assistant/retrieve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));

const okBody = { request_id: "r1", results: [], result_count: 0 };

describe("parseRetrieveInput", () => {
  it("applies defaults and trims", () => {
    expect(parseRetrieveInput({ query: "  hi  " })).toEqual({
      ok: true,
      value: { query: "hi", method: "bm25", top_k: 10, scope: { corpus: "v1", domain: null, video_id: null } },
    });
  });

  it("drops unknown fields such as a client-supplied creator ID", () => {
    const r = parseRetrieveInput({ query: "q", creator_id: "UC1", scope: { video_id: "abc", owner: "me" } });
    expect(r.ok && r.value).toEqual({ query: "q", method: "bm25", top_k: 10, scope: { corpus: "v1", domain: null, video_id: "abc" } });
  });

  it.each([
    [{ query: "   " }],
    [{ query: "x".repeat(1001) }],
    [{ query: "q", method: "BM25 (lexical)" }],
    [{ query: "q", top_k: 0 }],
    [{ query: "q", top_k: 51 }],
    [{ query: "q", top_k: 2.5 }],
    [{ query: "q", scope: { video_id: "../etc" } }],
    [{ query: "q", scope: { corpus: "v3" } }],
    [{ query: "q", scope: { corpus: "v2", domain: "politics" } }],
    [null],
  ])("rejects %j", (input) => {
    expect(parseRetrieveInput(input).ok).toBe(false);
  });
});

describe("POST /api/knowledge-assistant/retrieve", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_URL", "http://backend:8000/");
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_KEY", "secret");
    vi.stubEnv("KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS", "true");
    vi.stubEnv("NODE_ENV", "development");
    fetchMock = vi.fn(async () => new Response(JSON.stringify(okBody), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forwards only allowed fields with the service key", async () => {
    const res = await post({ query: "wetakolu", top_k: 5, scope: { video_id: "-3a4abtQH3E" }, creator_id: "UC1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(okBody);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend:8000/v1/retrieve");
    expect((init.headers as Record<string, string>)["X-Service-Key"]).toBe("secret");
    expect(JSON.parse(init.body as string)).toEqual({
      query: "wetakolu", method: "bm25", top_k: 5, scope: { corpus: "v1", domain: null, video_id: "-3a4abtQH3E" },
    });
  });

  it("rejects invalid JSON and invalid input without calling the backend", async () => {
    expect((await post("{not json")).status).toBe(400);
    const res = await post({ query: "" });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("invalid_request");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("denies access when dev mode is off (auth not integrated)", async () => {
    vi.stubEnv("KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS", "false");
    const res = await post({ query: "q", scope: { video_id: "abc" } });
    expect(res.status).toBe(501);
    expect((await res.json()).error.code).toBe("auth_not_configured");
    expect((await post({ query: "q" })).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never allows dev bypass in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await post({ query: "q", scope: { video_id: "abc" } })).status).toBe(501);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes backend errors through", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "video_not_found", message: "x", request_id: "r" } }), { status: 404 }));
    const res = await post({ query: "q", scope: { video_id: "nope" } });
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("video_not_found");
  });

  it("maps backend 401 to 502 (server misconfiguration, not a user error)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "unauthorized" } }), { status: 401 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post({ query: "q" });
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("upstream_misconfigured");
  });

  it("maps network failure and timeout", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await (await post({ query: "q" })).json()).error.code).toBe("upstream_unreachable");
    fetchMock.mockRejectedValueOnce(new DOMException("t", "TimeoutError"));
    const res = await post({ query: "q" });
    expect(res.status).toBe(504);
    expect((await res.json()).error.code).toBe("upstream_timeout");
  });

  it("reports missing backend URL", async () => {
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_URL", "");
    const res = await post({ query: "q" });
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("upstream_not_configured");
  });
});

describe("GET /api/knowledge-assistant/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("proxies backend health", async () => {
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_URL", "http://backend:8000");
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend:8000/v1/health");
  });
});

describe("corpus / domain scope", () => {
  it("passes corpus and domain through", () => {
    const r = parseRetrieveInput({ query: "kottu", scope: { corpus: "v2", domain: "food", video_id: "vidFOOD0002" } });
    expect(r.ok && r.value.scope).toEqual({ corpus: "v2", domain: "food", video_id: "vidFOOD0002" });
  });
});

describe("POST /api/knowledge-assistant/ask", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires a video and drops unknown fields", async () => {
    expect(parseAskInput({ query: "q" }).ok).toBe(false);
    const r = parseAskInput({ query: "q", candidates: 99, scope: { video_id: "abc", domain: "food" } });
    expect(r.ok && r.value).toEqual({ query: "q", method: "multiview_bm25", scope: { corpus: "v1", video_id: "abc" } });
  });

  it("forwards to /v1/ask with the service key", async () => {
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_URL", "http://backend:8000");
    vi.stubEnv("KNOWLEDGE_ASSISTANT_API_KEY", "secret");
    vi.stubEnv("KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS", "true");
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ status: "answered" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await ASK(new Request("http://localhost/api/knowledge-assistant/ask", {
      method: "POST",
      body: JSON.stringify({ query: "q", scope: { video_id: "-3a4abtQH3E" } }),
    }));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend:8000/v1/ask");
    expect((init.headers as Record<string, string>)["X-Service-Key"]).toBe("secret");
  });
});
