# Migration Step 03 – Notes Service Extraction

## Goals
- Centralize all Firestore note persistence logic in a reusable service.
- Remove duplicated note handlers across Express, Vercel functions, and Next App Router routes.
- Preserve token verification semantics while standardizing error handling with `NotesServiceError`.

## Implementation
- Added `src/services/notes/notes-service.js`
  - Provides `NotesService` with methods for listing, creating, fetching, updating, and deleting notes.
  - Supports configurable collection paths via `CONTENT_NOTES_PATH` and user-field overrides.
  - Normalizes incoming payloads (strings, boolean flags, tag arrays) and ensures ISO timestamps.
  - Emits `NotesServiceError` with HTTP-friendly `statusCode` values (404, 403, etc.).
- Updated Express handlers in `src/api-routes/notes.js`
  - Swapped inline Firestore logic for service calls and mapped service errors to HTTP responses.
- Created Vercel helper `api/_utils/notes-service.ts`
  - Shared auth + service bootstrap (`verifyBearer`, `getNotesService`) and centralized error translation.
  - Refactored `api/notes/*.ts` endpoints to use the helper, eliminating imports from Express handlers.
- Converted Next App Router endpoints (`src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts`)
  - Routes now call the shared `NotesService` and surface `NotesServiceError` codes.
  - Introduced `src/app/api/notes/types.ts` for the shared `NoteRecord` type and removed obsolete `utils.ts`.

## Behavior parity checklist
- Authentication: still enforced through `verifyBearer` (Express/Vercel) and `verifyRequestAuth` (Next).
- Storage fallbacks: service keeps subcollection/root/`CONTENT_NOTES_PATH` lookup sequence.
- Response shape: unchanged (`{ success, note }`, `{ success, notes }`, `{ success: false, error }`).
- Error codes: 401 (missing token), 403 (forbidden), 404 (not found), 503 (missing Firestore), 500 fallback.

## Next steps
1. Add unit tests around `NotesService` (create/update/delete edge cases, configured-path lookups).
2. Migrate remaining feature groups (e.g., scripts, voice) using the same pattern.
3. Update API documentation to reference the unified service layer.
