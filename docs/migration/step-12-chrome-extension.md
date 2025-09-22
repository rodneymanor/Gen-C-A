# Migration Step 12 – Chrome Extension Integration

## Current Coverage
- **Notes CRUD**: Express router (`apps/backend/src/routes/extension/notes.ts`) and Next handler (`api/chrome-extension/notes/route.ts`) now rely on `ChromeExtensionNotesService`.
- **Collections list/create + add-video**: Backend router uses `CollectionsAdminService` and the new `ChromeExtensionCollectionsService`; Next handler (`api/chrome-extension/collections/route.ts`) forwards to `/api/collections` with existing auth wrappers.
- **Content & Idea Inbox**: Backend router and legacy handlers now delegate to `ChromeExtensionInboxService`; Next routes forward requests to the unified backend.
- **YouTube Transcript**: Backend router and legacy handlers use `ChromeExtensionYouTubeService`; Next route forwards to the backend endpoint.
- **Creator follow shortcut**: `api/chrome-extension/creators/add/route.ts` proxies straight to `/api/creators/follow` in the unified backend.

## Remaining Legacy Paths
- `src/api-routes/chrome-extension.js` still imports the legacy helpers for content/idea/youtube but now calls the shared services; the file remains only to satisfy catch-all imports until `api/[...path].ts`, `server.js`, and `server-vite.js` stop referencing it.
- Express routes under `apps/backend/src/routes/extension` are now thin wrappers around the shared services, but we still rely on the module to expose those helpers for the legacy dev servers.
- `ChromeExtensionService` (`src/services/chrome-extension/chrome-extension-service.js`) is partially implemented but unused; auth/helpers are duplicated across routers.

## Next Actions
1. Update `api/[...path].ts` and the legacy dev servers to call the new backend/Next handlers directly, then delete `src/api-routes/chrome-extension.js` once nothing imports it.
2. Unify auth + request parsing in one helper to remove duplication between Express and Next routes.
3. Add regression tests covering inbox and transcript flows via the new services before retiring the legacy path.
