# Unification Status

- Updated: 2025-09-27 00:45:46Z
- Branch: main
- Head: 23519e07

This document tracks the current state of the application unification effort and provides a single place to see what has shipped, what’s in flight, and what’s next.

## Summary
- Canonical backend: apps/backend is the source of truth for business logic.
- Thin shims: Most Vercel `api/**` and Next App Router handlers now delegate to the backend.
- Env contract: Shared validation and `.env.example` added; local `.env.local` pins a stable backend port.
- Observability: Lightweight request logging added to dev server; smoke script verifies backend vs. proxy parity.

## Environment Contract
- [x] `.env.example` added with complete variable inventory.
- [x] Runtime validator wired into `apps/backend/src/server.ts` and `server.js`.
- [x] Stable backend port configured (`BACKEND_PORT=5001`).
- [x] Local smoke script (`npm run smoke:local`).
- [ ] Production env configured to set `BACKEND_INTERNAL_URL`/`BACKEND_URL`. Owner: Deployer

## Dev Server (server.js)
- [x] Priority proxy shims for `/api/instagram/*` and `/api/tiktok/*` → backend (prevents local-only fallbacks).
- [x] Catch‑all `/api/*` → backend when no explicit dev route is present.
- [ ] Remove legacy fallback JSON stubs after parity is confirmed. Owner: Backend

## Routes Delegated To Backend (Phase 2)

### Vercel API (api/**)
- Viral Content: [x] `api/viral-content/feed.ts`
- Collections: [x] `api/collections/index.ts`, [x] `api/collections/update.ts`, [x] `api/collections/delete.ts`, [x] `api/collections/move-video.ts`, [x] `api/collections/copy-video.ts`
- Videos helper: [x] `api/videos/collection.ts`, [x] `api/videos/add-to-collection.ts`
- Instagram: [x] `api/instagram/user-id.ts`, [x] `api/instagram/user-reels.ts`
- TikTok: [x] `api/tiktok/user-feed.ts`
- Notes: [x] `api/notes/index.ts`, [x] `api/notes/[id].ts`
- Scripts: [x] `api/scripts/index.ts`, [x] `api/scripts/[id].ts`, [x] `api/scripts/youtube-ideas.ts`
- Video: [x] `api/video/orchestrate.ts`, [x] `api/video/scrape-url.ts`, [x] `api/video/transcribe-from-url.ts`, [x] `api/video/youtube-transcript.ts`
- Brand Voices: [x] `api/brand-voices/list.ts`, [x] `api/brand-voices/templates.ts`, [x] `api/brand-voices/update-meta.ts`, [x] `api/brand-voices/delete.ts`
- Creator: [x] `api/creator/analyzed-video-ids.ts`, [x] `api/creator/save-analysis.ts`
- Chrome Extension: [ ] `api/chrome-extension/*` (TODO)
- Diagnostics/Health: [ ] `api/diagnostics*`, [ ] `api/health.ts` (optional to shim; backend already exposes `/health`)

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

## Validation & Observability
- [x] Local smoke: `npm run smoke:local`
  - Verifies backend /health and dev /api/health
  - Asserts parity for GET `/api/viral-content/feed`
  - Basic error-parity checks for `/api/instagram/user-id` and `/api/tiktok/user-feed` without params
- [ ] Add route-by-route smoke for high-traffic flows (collections/video ingest) with a test `SMOKE_USER_ID`.
- [ ] Add a small `x-served-by` header from backend and shims to confirm the serving runtime in logs.

## Outstanding Work
- Phase 2
  - [ ] Delegate remaining `api/chrome-extension/**` and related App Router handlers.
  - [ ] Remove JSON fallbacks in `server.js` once all delegated routes pass smoke tests.
- Phase 3 (Auth Unification)
  - [ ] Implement shared Firebase auth middleware in backend; enforce roles for admin routes.
  - [ ] Create centralized frontend API client that injects ID tokens, replaces `x-user-id`/`x-api-key` flows.
  - [ ] Migrate clients (collections, scripts, instagram/tiktok tools) to the centralized client.
- Phase 4 (Hardening & Cleanup)
  - [ ] Delete duplicate handlers in `api/**` and `src/app/api/**` after traffic fully shifts.
  - [ ] Archive/remove `src/api-routes/**` once their logic is migrated to `src/services/**` and consumed by backend.
  - [ ] Simplify or retire `server.js` to a pure proxy.

## How To Run Locally
- Start both servers: `npm run dev` (or `npm run dev:full`)
- Restart cleanly: `npm run dev:restart` (clears ports incl. 4000 & 5001)
- Smoke tests: `npm run smoke:local`
  - Optional: `SMOKE_USER_ID=<uid> npm run smoke:local` to include collections endpoints

## Deployment Checklist
- [ ] Set `BACKEND_INTERNAL_URL` (or `BACKEND_URL`) in the serverless environment to point to the canonical backend.
- [ ] Confirm `npm run smoke:prod` succeeds against the deployed base.
- [ ] Monitor logs for `x-served-by` (once added) to ensure requests are served by backend.

## Notes / Risks
- Some legacy TypeScript errors remain in the repo; they do not affect the shims but should be addressed as part of service migration.
- Collections endpoints require a real user id/token; smoke tests will show 404/401 when using placeholders.

