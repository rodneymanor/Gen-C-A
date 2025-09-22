# End-State Architecture Plan

The migration consolidates the current hybrid API setup (Express dev server, Vercel API functions, Next App Router handlers) into a single backend service with shared domain logic.

## Target Layout

```
/
├─ apps/
│  ├─ web/                     # Vite SPA only (no API handlers)
│  └─ backend/                 # Node server (Express/Fastify/Koa) exposing all REST endpoints
│     ├─ src/
│     │  ├─ routes/            # HTTP controllers grouped by feature (collections, notes, etc.)
│     │  ├─ middleware/
│     │  ├─ config/
│     │  └─ bootstrap files
│     └─ package.json
├─ packages/
│  └─ shared/                  # Reusable domain services, types, utils
│     ├─ services/collections/
│     ├─ services/notes/
│     └─ (future feature services)
├─ docs/
│  └─ migration/
│     ├─ step-01-api-inventory.md
│     ├─ step-02-collections-service.md
│     ├─ step-03-notes-service.md
│     └─ end-state-architecture.md (this document)
├─ package.json (workspace root)
└─ ...
```

### Key Principles

- **Single API Surface**: All HTTP entry points live in `apps/backend`. Clients (web app, Chrome extension, scripts) call these endpoints; there are no stray handlers in `api/`, `src/api-routes/`, or `src/app/api/`.
- **Shared Domain Logic**: Feature services (e.g., `CollectionsAdminService`, `NotesService`) reside in `packages/shared`. Backend controllers import these services to keep the transport layer thin and consistent.
- **Clear Separation**: `apps/web` remains a pure frontend. Any backend-specific code (auth middleware, Firestore access) stays inside `apps/backend` or shared packages.

## Migration Checklist

1. **Service Extraction**
   - [x] Collections -> `CollectionsAdminService`
   - [x] Notes -> `NotesService`
   - [x] Scripts -> `ScriptsService`
   - [x] Voice analysis -> `VoiceService`
   - [x] Video ingestion stack (scraper, transcription, orchestrator, TikTok, Instagram)
   - [x] Brand voices -> `BrandVoicesService`
   - [x] Creator analysis & lookup services
   - [ ] Remaining Chrome extension + persona-specific handlers

2. **Route Refactor**
   - [ ] Move Express/Vercel/Next routes into `apps/backend/src/routes`
   - [ ] Replace legacy route files (`api/`, `src/api-routes/`, `src/app/api/`) with backend controllers

3. **Client Updates**
   - [ ] Update frontend/env config to point at the new backend base URL
   - [ ] Ensure Chrome extension and automation scripts hit the unified backend

4. **Cleanup**
   - [ ] Remove obsolete folders (`api/`, `src/api-routes/`, `src/app/api/`) once all functionality exists in `apps/backend`
   - [ ] Delete temporary helpers and docs referencing legacy paths

5. **Deployment**
   - [ ] Create backend deployment pipeline (container or serverless adapter)
   - [ ] Document required environment variables (Firestore credentials, RapidAPI keys, etc.)
   - [ ] Update monitoring/health checks to hit `apps/backend`

## Notes

- Until the migration is complete, documentation (Step 01–03 and future steps) should reference progress toward this end-state.
- Shared services should ship with unit/integration tests before controllers move to the backend app.
- Once the backend is the single API surface, the Vite dev server can proxy to `apps/backend` for local development.
- Voice analysis (`/api/voice/analyze-patterns`) delegates to `VoiceService` (Gemini orchestration).
- Video transcription (`/api/video/transcribe-from-url`) delegates to `VideoTranscriptionService` (Gemini + CDN downloads).
- Video scraping (`/api/video/scrape-url`) delegates to `VideoScraperService`.
- Video orchestration (`/api/video/orchestrate`) delegates to `VideoOrchestratorService`.
- TikTok feed (`/api/tiktok/user-feed`) delegates to `TikTokFeedService`.
- Instagram user ID and reels endpoints delegate to `InstagramService`.
- Chrome extension notes endpoints delegate to `ChromeExtensionNotesService`.
- Video scraping (`/api/video/scrape-url`) delegates to `VideoScraperService`.
