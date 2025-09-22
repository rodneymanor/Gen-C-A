# Migration Step 02 – Collections Service Extraction

## Goals
- Move Firestore business logic for collections and video management out of Express handlers.
- Create a reusable service layer that the future backend can import without pulling in HTTP/request concerns.
- Preserve current behavior (responses, permissions, fallbacks) while reducing duplication across runtimes.

## What's new
- **`src/services/collections/collections-admin-service.js`** – exports `CollectionsAdminService` and `CollectionsServiceError`.
  - Handles user profile lookup, coach access resolution, and all Firestore reads/writes.
  - Encapsulates validation (title length, description length, permission checks).
  - Consolidates video mutation logic (add/move/copy) with shared count update helpers.
  - Converts Firestore timestamps to ISO strings where the API previously did so manually.
- **`src/api-routes/collections.js`** now:
  - Delegates to a singleton `CollectionsAdminService` instance fetched via `getDb()`.
  - Keeps request parsing (`requireUserId`, API key checks) and response shaping in the handler.
  - Uses a common `handleCollectionsError` helper to translate service exceptions into HTTP responses.
- **Vercel serverless routes (`api/collections/*.ts`, `api/videos/*.ts`)** now read request data, call the shared service via `resolveCollectionsService`, and use a common error helper instead of importing the Express handlers.
- **Next App Router endpoints (`src/api/collections/...`)** reuse the same service helper, reducing duplicated validation/Firestore access.

## Behavior parity checklist
- `GET /api/collections`
  - Returns identical payload, with optional `accessibleCoaches` when available.
  - Permission logic unchanged (creators see only accessible coaches).
- `POST /api/collections`
  - Rejects invalid titles/descriptions with the same messages.
  - Still blocks `creator` role from creating collections.
- `POST /api/videos/collection`
  - Preserves fallback logic for missing composite indexes.
  - Keeps `totalCount` and timestamp normalization.
- `POST /api/videos/add-to-collection`, `/api/collections/move-video`, `/api/collections/copy-video`
  - Maintain RBAC checks, owner alignment, and count bookkeeping.
- `DELETE /api/collections/delete`, `PATCH /api/collections/update`
  - Continue to require `x-api-key` and enforce owner/super-admin permissions.

## Developer notes
- The service caches a single instance on `globalThis` to avoid repeated initialization during dev hot reloads.
- `CollectionsServiceError` carries an HTTP-friendly `statusCode` so handlers can map errors consistently.
- Timestamp helpers (`toIsoString`, `nowIso`) centralize the previously duplicated conversion logic.
- No changes were made to the Chrome Extension endpoints; they continue to call the same handlers and therefore benefit from the extraction automatically.

## Next steps
1. Write unit tests for `CollectionsAdminService` (happy path + RBAC enforcement) to lock the behavior before moving more features.
2. Update other runtimes (e.g., `api/[...path].ts`, Next App Router collections route) to import and reuse the new service.
3. Begin similar extraction for the next feature group (e.g., Notes or Brand Voices) following this pattern.
