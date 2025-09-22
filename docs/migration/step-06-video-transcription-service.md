# Migration Step 06 – Video Transcription Service

## Goals
- Move Gemini-based video transcription logic into a reusable service to reduce duplication and improve error handling.
- Ensure Express, Vercel, and Next App Router endpoints share the same download/transcription workflow.
- Preserve payload shape (transcript, components, metadata, debug info) while improving cookie/header handling.

## Implementation
- Added `src/services/video/video-transcription-service.js`
  - Handles CDN downloads with retries, file-size checks, cookie parsing, and Gemini uploads.
  - Emits `VideoTranscriptionServiceError` with `statusCode` + optional `debug` payload.
- Updated Express handler (`src/api-routes/videos/transcribe.js`) to delegate to the service.
- Added Vercel helper `api/_utils/video-transcription-service.ts` and refactored `api/video/transcribe-from-url.ts` to use it.
- Simplified Next App Router endpoint (`src/app/api/video/transcribe-from-url/route.ts`) to call the shared service and surface structured errors.

## Behavior parity checklist
- Request parameters (`videoUrl`, `cookies`) unchanged.
- Response still includes transcript, components, metadata, `wordCount`, `characterCount`, `headersUsed`, `cookieNames`, and `requestId`.
- Error responses now consistently return HTTP status from `VideoTranscriptionServiceError` with existing debug info (headers/cookies/status).

## Next steps
1. Extract remaining video features (scrape/orchestrate/TikTok workflows) into shared services.
2. Continue service extraction for Chrome extension endpoints before moving all controllers into `apps/backend`.
3. Add unit coverage for `VideoTranscriptionService` (download fallbacks, size limits, Gemini errors).
