# OpenAPI Workflow – Scripts API

This guide explains how to keep the scripts API contract, generated clients, and runtime validation in sync.

## Spec location
- Canonical spec: `openapi/openapi.yaml`
- Covers:
  - `GET/POST /api/scripts`
  - `GET/PUT/DELETE /api/scripts/{id}`
  - `POST /api/scripts/youtube-ideas`
- Update this file whenever the scripts API request/response shape changes. Run `npm run check:spec` to validate before committing.

## Generation commands
- `npm run gen:client`: Regenerates the TypeScript client under `src/api/client/`.
- `npm run gen:types`: Regenerates shared type declarations at `src/types/api.d.ts`.
- `npm run gen`: Runs both commands above (preferred).
- Always commit the regenerated artifacts so every runtime (frontend hooks, Node scripts, etc.) stays aligned with the backend contract.

## Frontend usage
- Consumers (starting with `src/hooks/use-scripts-api.ts`) import `DefaultApi`, `Configuration`, or a thin client from `@/api/client` and spec-derived types instead of manual `fetch` wrappers.
- Authentication: supply an `accessToken` resolver that returns a Firebase ID token so the client injects the bearer token automatically.
- Error handling: surface `error` messages from the `{ success: false, error }` envelope when present.

## Backend validation
- `apps/backend/src/app.ts` loads `openapi/openapi.yaml` and installs `express-openapi-validator` immediately after `express.json`.
- The validator enforces both request and response conformance for documented routes before the scripts router executes business logic.
- `apps/backend/src/server.ts` awaits validator installation during startup to avoid serving traffic without schema enforcement.

## Recommended workflow for changes
1. Update `openapi/openapi.yaml` with the new/changed endpoint description.
2. Run `npm run check:spec` to ensure the spec is syntactically valid.
3. Run `npm run gen` to regenerate the client and shared type bundle.
4. Update the frontend/backend code to match the new types (prefer the generated models over handwritten interfaces).
5. Re-run `npm run lint` and `npm run test`.
6. Commit the spec + generated artifacts together.

## Follow-up targets
- Extend the spec to additional high-traffic endpoints (collections, notes, video ingest) and migrate their consumers to the shared client.
- Add automated checks (`npm run check:spec`) to CI so invalid specs fail fast.
- Document shared client patterns for server-side utilities once more routes are covered.

