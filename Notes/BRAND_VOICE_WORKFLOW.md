# Brand Voice Workflow

## Overview
This document describes how the write flow loads brand personas and applies their voice signatures to generated scripts.

## Persona Retrieval
1. The client calls `GET /api/brand-voices/list` when the write surfaces (Write page, Hemingway editor toolbar).
2. `handleListBrandVoices` queries Firestore `creators` to list available personas.
3. Metadata overrides (display name, default/shared flags) live in Firestore `brandVoiceMeta/{creatorId}`.
4. The persona id exposed to the UI is the `creators` document id. This value is passed through subsequent API calls.

## Template + Style Fetching
1. When a persona id is selected, the client calls `GET /api/brand-voices/templates?creatorId=...`.
2. `handleGetBrandVoiceTemplates` queries Firestore collections scoped by that `creatorId`:
   - `hookTemplates`
   - `bridgeTemplates`
   - `goldenNuggetTemplates`
   - `ctaTemplates`
   - `speakingStyles` (tone, power words, avg sentence length)
3. The response bundles the template arrays and the `styleSignature` derived from `speakingStyles`.

## Script Generation
1. `ScriptGenerator` and the Hemingway floating toolbar include the persona id when calling `useScriptGeneration`.
2. The hook builds a prompt for Gemini by embedding the persona templates and style hints from the API response.
3. Gemini returns the structured script components (`hook`, `bridge`, `goldenNugget`, `wta`), ensuring the output matches the persona voice.

## Error Handling Expectations
- Both brand voice API routes require Firestore access. Any failure to connect or query should surface as an error response (see implementation notes in `src/api-routes/brand-voices.js`).
- Frontend features should surface an actionable message if persona or template loading fails, prompting engineering follow-up.
