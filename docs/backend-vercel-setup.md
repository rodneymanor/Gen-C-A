# Backend Deployment from `apps/backend`

Use this checklist to cut the backend over to its own Vercel project without touching the legacy Next.js repo.

1. **Create a new Vercel project**
   - Repo: `rodneymanor/Gen-C-A`
   - Root Directory: `apps/backend`
   - Framework preset: `Other`
   - Build & Output Settings:
     - Build Command: `npm install`
     - Output Directory: (leave empty – serverless functions handle responses)
     - Install Command: inherit (`npm install` is enough because a lockfile lives beside `package.json`).

2. **Configure environment variables**
   - Sync everything from the current `gencalpha` project: `vercel env pull` > `.env.backend` locally, then `vercel env push` targeting the new project, or copy/paste through the dashboard.
   - Required keys: all Firebase creds (client + admin), Gemini/OpenAI/RapidAPI keys, Bunny credentials, internal feature flags, etc. `apps/backend/src/lib/firebase-admin.ts` still expects the same `FIREBASE_*` variables.

3. **Run the first deploy**
   ```bash
   cd apps/backend
   VERCEL_TOKEN=… vercel deploy --prod --scope rodneymanors-projects
   ```
   You should see `api/[[...path]].ts` compiled as a single Node serverless function.

4. **Cut traffic over**
   - In Vercel → Domains, point `api.gencapp.pro` at the new project (or `vercel alias set <deployment> api.gencapp.pro`).
   - Remove the alias from the legacy `gencalpha` project once the new deployment is healthy.

5. **Smoke tests**
   - Hit `https://api.gencapp.pro/health`, `/docs`, `/openapi`, and a few `/api/*` endpoints.
   - Run `npm run smoke:prod` from the dashboard repo to verify the proxy continues to work.

6. **Archive the old project**
   - Leave the legacy `gencalpha` deployment unaliased (or rename it) so we have a historical copy but no traffic flows through it.

The new serverless entry point lives at `apps/backend/api/[[...path]].ts`, so any future routes added to the Express app are automatically exposed.
