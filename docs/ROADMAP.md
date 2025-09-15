# Gen.C Alpha Roadmap

This document tracks milestones, priorities, and implementation details. The in-app view is available at `/roadmap`.

## Current Focus

- Collections feature migration to Vite + Express
- Firebase Admin initialization (ESM-compatible)
- RBAC-aware access for collections/videos
- Add-to-Collections modal (URL import)
- Create Collection modal

## Next Up (1–2 weeks)

- Auto-navigate to newly created collection detail
- Add “Add to Collections” in collection detail header
- Backend pagination for videos + UI cursor handling
- Harden RBAC on write actions (move/copy/delete)
- Consistent error toasts and retry UX
- Unify Hemingway editor header and sidebar header heights to 68px

## Near Term (2–4 weeks)

- Integrate video processing pipeline for thumbnails/metadata
- Batch actions (move/copy/delete) in VideoGrid
- Unit/integration tests for collections services and routes
- Basic telemetry (timing, error counts)

## Later (4–8 weeks)

- Role-aware admin panels (super_admin/coach)
- Advanced search/filtering across videos
- Export/import collections
- Performance profiling for large datasets

## Technical Notes

- Express routes: `src/api-routes/collections.js`
- Client API: `src/core/auth/rbac-client.ts`
- Collections UI: `src/pages/Collections.tsx`
- Firebase Admin init supports `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_SERVICE_ACCOUNT_PATH`, or ADC.
- Admin endpoints accept `x-api-key` from `INTERNAL_API_SECRET` (fallback) or `API_KEY`/`NEXT_PUBLIC_API_KEY`.

## How to Propose Changes

1. Add an item under the relevant timeframe in this file
2. If non-trivial, open a corresponding issue/ticket
3. Submit PRs scoped to roadmap tasks
4. Update `/docs/GEN_C_ALPHA_DOCUMENTATION.md` if new architecture/components are added
