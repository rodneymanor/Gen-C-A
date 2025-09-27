# Unification Status

 - Updated: 2025-09-27 17:05:00Z
  - Branch: main
  - Head: 23519e07

This document tracks the current state of the application unification effort and provides a single place to see what has shipped, what’s in flight, and what’s next.

## Summary
- Canonical backend: apps/backend is the source of truth for business logic.
- Thin shims: Most Vercel `api/**` and Next App Router handlers now delegate to the backend.
 - Env contract: Shared validation and `.env.example` added; local `.env.local` pins a stable backend port.
 - OpenAPI contract: Scripts endpoints are documented in `openapi/openapi.yaml`, generate typed clients, and are validated at runtime.
- Observability: Lightweight request logging added to dev server; smoke script verifies backend vs. proxy parity.

Recent focus: removed redundant serverless handlers under `api/**`, consolidated to a single catch‑all proxy, removed `api/_utils`, added CI smoke, and expanded OpenAPI to Notes/Collections.

## Environment Contract
- [x] `.env.example` added with complete variable inventory.
- [x] Runtime validator wired into `apps/backend/src/server.ts` and `server.js`.
- [x] Stable backend port configured (`BACKEND_PORT=5001`).
- [x] Local smoke script (`npm run smoke:local`).
- [x] Production env configured to set `BACKEND_INTERNAL_URL`/`BACKEND_URL` (confirmed by Deployer).

## Dev Server (server.js)
- [x] Priority proxy shims for `/api/instagram/*` and `/api/tiktok/*` → backend (prevents local-only fallbacks).
- [x] Catch‑all `/api/*` → backend when no explicit dev route is present.
- [ ] Remove legacy fallback JSON stubs after parity is confirmed. Owner: Backend

## Routes Delegated To Backend (Phase 2)

### Vercel API (api/**)
- Consolidated to a single catch‑all: [x] `api/[...path].ts` → proxies all `/api/*` to backend.
- Removed legacy per‑endpoint files under `api/**` (Instagram, TikTok, scripts, notes, collections, video, brand‑voices, diagnostics, chrome‑extension, etc.).

### Next App Router (src/app/api/**)
- Viral Content: [x] `viral-content/feed`, [x] `viral-content/admin/video`
- Instagram: [x] `instagram/user-id`, [x] `instagram/user-reels`
- TikTok: [x] `tiktok/user-feed`
- Notes: [x] `notes` (list), [x] `notes/[id]`
- Scripts: [x] `scripts` (list), [x] `scripts/[id]`
- Video: [x] `video/orchestrate`, [x] `video/scrape-url`, [x] `video/transcribe-from-url`
- Voice: [x] `voice/analyze-patterns`
- Personas: [ ] `personas/*` (if still required) — align with backend or deprecate
- Brand: [ ] `brand` (review and align)
 - Chrome Extension: shims removed; traffic routes via catch‑all or optional rewrite.

## Validation & Observability
- [x] Local smoke: `npm run smoke:local`
  - Verifies backend /health and dev /api/health
  - Asserts parity for GET `/api/viral-content/feed`
  - Basic error-parity checks for `/api/instagram/user-id` and `/api/tiktok/user-feed` without params
  - Scripts API validated at runtime via `express-openapi-validator` against `openapi/openapi.yaml`.
- [ ] Add route-by-route smoke for high-traffic flows (collections/video ingest) with a test `SMOKE_USER_ID`.
- [ ] Add a small `x-served-by` header from backend and shims to confirm the serving runtime in logs.
 - [ ] Add Chrome Extension smoke:
   - GET `/api/chrome-extension/youtube-transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ` (expects 200 with `segments` array when RAPIDAPI_KEY is set; 401 when auth missing).
   - POST `/api/chrome-extension/idea-inbox/text` with `{ content: "hello" }` (expects 201 and note shape in dev with test key; 401 otherwise).

## API Contracts & Tooling
- [x] Document scripts endpoints in `openapi/openapi.yaml`.
- [x] Generate client + type bundles via `npm run gen` (writes to `src/api/client` and `src/types/api.d.ts`).
- [x] Frontend hook `useScriptsApi` now consumes the generated client.
- [x] Backend enforces the scripts spec at runtime with `express-openapi-validator`.
- [x] Extend OpenAPI coverage to Notes and Collections; added `/api/notes`, `/api/notes/{id}`, `/api/collections`, plus `/api/collections/(move-video|copy-video|update|delete)`, and `/api/videos/(collection|add-to-collection)`.
- [ ] Migrate remaining client hooks to the shared OpenAPI client once specs exist.
 - [ ] Decide if Chrome Extension endpoints are included in OpenAPI (recommended minimal read-only coverage for transcript endpoint).

## Outstanding Work
- Phase 2
  - [x] Delegate `api/**` to backend via catch‑all; remove endpoint files.
  - [ ] Remove JSON fallbacks in `server.js` once all delegated routes pass smoke tests.
  - [ ] Add a Vercel rewrite for `/api/chrome-extension/(.*)` → backend base (optional; catch‑all handles today).
- Phase 2.5 (Contract-first)
  - [ ] Expand OpenAPI spec beyond scripts; regenerate shared clients.
- Phase 3 (Auth Unification)
  - [ ] Implement shared Firebase auth middleware in backend; enforce roles for admin routes.
  - [ ] Create centralized frontend API client that injects ID tokens, replaces `x-user-id`/`x-api-key` flows. *(Scripts hook now uses the generated OpenAPI client as the first adopter.)*
  - [ ] Migrate clients (collections, scripts, instagram/tiktok tools) to the centralized client.
- Phase 4 (Hardening & Cleanup)
- [x] Delete duplicate handlers in `api/**` after traffic fully shifts.
  - [ ] Archive/remove `src/api-routes/**` once their logic is migrated to `src/services/**` and consumed by backend.
  - [ ] Simplify or retire `server.js` to a pure proxy.

## Today’s Action Items
- Chrome Extension
  - [ ] Fix recursion in `api/chrome-extension/youtube-transcript/route.ts` by delegating to `process.env.BACKEND_INTERNAL_URL` (fallback to `BACKEND_URL`) plus path `/chrome-extension/youtube-transcript`.
  - [ ] Add equivalent shims (or remove if Vercel rewrite is added) for `idea-inbox/text`, `idea-inbox/video`, and `collections/*` endpoints that exist in `apps/backend/src/routes/extension.ts`.
  - [ ] Verify with curl against dev and prod; update this doc with results.
- Rewrites
  - [ ] Add Vercel rewrite for `/api/chrome-extension/(.*)` to backend base (safer than same-origin).
- Observability
  - [ ] Add `x-served-by: backend|shim|dev-proxy` headers across backend and shims.
- Auth cleanup
  - [ ] Replace `x-user-id`/`x-api-key` in shims with Firebase ID token resolution via the centralized API client when available.

## How To Run Locally
- Start both servers: `npm run dev` (or `npm run dev:full`)
- Restart cleanly: `npm run dev:restart` (clears ports incl. 4000 & 5001)
- Smoke tests: `npm run smoke:local`
  - Optional: `SMOKE_USER_ID=<uid> npm run smoke:local` to include collections endpoints
 - CI: GitHub Actions workflow `.github/workflows/smoke.yml` runs backend + smoke on PRs and pushes to `main`. Logs include `x-served-by` header summaries.
 - For Chrome Extension endpoints locally:
   - Ensure `RAPIDAPI_KEY` is set in `.env.local` for YouTube transcript.
   - Use `INTERNAL_API_SECRET` or test key in dev to exercise notes/collections flows.

## Deployment Checklist
- [x] Set `BACKEND_INTERNAL_URL` (or `BACKEND_URL`) in the serverless environment to point to the canonical backend.
- [ ] Confirm `npm run smoke:prod` succeeds against the deployed base.
- [ ] Monitor logs for `x-served-by` (once added) to ensure requests are served by backend.

## Notes / Risks
- Some legacy TypeScript errors remain in the repo; they do not affect the shims but should be addressed as part of service migration.
- Collections endpoints require a real user id/token; smoke tests will show 404/401 when using placeholders.
