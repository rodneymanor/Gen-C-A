# Migration Step 10 – Instagram Service

## Goals
- Centralize RapidAPI calls for Instagram user ID lookup and reels fetching.
- Remove ad hoc username sanitization and response handling from route handlers.

## Implementation
- Added `src/services/video/instagram-service.js`
  - Provides `getUserId` and `getUserReels` methods, sanitizes input, and throws `InstagramServiceError`.
- Updated Express handlers (`src/api-routes/videos/instagram-user-id.js`, `src/api-routes/videos/instagram-reels.js`) to delegate to the service.
- Added Vercel helper `api/_utils/instagram-service.ts` and refactored `api/instagram/*.ts` endpoints.
- Replaced Next App Router implementations (`src/app/api/instagram/user-id/route.ts`, `src/app/api/instagram/user-reels/route.ts`) so they now call the shared service instead of mock logic.

## Behavior parity checklist
- Request payloads unchanged (`username` for user ID, `userId/count/includeFeedVideo` for reels).
- Responses retain existing shape (`success`, `user_id`, `processed`, etc.).
- Errors from RapidAPI propagate via `InstagramServiceError` with HTTP status codes and optional debug info.

## Next steps
1. Audit remaining Chrome extension endpoints for consolidation before moving controllers into `apps/backend`.
2. Add tests for `InstagramService` (username sanitization, error propagation, reel processing).
