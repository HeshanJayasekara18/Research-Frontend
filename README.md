# Creator Research Platform — Frontend

Shared Next.js (App Router, TypeScript) frontend for the four research components:

| Route | Feature folder | Owner |
|---|---|---|
| `/market-research` | `src/features/market-research` | C1 |
| `/video-prediction` | `src/features/video-prediction` | C2 |
| `/knowledge-assistant` | `src/features/knowledge-assistant` | C3 |
| `/analytics` | `src/features/analytics` | C4 |

Each backend is an independent Python service. **The browser never calls a backend directly.** It calls this app's server-side Route Handlers (`src/app/api/<feature>/…`), which hold service keys and do authorisation.

## Knowledge Assistant (C3)

```
src/features/knowledge-assistant/
  api/types.ts        v1 contract types (mirror of backend docs/openapi.json)
  api/validate.ts     input validation; rebuilds requests from allowed fields only
  api/client.ts       browser client -> /api/knowledge-assistant/*
  server/ragService.ts server-only fetch to the FastAPI service (X-Service-Key, timeout, error mapping)
  server/access.ts    video access check (placeholder until platform auth exists)
  lib/methods.ts      plain-language method names/descriptions
  lib/compare.ts      pooling + agreement maths for Evidence & Analysis (unit-tested)
  hooks/              useHealth, useRecentSearches (browser-only history)
  components/         AssistantWorkspace, EvidenceAnalysis, DashboardOverview, ScopePicker,
                      MethodSelect, EvidenceCard, ScoreChart, ServiceStatus
src/components/shell/ AppShell (sidebar navigation), Icon
src/app/api/knowledge-assistant/retrieve/route.ts   POST proxy
src/app/api/knowledge-assistant/health/route.ts     GET proxy
```

**Screens:** `/` Dashboard, `/knowledge-assistant` (ask a question, see supporting comments), `/knowledge-assistant/evidence` (compare up to four methods on one question). The UI follows Apple HIG conventions: system font, semantic colours, light/dark mode, visible focus, reduced-motion support.

**Honesty rules in the UI:** no generated answer is shown until the RAG milestone exists. Commenter identities are never shown (they are removed from the corpus). No "relevance %" is shown without human labels: the evidence screen shows method *agreement* instead, and experimental methods are labelled as experimental.

**Security model:** `video_id` is only a search filter. The backend never verifies ownership. `server/access.ts` must check that the signed-in user may access the video. Until platform login exists, it **denies** every request unless `KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS=true` is set, and that flag is ignored in production.

## Local development (Windows PowerShell)

1. Start the backend (see the backend repo `docs/SERVICE_SETUP.md`):
   ```powershell
   uvicorn service.main:app --host 127.0.0.1 --port 8000
   ```
2. Configure and run this app:
   ```powershell
   Copy-Item .env.example .env.local    # set KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS=true for local use
   npm install
   npm run dev                          # http://localhost:3000/knowledge-assistant
   ```
3. Checks:
   ```powershell
   npm run typecheck; npm run lint; npm test; npm run build
   ```

If `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (antivirus or proxy HTTPS inspection), point Node at the Windows trusted certificates (`NODE_EXTRA_CA_CERTS=<exported .pem>`). Do not disable `strict-ssl`.

## Environment variables (server-only)

| Name | Purpose |
|---|---|
| `KNOWLEDGE_ASSISTANT_API_URL` | FastAPI base URL, e.g. `http://127.0.0.1:8000` |
| `KNOWLEDGE_ASSISTANT_API_KEY` | Same value as the backend's `RAG_SERVICE_API_KEY` |
| `KNOWLEDGE_ASSISTANT_TIMEOUT_MS` | Upstream timeout (default 15000) |
| `KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS` | Dev-only access bypass; ignored in production |

Never prefix these with `NEXT_PUBLIC_`.

## Branches

`type/cN-short-name`, for example `feat/c3-knowledge-assistant-ui`. Short-lived branches, Pull Requests with review, and a protected `main`.
