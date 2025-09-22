# Migration Step 01 – API Inventory

This document captures the current API surface before consolidating everything behind a unified backend service. It lists the active entry points, the actual handler files, and known front-end consumers so that we can port functionality deliberately without breaking clients.

## Runtime entry points

- `apps/backend` – Unified Express backend. `npm run dev` now starts this service alongside Vite (`/api/*` routes are served from here in development).
- `server-vite.js` / `server.js` – Legacy Express servers that previously exposed `src/api-routes/**`. These are still referenced in historical scripts/docs but are slated for removal once all clients are migrated to `apps/backend`.
- `api/[...path].ts` – Catch-all adapter that re-exports the same `src/api-routes/**` handlers to Vercel-style serverless functions.
- `api/**` – Individual Vercel route files (e.g. `api/video/transcribe-from-url.ts`) that proxy into `src/api-routes/**`.
- `src/app/api/**` – Next.js App Router endpoints (many duplicating the same features with a different auth/middleware stack).

## Shared handler modules

Most business logic currently lives inside CommonJS-style files under `src/api-routes/`. Key modules:

- `src/api-routes/creators.js` – RapidAPI integrations for creator transcription.
- `src/api-routes/videos/*.js` – Video scraping/transcription helpers (Gemini, RapidAPI).
- `src/api-routes/brand-voices.js` – Firestore brand-voice aggregations.
- `src/api-routes/collections.js` – Firestore CRUD + RBAC helpers for collections.
- `src/api-routes/notes.js`, `scripts.js`, `voice.js`, `chrome-extension.js`, etc.

These modules mix transport and domain logic and are reused by every runtime entry point listed above.

## Endpoint inventory (grouped by feature)

### Creators & Instagram

| Route | Methods | Current handlers | Front-end consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/health` | GET | `server-vite.js`, `server.js`, `api/health.ts`, `api/[...path].ts` | Health checks (no direct FE usage) | Used as readiness probe.
| `/api/creators/follow` | POST | `handleCreatorTranscription` via `src/api-routes/creators.js` + adapters in `api/creators/follow.ts`, `src/app/api/creators/follow/route.ts` | `src/pages/TranscriptionService.tsx:245` | Three separate transport layers all call the same handler.
| `/api/creators/transcribe` | POST | Same as above | Legacy clients | Alias for `follow`.
| `/api/instagram/user-id` | GET | `src/api-routes/videos/instagram-user-id.js` via Express + `api/instagram/user-id.ts` | No direct SPA calls (used internally in creator flow) | Some fallback logic still in `server.js`.
| `/api/instagram/user-reels` | GET, POST | `src/api-routes/videos/instagram-reels.js` + adapters | `src/app/(main)/personas/services/api.ts:37` (indirect), Instagram tooling | Express fallback duplicates sample data.

### TikTok & Video ingestion

| Route | Methods | Current handlers | Front-end consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/tiktok/user-feed` | POST | `src/api-routes/videos/tiktok-user-feed.js` via Express + `api/tiktok/user-feed.ts`, `src/app/api/tiktok/user-feed/route.ts` | `src/pages/TikTokAnalysisTest.tsx:778`, `src/features/brandhub/services/tiktokVoiceService.ts:4` | Requires RapidAPI credentials.
| `/api/video/transcribe-from-url` | POST | `src/api-routes/videos/transcribe.js` via Express + `api/video/transcribe-from-url.ts`, `src/app/api/video/transcribe-from-url/route.ts` | `src/features/brandhub/services/videoTranscriptionService.ts:103`, `src/pages/TikTokAnalysisTest.tsx:935` | Gemini API + file uploads.
| `/api/video/scrape-url` | POST | `src/api-routes/videos/scrape-url.js` via Express + `api/video/orchestrate.ts` (workflow) | `src/lib/unified-video-scraper.ts`, TikTok tools | Gem scraping.
| `/api/video/orchestrate` | POST | `api/video/orchestrate.ts` → `src/api-routes/videos/orchestrate.js` | Workflow tooling | Not wired in `server-vite.js` (only `server.js`).
| `/api/creator/save-analysis` | POST | `src/api-routes/creator-analysis.js` + adapters | `src/features/brandhub/services/voicePersonaService.ts:39`, `src/pages/TikTokAnalysisTest.tsx:1319` | Persists persona analysis results.
| `/api/creator/analyzed-video-ids` | GET | `src/api-routes/creator-lookup.js` + adapters | `src/features/brandhub/services/voicePersonaService.ts:96` (indirect) | Firestore reads.

### Brand voices & personas

| Route | Methods | Current handlers | Front-end consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/brand-voices/list` | GET | `src/api-routes/brand-voices.js` (`handleListBrandVoices`) + adapters | `src/features/brandhub/services/brandVoiceService.ts:33`, `src/components/ui/HemingwayEditor.tsx:403` | Firestore collectionGroup.
| `/api/brand-voices/templates` | GET/POST | Same module (`handleGetBrandVoiceTemplates`) + adapters | `src/components/layout/Navigation.tsx:403` (indirect) | Accepts query/body params.
| `/api/brand-voices/delete` | POST | `src/api-routes/brand-voices.js` (`handleDeleteBrandVoice`) + adapters | `src/components/layout/Navigation.tsx:403` | Express only (not in `server.js`).
| `/api/brand-voices/update-meta` | POST | Same module + adapters | `src/components/layout/Navigation.tsx:425` | Updates Firestore metadata.
| `/api/voice/analyze-patterns` | POST | `src/api-routes/voice.js` + adapters | `src/features/brandhub/services/voiceAnalysisService.ts:51`, `src/pages/TikTokAnalysisTest.tsx:1124`, `src/hooks/use-script-generation.ts:202` | Gemini usage.
| `/api/personas/generate-metadata` | POST | Placeholder in `server-vite.js` + real handler in `src/app/api/personas/generate-metadata/route.ts` | `src/pages/TikTokAnalysisTest.tsx:1353`, `src/app/(main)/personas/services/api.ts:116` | Express version returns stub.
| `/api/personas/create` | POST | Placeholder in `server-vite.js` + actual Next handler | `src/pages/TikTokAnalysisTest.tsx:1393`, `src/app/(main)/personas/services/api.ts:160` | Needs consolidation.
| `/api/personas/list`, `/api/personas/update`, `/api/personas/delete` | Various | Implemented only in `src/app/(main)/personas/services/api.ts` expectations; no backend handlers in repo | Front-end calls present | Missing endpoints (tech debt).

### Scripts & notes

| Route | Methods | Current handlers | Front-end consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/scripts` | GET/POST | `src/api-routes/scripts.js` + adapters (`api/scripts/index.ts`, `src/app/api/scripts/route.ts`) | `src/pages/Write.tsx:247`, `src/hooks/use-scripts-api.ts:44`, library services | CRUD over Firestore.
| `/api/scripts/:id` | GET/PUT/DELETE | Same module via Express + `api/scripts/[id].ts`, `src/app/api/scripts/[id]/route.ts` | `src/hooks/use-scripts-api.ts:78` | Uses route params.
| `/api/notes` | GET/POST | `src/api-routes/notes.js` + adapters | `src/features/library/services/libraryService.ts:80`, `src/components/editor/hemingway-editor.tsx:438` | Firestore notes.
| `/api/notes/:id` | GET/PUT/DELETE | Same module | `src/app/api/notes/[id]/route.ts` (App Router), SPA uses via editor | Duplicate implementations.

### Collections & videos

| Route | Methods | Current handlers | Front-end consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/collections` | GET/POST | `src/api-routes/collections.js` + adapters | `src/lib/collections-service.ts:961`, SPA Collections page | RBAC via headers (`x-user-id`).
| `/api/collections/user-collections` | GET | Same module | `src/lib/collections-service.ts:961` | Legacy alias.
| `/api/videos/collection` | POST | Same module (`handleGetCollectionVideos`) | `src/lib/collections-service.ts:1025` | Returns videos for a collection.
| `/api/collections/move-video` | POST | Same module | Collections UI | Firestore updates.
| `/api/collections/copy-video` | POST | Same module | Collections UI | Firestore updates.
| `/api/collections/delete` | DELETE | Same module | Collections UI | Firestore deletes.
| `/api/collections/update` | PATCH | Same module | Collections UI | Firestore updates.
| `/api/videos/add-to-collection` | POST | Same module | `src/lib/collections-service.ts:1025` | Adds video to collection doc.
| `/api/collections/user` | POST | Express-only compatibility wrapper | Legacy clients | Rewrites body to header.

### Chrome extension / shared inbox

| Route | Methods | Current handlers | Consumers | Notes |
| --- | --- | --- | --- | --- |
| `/api/chrome-extension/notes` | GET/POST/PUT/DELETE | `src/api-routes/chrome-extension.js` | Chrome extension flows | Mirrors notes CRUD with custom auth.
| `/api/chrome-extension/collections` | GET/POST | Same module | Extension | Proxy to collections service.
| `/api/chrome-extension/collections/add-video` | POST | Same module | Extension | Adds video to collection.
| `/api/content-inbox/items` | POST | Same module | Extension (content inbox) | Accepts payload alias.
| `/api/idea-inbox/items` | POST | Same handler (`handleContentInboxPost`) | Extension | Alias for content inbox.
| `/api/chrome-extension/idea-inbox/text` | POST | Same module | Extension | Separate entry for text submissions.
| `/api/chrome-extension/idea-inbox/video` | POST | Same module | Extension | Handles video submissions.
| `/api/chrome-extension/youtube-transcript` | GET/POST | Same module | Extension | Fetches or stores transcripts.

### Miscellaneous

| Route | Methods | Current handlers | Notes |
| --- | --- | --- | --- |
| `/api/ai-action` | POST | Express route in `server-vite.js` that dynamically imports `api/ai-action.ts`; Next App Router also calls `src/api/ai-action/route.ts` | Provides text transformations used by Hemingway editor.
| `/api/voice/analyze-patterns` | POST | See Brand voices section | Used widely for Gemini analysis.
| `/api/humanize`, `/api/shorten`, `/api/transcribe/voice` | POST | **No handlers present in repo** | Hemingway editor references these endpoints (`src/components/editor/hemingway-editor.tsx`), needs confirmation or cleanup.

## Front-end dependency summary

- Core SPA usage: `src/pages/Write.tsx`, `src/pages/TikTokAnalysisTest.tsx`, `src/features/brandhub/**`, `src/hooks/use-scripts-api.ts`, `src/lib/collections-service.ts`, etc.
- App Router feature area: `src/app/(main)/personas/services/api.ts` expects a full CRUD API surface for personas that is only partially implemented.
- Chrome extension routes are consumed by off-repo clients; treat as external contract.

## Observations & risks

1. **Triple-stack duplication** – Every major endpoint exists in three places (Express dev server, Vercel `api/` file, Next App Router handler). Consolidation must pick a single transport layer and treat others as adapters during migration.
2. **Missing endpoints** – Front-end calls to `/api/personas/list|update|delete`, `/api/humanize`, `/api/shorten`, `/api/transcribe/voice` have no backing implementation in the repo. We need to decide whether to build them or remove the calls before migration.
3. **Mixed auth models** – Express handlers mostly expect `x-api-key` or `x-user-id` headers, whereas Next App Router versions use `requireAuth` from `src/services/api-middleware.ts`. Harmonizing authentication should be a priority in the new backend.
4. **Environment coupling** – Handlers rely on env vars (`RAPIDAPI_KEY`, `GEMINI_API_KEY`, Firebase service accounts). Capture these requirements when porting to the new backend app.
5. **Service extraction in progress** – Collections, notes, scripts, voice analysis, video transcription, video scrape, TikTok feed, and Instagram endpoints now delegate to shared services (`src/services/collections`, `src/services/notes`, `src/services/scripts`, `src/services/voice`, `src/services/video`). Continue migrating Chrome extension features before moving controllers into `apps/backend`.

This inventory should remain the living checklist for Step 01. Updates during migration should be reflected here so downstream work (service extraction, controller rewrites) starts from an accurate map of the existing API surface.
