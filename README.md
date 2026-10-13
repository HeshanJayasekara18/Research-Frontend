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

## Local development (Windows PowerShell, two terminals)

### Terminal 1: backend (C3 FastAPI service)

Run from the **backend repository root**. The app object is `app` in `src/rag_service/api/main.py`, so the module path is `rag_service.api.main:app`.

```powershell
cd <path>\Explainable-RAG-Knowledge-Assistant-Backend
$env:RAG_SERVICE_API_KEY = "dev-local-key" # any local value; must match KNOWLEDGE_ASSISTANT_API_KEY below
python run.py                              # starts uvicorn on 127.0.0.1:8000 with reload
```

`run.py` adds `src/` to the path itself and reads the backend `.env` if present. The equivalent manual command is `$env:PYTHONPATH = "src"; python -m uvicorn rag_service.api.main:app --host 127.0.0.1 --port 8000 --reload`.

Wait for `Application startup complete.`, then check http://127.0.0.1:8000/v1/health (API docs: http://127.0.0.1:8000/docs). Backend setup and dependencies are covered in the backend's `docs/SERVICE_SETUP.md`.

### Terminal 2: frontend (this repository)

```powershell
cd <path>\Reserch-Frontend
Copy-Item .env.example .env.local          # first time only; then edit .env.local (values below)
npm install                                # first time only
npm run dev                                # http://localhost:3000/knowledge-assistant
```

Minimum `.env.local` for local development:

```
KNOWLEDGE_ASSISTANT_API_URL=http://127.0.0.1:8000
KNOWLEDGE_ASSISTANT_API_KEY=dev-local-key
KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS=true
```

Next.js only reads `.env.local` at startup, so restart `npm run dev` after editing it.

### Checks

```powershell
npm run typecheck; npm run lint; npm test; npm run build
```

`npm run build` / `npm start` run in production mode. There the dev video bypass is ignored, so `/api/knowledge-assistant/retrieve` returns `501 auth_not_configured` until platform login is integrated. This is intended.

If `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (antivirus or proxy HTTPS inspection), point Node at the Windows trusted certificates (`NODE_EXTRA_CA_CERTS=<exported .pem>`). Do not disable `strict-ssl`.

## Environment variables

### Backend (Python, FastAPI)

| Name | Purpose |
|---|---|
| `RAG_SERVICE_API_KEY` | Shared secret the backend expects in the `X-Service-Key` header. **Unset = no authentication**, allowed for localhost development only. |
| `RAG_ENV` | `development` (default) or `production`. With `production` the service **refuses to start** without `RAG_SERVICE_API_KEY`. |
| `PYTHONPATH=src` | Development shortcut so Python finds `src/rag_service` without installing it. Not needed after `pip install -e .`. |

### Frontend (Next.js, server-side only)

| Name | Purpose |
|---|---|
| `KNOWLEDGE_ASSISTANT_API_URL` | Backend base URL, e.g. `http://127.0.0.1:8000` |
| `KNOWLEDGE_ASSISTANT_API_KEY` | Must equal the backend's `RAG_SERVICE_API_KEY`. Sent only from Route Handlers. |
| `KNOWLEDGE_ASSISTANT_TIMEOUT_MS` | Upstream timeout (default 15000) |
| `KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS` | Dev-only video access bypass; ignored when `NODE_ENV=production` |

### Security rules

- **The shared key is service-to-service authentication only.** It proves that *this Next.js server* is calling the backend. It is **not** creator login and **not** YouTube channel authorisation. A request with a valid key can search any indexed video. Deciding whether the signed-in user may see a video is the job of `server/access.ts`, using the platform's own login.
- **Never expose the key to the browser.** Do not use `NEXT_PUBLIC_` names, do not import `server/*` from client components (they `import "server-only"`), and do not send the key in responses.
- **API-key-free mode is for localhost only.** Start an unauthenticated backend only with `--host 127.0.0.1` on your own machine. Every shared, staging or production deployment must set `RAG_SERVICE_API_KEY` and `RAG_ENV=production`, so the service cannot start unauthenticated.
- Keep real values in `.env.local` / `.env` (git-ignored). `.env.example` files contain placeholders only.

## Branches

`type/cN-short-name`, for example `feat/c3-knowledge-assistant-ui`. Short-lived branches, Pull Requests with review, and a protected `main`.
