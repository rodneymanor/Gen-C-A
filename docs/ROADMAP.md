# Gen.C Alpha Roadmap

This document tracks milestones, priorities, and implementation details. The in-app view is available at `/roadmap`.

## Current Focus

- Collections feature migration to Vite + Express
- Firebase Admin initialization (ESM-compatible)
- RBAC-aware access for collections/videos
- Add-to-Collections modal (URL import)
- Create Collection modal
- Auth & RBAC service parity with contract-driven tests

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

- **Auth & RBAC parity**: mirror the Vitest expectations by (1) exposing `success`/`error` response objects from the admin `AuthService`, (2) reinstating RBAC helpers such as `canPerformAction`, `filterUserCollections`, and `buildCollectionsQuery`, and (3) wiring both services to share a typed context (`RBACContext`, `CustomClaims`).
- Add a compatibility layer in `src/services/auth/AuthService.ts` that adapts existing admin calls to the expected shape while retaining initialization guards. Extend unit coverage with fixtures that reflect both the legacy boolean responses and the richer result objects.
- Rehydrate the extracted RBAC service with Firestore-aware query builders plus in-memory caching; lean on test utilities for permission strings (e.g., `read:collections`, `*:collections`). Document differences from the coach-access implementation in `docs/GEN_C_ALPHA_DOCUMENTATION.md` when the refactor lands.
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
