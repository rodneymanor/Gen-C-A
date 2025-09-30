# OpenAPI Spec Relocation

The canonical spec now lives at `../apps/backend/openapi/openapi.yaml` so the backend can be deployed from the `apps/backend` subdirectory. Leaving this file here avoids breaking older scripts—update any remaining tooling to point at the new location.
