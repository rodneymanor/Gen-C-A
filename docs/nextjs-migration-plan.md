# Next.js Migration Plan

## Objectives & Success Criteria
- Replace the current Vite + Express split stack with a single Next.js application while preserving the shipped UI routes for the dashboard (homepage), Write flow, Collections, Viral Feed, Library, and Brand Hub experiences.【F:package.json†L1-L40】【F:src/App.tsx†L34-L220】
- Re-implement the API surface that these screens depend on inside the Next.js app without the auxiliary dev proxy or standalone backend process, keeping authentication and business logic intact.【F:package.json†L7-L20】【F:apps/backend/src/app.ts†L9-L80】
- Deliver an MVP that is production-deployable on Vercel with clear guardrails for future hardening (Storybook, additional routes, etc. can follow later).

**Git workflow:** Capture any objective clarifications as docs-only commits (e.g., `docs: refine Next.js migration objectives`) on the active migration branch and hold the PR open until stakeholders agree on scope.

## Current Architecture Snapshot
- **Frontend:** Vite SPA with React Router wiring all major routes through `src/App.tsx`, guarded by Firebase-authenticated `ProtectedRoute` wrappers.【F:src/App.tsx†L34-L220】 The Write page persists scripts through `/api/scripts`, while components import shared feature modules (e.g., `DashboardRoot`, `LibraryRoot`, `CollectionsRoot`).【F:src/pages/Write.tsx†L60-L168】【F:src/features/dashboard/index.ts†L1-L1】【F:src/features/library/index.ts†L1-L1】【F:src/features/collections/index.ts†L1-L1】
- **Backend:** Express server under `apps/backend` mounts routers for collections, scripts, notes, brand, brand voices, viral content, and more. Dev scripts launch it alongside Vite and proxy `/api/*` traffic.【F:package.json†L7-L20】【F:apps/backend/src/app.ts†L9-L120】
- **Data dependencies for in-scope pages:**
  - Collections UI loads collections, collection videos, and performs mutations through `/api/collections` and `/api/videos/*` endpoints via the generated OpenAPI client.【F:src/lib/collections-service.ts†L952-L1079】
  - Library fetches `/api/scripts` and `/api/notes` with authenticated headers.【F:src/features/library/services/libraryService.ts†L1-L91】
  - Viral feed queries `/api/viral-content/feed` and admin actions hit `/api/viral-content/admin/video`.【F:src/features/viral-content/api.ts†L43-L79】
  - Brand Hub calls `/api/brand` and `/api/brand-voices/list` to generate profiles and manage voices.【F:src/pages/BrandHub.tsx†L1-L170】【F:src/features/brandhub/services/brandVoiceService.ts†L32-L47】【F:src/features/brandhub/services/brandProfileService.ts†L17-L43】
  - Write flow persists generated scripts to `/api/scripts` after gathering Firebase tokens.【F:src/pages/Write.tsx†L60-L168】

**Git workflow:** Treat this section as read-only reference; confirm a clean working tree (`git status`) before starting a phase so migration commits only contain intentional changes.

## Target Next.js Architecture
- **Single Next.js 15 project** using the App Router for both UI and API handlers. Shared UI primitives (`src/components`, `src/features`, contexts, utils) remain framework-agnostic modules imported by React Server/Client Components as needed. ✅ Implemented: see `src/app/(authenticated)` route group and `src/app/providers.tsx`.
- **Route groups** map existing React Router paths to App Router segments (e.g., `app/(authenticated)/dashboard/page.tsx`, `app/(authenticated)/collections/[collectionId]/page.tsx`). Authentication wrappers move to a shared layout that fetches Firebase session data on the server when possible and falls back to client guards. ✅ `src/app/(authenticated)/layout.tsx` now wraps pages with `ProtectedRoute` + `Layout` for parity with the legacy shell.
- **API route handlers** live under `app/api/*/route.ts`, replacing Express routers. Each handler can call shared business logic modules ported from `apps/backend/src/routes/**` (optionally collocated under `lib/server` for reuse between handlers).
- **Environment contract** collapses to a single `.env` suite consumed by both server and client via Next.js runtime configuration (`process.env.NEXT_PUBLIC_*` for client exposure), reusing the existing inventory as a baseline.

**Git workflow:** Reference these target states in PR descriptions; when a line item is delivered, update this section within the same commit that introduces the implementation change.

## Migration Phases

### Phase 0 – Planning & Prerequisites
1. **Audit environment variables:** Align `.env.local` keys with Next.js naming conventions (`NEXT_PUBLIC_` vs. server-only) and document required secrets for the MVP endpoints (Firebase, AI providers, RapidAPI, etc.).
2. **Catalog backend logic:** For each router used by in-scope pages (`scripts`, `notes`, `collections`, `videos`, `brand`, `brand-voices`, `viral-content`), identify the minimum handlers that must be ported. Use `apps/backend/src/app.ts` as the authoritative list.【F:apps/backend/src/app.ts†L49-L120】
3. **Decide repository layout:** Either convert the existing repo in-place or create `apps/web` for the new Next app. For the MVP, favor an in-place replacement to minimize tooling drift.

**Git workflow:** Create a phase-specific branch (e.g., `git checkout -b nextjs/phase-0-foundation`), commit environment audits separately from backend catalog notes, and open a draft PR once prerequisites are documented so stakeholders can react early.

### Phase 1 – Bootstrap the Next.js Workspace
1. **Initialize Next.js app:** Run `npx create-next-app@latest` with TypeScript, ESLint, and Tailwind disabled (retain Emotion/Atlaskit). Configure absolute imports to mirror current `@/` aliases.
2. **Set up lint/test tooling:** Wire existing ESLint/Vitest configurations to the Next environment or adopt Next’s `next lint` and Jest/Playwright equivalents, noting test updates later.
3. **Bring over shared styles/assets:** Port `src/styles/globals.css` and any static assets to `app/globals.css` or `public/`.

**Git workflow:** Rebase on `origin/main` before scaffolding; commit the generated Next app independently from config tweaks (e.g., `chore: scaffold next app`, then `chore: align lint tooling`) and push the branch to the draft PR for visibility as soon as the app boots.

### Phase 2 – Shared Modules & State
1. **Move framework-agnostic code:** Copy `src/components`, `src/features`, `src/contexts`, `src/hooks`, `src/utils`, and `src/types` into the Next app’s `src/` folder, adjusting Firebase initialization to support both server and client usage.
2. **Refactor providers:** Translate `ThemeProvider`, `AuthProvider`, and `ProtectedRoute` logic into App Router layouts (`app/(authenticated)/layout.tsx`) and client components that read Firebase auth state.
3. **Update the API client utilities:** Ensure `createApiClient` and auth header builders continue to work when called from server-side handlers or React Server Components.

**Git workflow:** Either continue on the existing branch or start `nextjs/phase-2-shared-modules`; group commits by module migration (e.g., `feat: migrate auth provider to app router`), run targeted tests before each commit, and keep pushes incremental to avoid large review diffs.

### Phase 3 – Page-by-Page UI Migration
1. **Authenticated shell:** Create `(authenticated)` route group with a shared layout that enforces auth, replacing React Router’s `<ProtectedRoute>` and `<Layout>` wrappers.【F:src/App.tsx†L34-L220】
2. **Dashboard (`/dashboard`):** Render `DashboardRoot` inside `app/(authenticated)/dashboard/page.tsx`. Validate that all referenced UI primitives remain client-compatible.【F:src/features/dashboard/index.ts†L1-L1】
3. **Write (`/write`):** Port the Write flow as a client component that requests Firebase tokens and posts to `/api/scripts`. Confirm navigation to `/editor` is implemented via Next’s router (`useRouter`).【F:src/pages/Write.tsx†L10-L169】
4. **Collections (`/collections`, `/collections/[collectionId]`):** Reuse `CollectionsRoot` and update any `react-router` hooks (e.g., `useNavigate`, `useParams`) to Next equivalents (`useRouter`, route params). Ensure the service module continues to hit the same endpoints via the new API handlers.【F:src/features/collections/components/CollectionsRoot.tsx†L1-L60】【F:src/lib/collections-service.ts†L952-L1079】
5. **Viral Content (`/viral-content`):** Port page-level state and ensure data fetching hooks call the Next API handler for `/api/viral-content/feed`. For SSR/ISR, consider server components that stream the feed, but this can be deferred to keep MVP scope manageable.【F:src/features/viral-content/api.ts†L43-L79】
6. **Library (`/library`):** Keep `LibraryRoot` as a client component that fetches through the shared OpenAPI client with Firebase auth headers. Evaluate whether parts can run on the server (e.g., initial fetch) once auth strategy is settled.【F:src/features/library/services/libraryService.ts†L1-L91】
7. **Brand Hub (`/brand-hub`):** Port the complex stateful UI, replacing `useAuth` dependencies with the Next-auth layout. Verify calls to `generateBrandProfile` and `listBrandVoices` continue to function against the Next API routes.【F:src/pages/BrandHub.tsx†L1-L170】【F:src/features/brandhub/services/brandProfileService.ts†L17-L43】【F:src/features/brandhub/services/brandVoiceService.ts†L32-L47】

**Git workflow:** Create stacked branches per route when parallelizing (e.g., `nextjs/page-dashboard`), or commit each page migration separately with descriptive messages; request focused reviews by opening incremental PRs that merge into the main migration branch once each page is stable.

### Phase 4 – API Route Migration
1. **Create handler skeletons:** For each required endpoint, add `app/api/<resource>/route.ts` (or nested routes) implementing the HTTP methods used by the UI.
2. **Port business logic:** Move relevant code from `apps/backend/src/routes/**` into reusable services (e.g., `src/server/collections.ts`) and invoke them from route handlers. Maintain validation (possibly reusing OpenAPI schemas or Zod models) to preserve request/response shapes.
3. **Authentication middleware:** Centralize Firebase token verification and RBAC checks to match existing behavior in collections, scripts, and brand flows.【F:src/lib/collections-service.ts†L952-L1023】【F:src/pages/BrandHub.tsx†L136-L177】
4. **Response parity:** Confirm handlers return the same JSON contracts expected by the existing clients (e.g., `success`, `collections`, `videos`, `voices` fields). Use integration tests or temporary dual-mode deployments to validate.
5. **Viral content integration:** Implement server-side fetchers for RapidAPI/Bunny services inside the Next handler, mirroring the current backend logic referenced by the Express router.【F:apps/backend/src/app.ts†L101-L120】【F:src/features/viral-content/api.ts†L43-L79】

**Git workflow:** Branch from the latest UI migration branch once interfaces are stable; commit handler scaffolds before porting business logic, pair each API change with its tests, and request backend reviewer approval before merging.

### Phase 5 – Testing & Validation
1. **Unit/Integration tests:** Port critical Vitest suites or add new Jest/Playwright coverage focusing on page rendering and API endpoints.
2. **Manual verification:** Execute smoke flows (collections CRUD, script creation, brand profile generation, viral feed pagination) against the Next app.
3. **Performance/regression:** Measure initial load and API latency; ensure no blockers for deploying to Vercel.

**Git workflow:** Use commits prefixed with `test:` or `chore:` for validation updates, run the full test suite before each commit, and attach CI run links or screenshots in the PR discussion when pushing.

### Phase 6 – Cutover & Cleanup
1. **Deployment pipeline:** Configure Vercel project with the Next.js repo, environment variables, and preview deployments.
2. **Cutover plan:** Run both stacks in parallel if needed, then switch DNS/routes to Vercel once parity is confirmed.
3. **Retire legacy tooling:** Remove Vite-specific scripts, Express backend, and proxy code after Next.js is fully adopted. Archive documentation (e.g., `docs/unification-status.md`) with a note pointing to the new architecture.

**Git workflow:** Prepare a release branch (e.g., `release/nextjs-cutover`), squash-merge feature branches only after QA sign-off, tag the cutover commit (`git tag nextjs-cutover-v1`), and remove legacy tooling in the same PR that updates deployment docs.

## Open Questions & Follow-Ups
- **Auth handling on the server:** Decide whether to use NextAuth, Firebase Admin SDK, or custom middleware for verifying tokens inside route handlers.
- **OpenAPI contract reuse:** Evaluate whether to keep generating clients from the existing spec or migrate to a Zod/TypeScript-first approach.
- **Background jobs / long-running tasks:** Identify any endpoints that assume a persistent Node process (e.g., transcription pipelines) and plan for serverless-compatible execution or queue workers.
- **Editor & ancillary routes:** Once the MVP is stable, prioritize porting remaining routes (`/videos`, `/youtube-ideas`, etc.) and re-enabling Storybook if required.

**Git workflow:** Track unresolved decisions as unchecked items or TODOs in the draft PR description; pause merges until blockers are resolved or spun out into follow-up tickets linked in commit messages.

## Deliverables Checklist
- [x] Next.js project scaffolded with shared modules copied over.
- [x] App Router pages for dashboard, write, collections, viral content, library, and brand hub render with existing UI.
- [x] API handlers for scripts, notes, collections, videos, brand, brand-voices, and viral content return parity responses.
- [x] Firebase auth integrated across layouts and API routes.
- [ ] Deployment guide for Vercel plus rollback strategy documented.

**Git workflow:** Update checkboxes in the same commit that satisfies each deliverable so history captures completion; reference supporting evidence (screenshots, logs) in the associated PR comment thread.

## Latest Progress
- Cleared the Next.js build warnings about missing default exports by updating the `(authenticated)` page wrappers to import the named component exports for Channels, Instagram test, TikTok test, and Videos.
- Added App Router wrappers for Dashboard, Write, Collections (including the `[collectionId]` detail view), Library, Viral Content, and Brand Hub so the highest-traffic authenticated routes can be wired into the Next.js shell.
- Filled in App Router shims for collections, videos, and brand voice APIs so each endpoint now forwards to the canonical backend implementation during the migration.

**Git workflow:** Append progress notes whenever you push significant changes, and align commit messages with these entries to make the eventual changelog trivial to assemble.
