# Migration Step 05 – Voice Analysis Service Extraction

## Goals
- Centralize the Gemini prompt orchestration used by `/api/voice/analyze-patterns`.
- Remove duplicate Gemini-loading code from Express, Vercel, and Next App Router endpoints.
- Maintain batching behavior and response shapes while improving error handling.

## Implementation
- Added `src/services/voice/voice-service.js`
  - Wraps Gemini interactions in `VoiceService` and surfaces `VoiceServiceError` for HTTP-friendly status codes.
  - Handles batching logic, prompt construction, and default fallbacks when only transcripts are provided.
- Updated Express route `src/api-routes/voice.js`
  - Delegates to the shared service and maps service errors to HTTP responses.
- Added `api/_utils/voice-service.ts` + refactored `api/voice/analyze-patterns.ts`
  - Vercel serverless handler now parses the request, calls the service, and emits consistent error payloads.
- Created Next App Router endpoint `src/app/api/voice/analyze-patterns/route.ts`
  - Uses `VoiceService` directly and mirrors the Express/Vercel response structure.

## Behavior parity checklist
- Request body fields (`prompt`, `transcripts`, `model`, `temperature`, `enableBatching`, etc.) unchanged.
- Batching support preserved: service returns `type: 'batch'` with batch metadata and aggregated content.
- Single-run output still returns model metadata, final prompt, and raw Gemini content.
- Error responses remain `success: false` with descriptive messages and appropriate status codes.

## Next steps
1. Continue extracting services for video ingestion (scrape/transcribe/orchestrate) to remove remaining Firestore and Gemini logic from route handlers.
2. Once all services are centralized, begin relocating HTTP controllers into `apps/backend` and retire the legacy `api`/`src/api-routes`/`src/app/api` directories.
3. Add unit coverage for `VoiceService` (single run + batching flows + error surfaces).
