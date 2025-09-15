Secrets Management
==================

Overview
- Keep secrets out of Git. `.gitignore` excludes `.env*`, `/data/`, and `/.secrets/`.
- Use `.env.local` for developer machines. Never commit it.
- For production/CI, use your platform’s secret manager (Vercel, Netlify, GitHub Actions, GCP/AWS/Azure).

Local Setup
- Copy `.env.example` to `.env.local` and fill values.
- Store Firebase Admin JSON outside the repo for safety:
  - Create: `~/.config/gen-c-alpha/secrets/`
  - Place the JSON there and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` to the absolute path.
- Alternatively, create a repo‑local `./.secrets/` folder (already ignored) for convenience during development.

Firebase Admin
- Required vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and credentials via either:
  - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/adminsdk.json` (recommended), or
  - Inline `FIREBASE_PRIVATE_KEY` if your setup requires it.

Production/CI
- Do NOT upload JSON keys. Instead, configure environment variables and, where supported, mount secrets from the platform.
- Example: set `GOOGLE_APPLICATION_CREDENTIALS` to a mounted path or inject JSON content into a runtime secret and write it to a temp file at boot.

Key Hygiene
- Rotate keys if they were ever committed, shared, or exposed.
- Use least privilege service accounts and per‑env keys.
- Avoid echoing secrets in logs. Scrub sensitive output in tests and scripts.

Sample Data
- The `/data/` directory is ignored. If you need shareable examples, add sanitized files under `data.sample/` and document how to copy them locally.

