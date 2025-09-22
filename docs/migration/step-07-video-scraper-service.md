# Migration Step 07 – Video Scraper Service

## Goals
- Centralize the logic for TikTok/Instagram URL scraping via the unified scraper.
- Remove direct calls to `createUnifiedVideoScraper` from Express routes and ensure all runtimes share the same API surface.

## Implementation
- Added `src/services/video/video-scraper-service.js`
  - Wraps `createUnifiedVideoScraper()` and throws `VideoScraperServiceError` with appropriate status codes.
- Updated Express handler (`src/api-routes/videos/scrape-url.js`) to consume the service and translate service errors to HTTP responses.
- Added Vercel helper `api/_utils/video-scraper-service.ts` and corresponding endpoint (`api/video/scrape-url.ts`).
- Created Next App Router endpoint (`src/app/api/video/scrape-url/route.ts`) that delegates to the shared service.

## Behavior parity checklist
- Request format unchanged: `{ url, options }`.
- Response still returns `{ success, result }` with the unified scraper payload.
- Unsupported URLs still surface 400 errors; unexpected failures return 500 with consistent messaging.

## Next steps
1. Extract services for the remaining video handlers (TikTok user feed, Instagram helpers, orchestrator).
2. Once all services exist, move controllers into `apps/backend` and retire the legacy route folders.
3. Add tests around the video scraper to ensure platform detection and error propagation behave as expected.
