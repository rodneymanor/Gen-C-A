# Migration Step 09 – TikTok Feed Service

## Goals
- Centralize RapidAPI TikTok feed fetching to avoid duplicating request logic across runtimes.
- Ensure Express, Vercel, and Next handlers surface consistent error payloads.

## Implementation
- Added `src/services/video/tiktok-feed-service.js`
  - Wraps RapidAPI fetch, maps responses to the existing unified shape, and emits `TikTokFeedServiceError`.
- Added helper `api/_utils/tiktok-feed-service.ts` and refactored `api/tiktok/user-feed.ts` to use the service.
- Created Next route `src/app/api/tiktok/user-feed/route.ts` that delegates to the shared service.
- Updated Express handler `src/api-routes/videos/tiktok-user-feed.js` to call the service.

## Behavior parity checklist
- Request payload still accepts `username` and optional `count`.
- Response fields (`success`, `userInfo`, `videos`, `metadata`, `timestamp`) unchanged.
- Errors return HTTP status codes via `TikTokFeedServiceError`, preserving raw RapidAPI info in `debug`.

## Next steps
1. Extract any remaining Instagram-specific helpers to services (`instagram-user-id`, `instagram-reels`).
2. With all video-related services in place, begin moving controllers into `apps/backend`.
3. Write unit tests for `TikTokFeedService` (success, invalid response, missing key).
