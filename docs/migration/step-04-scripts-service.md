# Migration Step 04 – Scripts Service Extraction

## Goals
- Centralize script CRUD logic so all runtimes share the same Firestore access patterns.
- Trim duplicated helpers from Express, Vercel, and Next App Router routes.
- Preserve configurable storage paths (`CONTENT_SCRIPTS_PATH`) and payload normalisation (word counts, tags, voice metadata).

## Implementation
- Added `src/services/scripts/scripts-service.js`
  - Exposes `ScriptsService` with list/create/read/update/delete methods.
  - Handles default field population (status, summary, duration, counts) and strips undefined values before persistence.
  - Emits `ScriptsServiceError` with HTTP-friendly status codes (401/403/404/500).
- Updated Express handlers in `src/api-routes/scripts.js`
  - Routes now call `ScriptsService` and translate service errors to HTTP responses.
- Introduced Vercel helper `api/_utils/scripts-service.ts`
  - Provides shared auth + service bootstrap for `api/scripts/index.ts` and `api/scripts/[id].ts`.
- Refactored Next App Router scripts endpoints (`src/app/api/scripts/route.ts`, `src/app/api/scripts/[id]/route.ts`)
  - Routes now import the shared service and surface `ScriptsServiceError` codes instead of duplicating Firestore logic.
- Moved `verifyRequestAuth` into `src/app/api/utils/auth.ts` for reuse across notes and scripts routes; removed the old `src/app/api/scripts/utils.ts` helper.

## Behavior parity checklist
- Authentication flow unchanged (`verifyBearer` + `verifyRequestAuth`).
- Storage fallbacks maintained (configured path → user subcollection → root collection).
- Response shapes remain `{ success, scripts }`, `{ success, script }`, and `{ success: false, error }`.
- Word count, character count, and summary defaults continue to match the previous implementation.

## Next steps
1. Add unit coverage for `ScriptsService` (create/update/delete, configured path resolution, forbidden access).
2. Continue service extraction for remaining feature groups (e.g., voice analysis, video ingestion, chrome extension endpoints).
3. Start wiring routes into the future `apps/backend` structure once more services are migrated.
