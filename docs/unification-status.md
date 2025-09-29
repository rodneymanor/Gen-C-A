# Unification Status

- Updated: 2025-09-29 00:55:00Z
  - Branch: main
  - Head: HEAD

This document tracks the current state of the application unification effort and provides a single place to see what has shipped, what’s in flight, and what’s next.

## Summary
- Canonical backend: `apps/backend` owns business logic; responses now normalize timestamps/required fields to satisfy the OpenAPI validator.
- Thin shims: Most Vercel `api/**` and Next App Router handlers delegate to the backend; frontend clients call the generated SDK with Firebase auth headers.
- Env contract: Shared validation and `.env.example` added; local `.env.local` pins a stable backend port.
- OpenAPI contract: Notes/Collections/Scripts/Videos/Instagram/TikTok endpoints live in `openapi/openapi.yaml`, generate typed clients, and are validated at runtime.
- Observability: Lightweight request logging + `x-served-by` header expose serving runtime; smoke scripts cover auth + TikTok 200/400 parity.

Recent focus: enforced Firebase ID token verification for collections/library flows, normalized collection + script payloads so express-openapi-validator passes, migrated remaining TikTok/Instagram utilities to the generated client, refreshed CI/local smokes to include `/api/tiktok/user-feed` cases, reconnected Chrome Extension flows in production via Vercel rewrites, and published live OpenAPI docs at `/docs` (served by the backend `/openapi` endpoint).

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
 - Chrome Extension: App Router shims forward to backend; production rewrite covers `/api/chrome-extension/*`.

## Validation & Observability
- [x] Local smoke: `npm run smoke:local`
  - Verifies backend /health and dev /api/health
  - Asserts parity for GET `/api/viral-content/feed`
  - Basic error-parity checks for `/api/instagram/user-id` and `/api/tiktok/user-feed` without params
  - Scripts API validated at runtime via `express-openapi-validator` against `openapi/openapi.yaml`.
 - [x] Add `x-served-by` header from backend/shims to confirm serving runtime (surfaced in smoke logs).
 - [x] Chrome Extension smoke:
   - GET `/api/chrome-extension/youtube-transcript?url=...` (401 without key; 200 with key when `RAPIDAPI_KEY` is set).
   - POST `/api/chrome-extension/idea-inbox/text` (201 with dev internal key; 401 otherwise).
 - [x] Videos contract smoke: POST `/api/videos/collection` (presence/shape check; auth-sensitive).
- [x] CI smoke workflow `.github/workflows/smoke.yml` prints `x-served-by` summary.
- [x] Added TikTok smokes: 400 (missing params) and optional 200 check when `RAPIDAPI_KEY` + `TIKTOK_SMOKE_USERNAME` (or `VIRAL_TIKTOK_USERNAME`) are set.
 - [ ] Add route-by-route smoke for high-traffic flows (collections/video ingest) with a test `SMOKE_USER_ID` (optional, gated).
 - [x] Gated collections smokes (optional):
   - `SMOKE_FIREBASE_TOKEN` — enables authenticated tests
   - `SMOKE_COLLECTION_ID`, `SMOKE_TARGET_COLLECTION_ID`, `SMOKE_VIDEO_ID` — enable update/move/copy checks

## API Contracts & Tooling
- [x] Document scripts endpoints in `openapi/openapi.yaml`.
- [x] Generate client + type bundles via `npm run gen` (writes to `src/api/client` and `src/types/api.d.ts`).
- [x] Frontend hook `useScriptsApi` now consumes the generated client.
- [x] Backend enforces the scripts spec at runtime with `express-openapi-validator`.
- [x] Extend OpenAPI coverage to Notes and Collections; added `/api/notes`, `/api/notes/{id}`, `/api/collections`, plus `/api/collections/(move-video|copy-video|update|delete)`, and `/api/videos/(collection|add-to-collection)`.
- [x] Migrate library + collections service to the generated client; scripts hook already migrated.
- [x] Extend OpenAPI coverage to Instagram: added `/api/instagram/user-id` and `/api/instagram/user-reels`.
- [x] Extend OpenAPI coverage to TikTok: added `/api/tiktok/user-feed` (GET/POST).
- [x] Extend OpenAPI to Video: added `/api/video/transcribe-from-url` and `/api/video/orchestrate` (minimal contracts).
- [x] Extend OpenAPI to Video scrape: added `/api/video/scrape-url` (minimal contract).
- [x] Regenerate clients via `npm run gen`; added `src/api/client.ts` helper using `openapi-fetch`.
- [x] Migrate Instagram client calls in `src/features/brandhub/services/instagramVoiceService.ts` and `src/pages/TikTokAnalysisTest.tsx` to the generated client.
- [x] Migrate TikTok client utilities to generated client: `src/features/brandhub/services/tiktokVoiceService.ts`, `src/app/(main)/personas/services/api.ts`, and `src/pages/TikTokAnalysisTest.tsx`.
- [x] Migrate transcription callers to generated client: `src/app/(main)/personas/services/api.ts`, `src/features/brandhub/services/videoTranscriptionService.ts`, partial in `src/pages/TikTokAnalysisTest.tsx`.
- [x] Migrate scrape callers: `src/test/writing-redesign/WritingRedesign.tsx` now uses the generated client for `/api/video/scrape-url`.
- [x] Migrate remaining TikTok helpers to the shared OpenAPI client (personas + brand hub flows).
 - [x] Host Swagger UI at `/docs` consuming `/openapi/openapi.yaml`.
 - [ ] Decide if Chrome Extension endpoints are included in OpenAPI (recommended minimal read-only coverage for transcript endpoint).

## Outstanding Work
- Phase 2
  - [x] Delegate `api/**` to backend via catch‑all; remove endpoint files.
- [x] Remove JSON fallbacks in `server.js`; keep pure proxy with explicit chrome‑extension mappings. `x-served-by: dev-proxy` set.
  - [x] Add a Vercel rewrite for `/api/chrome-extension/(.*)` → backend base (optional; catch‑all handles today).
- Phase 2.5 (Contract-first)
  - [ ] Expand OpenAPI coverage to remaining high-traffic endpoints; regenerate shared clients.
- Phase 3 (Auth Unification)
  - [ ] Implement shared Firebase auth middleware in backend; enforce roles for admin routes.
  - [ ] Create centralized frontend API client that injects ID tokens, replaces `x-user-id`/`x-api-key` flows. *(Scripts hook now uses the generated OpenAPI client as the first adopter.)*
  - [ ] Migrate remaining utilities (instagram/tiktok tools) to the centralized client.
- Phase 4 (Hardening & Cleanup)
- [x] Delete duplicate handlers in `api/**` after traffic fully shifts.
  - [ ] Archive/remove `src/api-routes/**` once their logic is migrated to `src/services/**` and consumed by backend.
  - [ ] Simplify or retire `server.js` to a pure proxy.

## Today’s Action Items
- Chrome Extension
  - [x] Fix recursion in `api/chrome-extension/youtube-transcript/route.ts` by delegating to `process.env.BACKEND_INTERNAL_URL` (fallback to `BACKEND_URL`) plus path `/chrome-extension/youtube-transcript`.
  - [x] Add equivalent shims (or remove if Vercel rewrite is added) for `idea-inbox/text`, `idea-inbox/video`, and `collections/*` endpoints that exist in `apps/backend/src/routes/extension.ts`.
  - [x] Verify with curl against dev and prod; update this doc with results.
- Rewrites
  - [x] Add Vercel rewrite for `/api/chrome-extension/(.*)` to backend base (safer than same-origin).
- Observability
  - [ ] Add `x-served-by: backend|shim|dev-proxy` headers across backend and shims.
- Auth cleanup
  - [ ] Replace `x-user-id`/`x-api-key` in shims with Firebase ID token resolution via the centralized API client when available.

## How To Run Locally
- Start both servers: `npm run dev` (or `npm run dev:full`)
- Restart cleanly: `npm run dev:restart` (clears ports incl. 4000 & 5001)
- Smoke tests: `npm run smoke:local`
  - Optional: `SMOKE_USER_ID=<uid> npm run smoke:local` to include collections endpoints
  - Optional gated auth tests:
    - `SMOKE_FIREBASE_TOKEN=<id_token>`
    - `SMOKE_COLLECTION_ID=<sourceColl>` `SMOKE_TARGET_COLLECTION_ID=<targetColl>` `SMOKE_VIDEO_ID=<video>`
 - CI: GitHub Actions workflow `.github/workflows/smoke.yml` runs backend + smoke on PRs and pushes to `main`. Logs include `x-served-by` header summaries.
 - For Chrome Extension endpoints locally:
   - Ensure `RAPIDAPI_KEY` is set in `.env.local` for YouTube transcript.
   - Use `INTERNAL_API_SECRET` or test key in dev to exercise notes/collections flows.

## Deployment Checklist
- [x] Set `BACKEND_INTERNAL_URL` (or `BACKEND_URL`) in the serverless environment to point to the canonical backend.
- [x] Confirm `npm run smoke:prod` (manual curl suite) succeeds against the deployed base.
- [ ] Monitor logs for `x-served-by` (once added) to ensure requests are served by backend.

## Notes / Risks
- Some legacy TypeScript errors remain in the repo; they do not affect the shims but should be addressed as part of service migration.
- Collections endpoints require a real user id/token; smoke tests will show 404/401 when using placeholders.
- Firestore still needs the composite index referenced in backend logs for Notes list queries; create the index via the Firebase console link surfaced in `/api/notes` failures.
