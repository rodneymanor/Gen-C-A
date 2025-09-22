# Migration Step 08 – Video Orchestrator Service

## Goals
- Encapsulate the video orchestration workflow (fetch → transcribe → optional voice analysis) in a reusable service.
- Remove direct HTTP orchestration logic from Express and Vercel handlers; enable reuse in Next App Router.

## Implementation
- Added `src/services/video/video-orchestrator-service.js`
  - Handles downstream fetch/transcribe/voice-analysis requests using shared helpers (`video-utils`).
  - Normalises responses and exposes `VideoOrchestratorServiceError` for structured error reporting.
- Introduced `api/_utils/video-orchestrator-service.ts` and refactored `api/video/orchestrate.ts` to use the service.
- Simplified Next endpoint `src/app/api/video/orchestrate/route.ts` to delegate to the service directly.
- Updated Express handler `src/api-routes/videos/orchestrate.js` to call the service.

## Behavior parity checklist
- Request payload remains the same (fetch endpoint/payload, transcription endpoint, voice analysis toggles).
- Response still returns `transcriptions`, `summary`, and optional `voiceAnalysis` data.
- Errors from downstream services now surface consistent status codes via `VideoOrchestratorServiceError`.

## Next steps
1. Extract services for remaining video fetch helpers (TikTok user feed, Instagram handlers) so orchestrator uses service methods directly.
2. Once all services exist, move HTTP controllers into `apps/backend` and deprecate legacy API folders.
3. Add integration tests to cover the orchestrator service (success, transcription failure, voice analysis failure).
