# Application Unification Audit

## Overview
This audit summarizes why the local and deployed builds diverge, documents the overlapping runtime stacks that power the app today, and proposes a pragmatic roadmap for converging everything into a single, easy-to-maintain architecture.

For current progress, tasks, and verification steps, see the living status document: `docs/unification-status.md`.

## Symptoms observed in production
- **Environment-specific behaviour.** The local development server (`server.js`) spins up an Express app that mocks Next.js handlers, proxies to the internal backend, and falls back to stub data when imports fail, so features continue to “work” even when dependencies are missing.【F:server.js†L3-L284】
- **Serverless deployment mismatch.** The deployed build on Vercel is driven by static rewrites with serverless API files, so any Express-only fallback or un-migrated handler simply disappears in production.【F:vercel.json†L1-L10】
- **Duplicated logic across runtimes.** Critical routes such as `/api/viral-content/admin/video` are implemented once for the backend Express service and again in the Next.js App Router, creating opportunities for the two to diverge and for one implementation to be excluded from the deployed bundle.【F:apps/backend/src/routes/viral-content.ts†L1-L200】【F:src/app/api/viral-content/admin/video/route.ts†L1-L161】
- **Inconsistent data loading.** TikTok ingestion relies on shared RapidAPI helpers that are only wired through the legacy Express adapter, so production functions can silently fail when the handler was not bundled or the environment variables differ.【F:src/api-routes/videos/tiktok-user-feed.js†L1-L200】

## Current architecture map
Existing documentation already captures the triple-stack duplication (Express dev server, Vercel `api/**`, Next.js App Router) and the features each stack serves, along with known gaps such as missing persona CRUD endpoints.【F:docs/migration/step-01-api-inventory.md†L5-L119】

### Key takeaways
1. **Transport vs. domain logic are blurred.** Most logic still lives inside `src/api-routes/**` and is re-exported into every runtime, so each new feature multiplies the surface area that must stay in sync across adapters.
2. **Authentication is fragmented.** Client hooks (for example `useScriptsApi`) expect Firebase ID tokens, while many Express handlers accept custom headers (`x-user-id`, `x-api-key`). Mixing these approaches causes subtle authorization differences between environments.【F:src/hooks/use-scripts-api.ts†L1-L194】
3. **Backend credentials are brittle.** Admin Firestore access depends on several mutually-exclusive environment strategies; without a consistent deployment contract it is easy for one environment to initialize successfully while another silently fails.【F:src/lib/firebase-admin.ts†L1-L115】

## Target architecture principles
To get to a single, predictable app, adopt the following guardrails:

1. **One canonical backend.** Treat `apps/backend` as the only runtime that owns business logic. Next.js (or Vercel functions) should become thin proxies that delegate into this service during the migration window, then be removed.
2. **Shared service modules.** Move reusable logic out of `src/api-routes/**` into typed service layers under `src/services/**` so that every transport (Express, Vercel, future workers) consumes the same pure functions.
3. **Single auth contract.** Standardize on Firebase ID tokens for end-user requests and a single internal secret for admin/automation flows. Centralize verification middleware inside the backend and share a lightweight client that injects the appropriate headers.
4. **Explicit environment manifests.** Capture required environment variables (RapidAPI keys, Gemini, Firebase credentials) in a typed schema that runs on boot for both local and production builds. Fail fast when configuration is incomplete.
5. **Incremental, testable slices.** Ship consolidation in small phases with automated smoke tests per route so beginners can validate each step before proceeding.

## Current Focus (Phase 2 slices)
- Chrome Extension endpoints: unified behind `apps/backend/src/routes/extension.ts`. Traffic now routes via the serverless catch‑all proxy (`api/[...path].ts`) or an optional Vercel rewrite.
- Video ingest parity: all `api/video/*` Next handlers removed in favor of catch‑all; dev proxy remains until parity is validated, then we’ll drop JSON fallbacks in `server.js`.
- OpenAPI coverage: extended from Scripts to Notes + Collections (list, update, move/copy/delete) and Videos (collection listing, add‑to‑collection). Generated client used by hooks and services.

## Recommended migration roadmap

### Phase 0 – Stabilize environments
- Create a `.env.example` that enumerates every variable consumed by backend code and document how to supply Firebase credentials locally vs. production. Plug this schema into startup validation.
- Update deployment pipelines so both local `server.js` and the deployed backend read from the same environment contract, avoiding “it works locally” surprises.

### Phase 1 – Freeze adapters, add observability
- Add logging/metrics around every `/api/*` handler to understand which runtime serves requests in production. This will highlight dead code and confirm traffic patterns before deleting adapters.
- Introduce integration tests that hit the Vercel-deployed endpoints to detect missing handlers early.

### Phase 2 – Consolidate API entry points
- Inside `apps/backend`, expose every route currently proxied via `server.js`, using the existing controllers as a starting point. Ensure TikTok, Instagram, collections, notes, scripts, and viral content endpoints return the same payload shape as today.
- Modify the Vercel `api/**` files and Next.js App Router handlers to delegate directly to the backend service over HTTP (or import shared service modules) while clearly marking them as temporary shims.
- Remove fallback data paths from `server.js` once the backend responds consistently in development to avoid masking failures.

Acceptance criteria for this phase (Chrome Extension slice):
- `GET/POST /api/chrome-extension/youtube-transcript` return backend responses in dev and prod with identical shapes.
- `POST /api/chrome-extension/idea-inbox/text` and `/idea-inbox/video` succeed under test/dev auth and 401 without.
- No self-recursive calls in App Router; either direct backend call or rewrite-based delegation.
 - All `api/**` serverless handlers removed (except the catch‑all); requests are served by backend (verified via `x-served-by: backend`).

### Phase 3 – Unify authentication & permissions
- Implement a single Express middleware in `apps/backend` that verifies Firebase tokens for user routes and enforces role checks for admin routes. Reference the same middleware from every controller.
- Update client hooks (e.g. scripts, collections, TikTok tools) to always call the backend via a centralized API client that injects tokens and handles errors uniformly.
- Replace legacy header-based auth (`x-user-id`, `x-api-key`) with the standardized approach, deprecating any client that has not been migrated.

### Phase 4 – Hardening & cleanup
- Delete unused or duplicate handlers in `api/**` and `src/app/api/**` once traffic is fully routed through the backend.
- Archive or remove `src/api-routes/**` after their logic is migrated into typed service modules.
- Simplify `server.js` into a pure proxy (or remove it entirely if `apps/backend` exposes a dev server) so local and production environments share the same behaviour.

## Developer experience checklist for beginners
- **Start scripts:** Update documentation so newcomers run a single command (e.g. `npm run dev:full`) that boots both the frontend and the canonical backend.
- **Feature boundaries:** Document which directory owns which responsibilities (`src/services` for business logic, `apps/backend` for HTTP transport, `src/pages`/`src/features` for UI) to reduce accidental cross-cutting changes.
- **Testing guidance:** Provide ready-to-run scripts (Vitest/unit for services, Playwright or simple fetch-based smoke tests for APIs) so that every phase in the roadmap can be validated by beginners without deep backend knowledge.
- **Change management:** Encourage feature flags or environment-based toggles when rolling out new ingestion providers (TikTok, Instagram) to prevent regressions from breaking unrelated flows.
 - **CI:** PRs run backend + smoke tests automatically; logs include `x-served-by` headers to ensure requests hit the canonical backend.

## Environment manifest (reference)
- `.env.example` enumerates required keys and recommended defaults. Key items for current slice:
  - `BACKEND_INTERNAL_URL`, `BACKEND_URL`: used by shims to reach canonical backend.
  - `RAPIDAPI_KEY`: required for YouTube transcript endpoint.
  - `INTERNAL_API_SECRET` or Firebase ID token: used for protected Chrome Extension flows.


By following this plan, the team can converge on a single, testable backend runtime, eliminate the local vs. production drift, and give beginners a reliable workflow for adding features without reintroducing duplication.

## OpenAPI-first workflow (new)
- Source of truth lives in `openapi/openapi.yaml`. Use `npm run check:spec` before committing to validate syntax. See `docs/openapi-workflow.md` for the full checklist.
- Regenerate typed clients and shared types with `npm run gen` (writes to `src/api/client` and `src/types/api.d.ts`). Commit the outputs so other runtimes stay in sync.
- Frontend consumers (starting with `useScriptsApi`) import the generated client and spec-derived types instead of hand-crafted fetch wrappers.
- The backend mounts `express-openapi-validator` right after `express.json`, ensuring requests/responses on documented routes comply with the contract before business logic runs.
- Expand coverage route-by-route: once an endpoint is spec'd, delegate consumers to the shared client and add response validation in Express.
