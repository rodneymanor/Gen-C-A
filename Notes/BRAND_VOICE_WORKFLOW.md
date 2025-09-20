# Brand Voice Workflow

## Overview
This document describes how the write flow loads brand personas and applies their voice signatures to generated scripts.

## Persona Retrieval
1. The client calls `GET /api/brand-voices/list` when the write surfaces (Write page, Hemingway editor toolbar).
2. `handleListBrandVoices` queries the Firestore collection group `brandVoiceLibrary/*/brandVoices` to list available personas.
3. Metadata (display name, default/shared flags) is stored on each brand voice document; the handler enforces a single default per creator scope.
4. The persona id exposed to the UI is the brand voice document id (alias: `brandVoiceId`). This value is passed through subsequent API calls along with the `creatorId` that owns the voice.

## Template + Style Fetching
1. When a persona id is selected, the client calls `GET /api/brand-voices/templates?creatorId=...`.
2. `handleGetBrandVoiceTemplates` reads the aggregated `templates` map stored on `brandVoiceLibrary/{creatorId}/brandVoices/{brandVoiceId}`.
3. Detailed run history for a persona is recorded under the `analyses` subcollection and can be surfaced for advanced tooling when required.

## Script Generation
1. `ScriptGenerator` and the Hemingway floating toolbar include the persona id when calling `useScriptGeneration`.
2. The hook builds a prompt for Gemini by embedding the persona templates and style hints from the API response.
3. Gemini returns the structured script components (`hook`, `bridge`, `goldenNugget`, `wta`), ensuring the output matches the persona voice.

## Error Handling Expectations
- Both brand voice API routes require Firestore access. Any failure to connect or query should surface as an error response (see implementation notes in `src/api-routes/brand-voices.js`).
- Frontend features should surface an actionable message if persona or template loading fails, prompting engineering follow-up.


----------------------------

when the brand voice resyncs if a existing video is included in the response do we have dedupe protection so we don't add duplicate videos or analyze existing videos and add them to our brand voice template store. Also, what specific data will get stored when a brand voice is saved


Yes—every resync runs through the merge helpers before we touch Firestore, so existing items aren’t duplicated.

Templates: mergeTemplates keeps a Set of normalized (trimmed, lower‑cased) patterns and only adds newcomers; it also tags the newest source id when available (src/api-routes/utils/brand-voice-store.js:67).
Transcripts: mergeTranscriptCollections keys each entry by id, videoId, title, or a transcript hash and will reuse the first-seen record instead of appending another copy (src/api-routes/utils/brand-voice-store.js:118).
Video metadata: mergeVideoMeta follows the same pattern, deduping on id, videoId, or url (src/api-routes/utils/brand-voice-store.js:144).
Style signature: mergeStyleSignature unions the arrays and prefers the newest scalar values while defaulting tone to “Varied” (src/api-routes/utils/brand-voice-store.js:168).
Each time a voice is saved, the handler assembles this payload and merges it into brandVoiceLibrary/{creatorId}/brandVoices/{brandVoiceId}:

Identity & creator context (creatorId, brandVoiceId, handle, creatorHandle, creatorName, displayName, description) plus creator-level tags like niche and transcript count (src/api-routes/creator-analysis.js:271).
Aggregated content: deduped templates, styleSignature, perTranscript, videoMeta, and keywords/platforms when present (src/api-routes/creator-analysis.js:281).
Analysis bookkeeping: nested analysis block with the latest JSON/text snapshot, latestAnalysisId, total analysisCount, timestamps (savedAt, updatedAt, createdAt), and feature flags (isDefault, isShared) (src/api-routes/creator-analysis.js:285).
A full copy of the current run also lands in the analyses subcollection via buildAnalysisRecord, giving you an append-only history with the same templates, style signature, transcripts, and video metadata captured for that run (src/api-routes/creator-analysis.js:302).
