# Migration Step 11 – Brand Voices & Creator Services

## Goals
- Move brand voice listing, template retrieval, and admin updates into a shared service layer.
- Centralize creator analysis persistence (Gemini summary storage) and analyzed video lookups.
- Ensure all runtimes (Express backend, Vercel functions, legacy servers) delegate to the new services without changing API responses.

## Implementation
- Added `src/services/brand-voices/brand-voices-service.js` with `BrandVoicesService` + error type.
- Added `src/services/creator/creator-analysis-service.js` and `src/services/creator/creator-lookup-service.js` for analysis persistence and lookup flows.
- Updated backend routes under `apps/backend/src/routes` to call the new services directly.
- Refactored `src/api-routes/{brand-voices,creator-analysis,creator-lookup}.js` to reuse the shared services.
- Introduced Vercel helpers in `api/_utils` and rewired API handlers (`api/brand-voices/*.ts`, `api/creator/save-analysis.ts`, new `api/creator/analyzed-video-ids.ts`).
- Legacy catch-all (`api/[...path].ts`) continues to function through the updated handlers, ensuring parity during the transition.

## Behavior parity checklist
- `GET /api/brand-voices/list`, `/templates`, `/delete`, `/update-meta` return identical payloads and status codes.
- `POST /api/creator/save-analysis` still stores Gemini output, falls back to local JSON when Firestore is unavailable, and returns the same `saved` counters.
- `GET /api/creator/analyzed-video-ids` continues to accept either `handle` or `creatorId` and returns the same de-duplicated list.
- Internal secret enforcement for delete/update endpoints preserved; 4xx/5xx mapping unchanged.

## Next steps
1. Remove remaining references to `src/api-routes/**` from `api/[...path].ts` once all callers use the new helpers.
2. Add unit coverage for the new services (success paths, Firestore failures, local fallback, RBAC edge cases).
3. Proceed with service extraction for any remaining Chrome extension persona routes before deleting the legacy API folder.
