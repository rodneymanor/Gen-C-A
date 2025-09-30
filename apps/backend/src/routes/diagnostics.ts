import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb, verifyBearer } from '../lib/firebase-admin.js';

const router = Router();

function credentialMethod(): string {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) return 'service_account_json';
    if (
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      return 'triplet_env_vars';
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return 'file_path_env (likely invalid on Vercel)';
    }
    return 'application_default_credentials_or_unknown';
  } catch {
    return 'unknown';
  }
}

function redacted(value: unknown): boolean {
  return Boolean(value);
}

function bucketLooksValid(name: string | undefined | null): boolean {
  if (!name) return false;
  return !name.includes('http') && name.includes('appspot.com');
}

function parseMap(raw?: string | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;
  const entries = raw
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  for (const entry of entries) {
    const [key, value] = entry.split(':');
    if (key && value) {
      map[key.trim()] = value.trim();
    }
  }
  return map;
}

router.get('/', async (req: Request, res: Response) => {
  const info: Record<string, unknown> = {
    success: true,
    env: {
      has_SERVICE_ACCOUNT_JSON: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
      has_TRIPLET: Boolean(
        (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY
      ),
      has_FILE_PATH: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
    },
    credentialMethod: credentialMethod(),
  };

  try {
    const db = getDb();
    info.firestoreInitialized = Boolean(db);
    const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
    info.auth = auth ? { uid: auth.uid } : null;
  } catch (error) {
    info.firestoreInitialized = false;
    const message = error instanceof Error ? error.message : String(error);
    info.auth = null;
    info.importError = message;
  }

  info.contentPaths = {
    scripts: process.env.CONTENT_SCRIPTS_PATH || 'users/{uid}/scripts (default)',
    notes: process.env.CONTENT_NOTES_PATH || 'users/{uid}/notes (default)',
  };

  res.json(info);
});

router.get('/self-test', async (req: Request, res: Response) => {
  const report: Record<string, unknown> = { success: true, checks: {} };
  const checks = report.checks as Record<string, unknown>;

  checks.env = {
    has_SERVICE_ACCOUNT_JSON: redacted(process.env.FIREBASE_SERVICE_ACCOUNT),
    has_TRIPLET: redacted(
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ),
    has_FILE_PATH: redacted(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS
    ),
    client_project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
    storage_bucket_ok: bucketLooksValid(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || null),
  };

  const db = getDb();
  checks.firestoreInitialized = Boolean(db);
  if (!db) {
    return res.status(500).json(report);
  }

  // Brand voices (no auth required)
  try {
    const { getBrandVoicesService } = await import(
      '../../../../src/services/brand-voices/brand-voices-service.js'
    );
    const service = getBrandVoicesService(db);
    const voices = await service.listBrandVoices({ limit: 1 });
    checks.brandVoices = { ok: true, sampleCount: Array.isArray(voices) ? voices.length : 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.brandVoices = { ok: false, error: message };
  }

  // Viral content (no auth required)
  try {
    const { ViralContentRepository } = await import(
      '../../../../src/services/viral-content/repository.ts'
    );
    const repo = new ViralContentRepository({ db });
    const videos = await repo.listVideos({ limit: 1 });
    checks.viralContent = { ok: true, sampleCount: Array.isArray(videos) ? videos.length : 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.viralContent = { ok: false, error: message };
  }

  try {
    const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
    if (!auth) {
      checks.user = { authenticated: false, reason: 'missing_or_invalid_token' };
    } else {
      checks.user = { authenticated: true, uid: auth.uid };
      try {
        const { getScriptsService } = await import(
          '../../../../src/services/scripts/scripts-service.js'
        );
        const scriptsService = getScriptsService(db);
        const scripts = await scriptsService.listScripts(auth.uid);
        checks.scripts = { ok: true, count: Array.isArray(scripts) ? scripts.length : 0 };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        checks.scripts = { ok: false, error: message };
      }

      try {
        const { getNotesService } = await import('../../../../src/services/notes/notes-service.js');
        const notesService = getNotesService(db);
        const notes = await notesService.listNotes(auth.uid);
        checks.notes = { ok: true, count: Array.isArray(notes) ? notes.length : 0 };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        checks.notes = { ok: false, error: message };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.user = { authenticated: false, error: message };
  }

  res.json(report);
});

router.get('/whoami', async (req: Request, res: Response) => {
  try {
    const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
    if (auth?.uid) {
      return res.json({ success: true, method: 'bearer', uid: auth.uid });
    }

    const apiKey = String(req.headers['x-api-key'] || req.headers['X-Api-Key'] || '');
    const directUid = req.headers['x-user-id'] || req.query.userId;
    const map = parseMap(process.env.EXTENSION_API_KEYS);
    const mappedUid = apiKey ? map[apiKey] : undefined;
    const expectedKeys = [
      process.env.API_KEY,
      process.env.NEXT_PUBLIC_API_KEY,
      process.env.ADMIN_API_KEY,
      process.env.INTERNAL_API_SECRET,
    ].filter(Boolean) as string[];
    const fallbackUid =
      directUid ||
      mappedUid ||
      process.env.DEFAULT_EXTENSION_USER_ID ||
      process.env.ADMIN_DEFAULT_USER_ID;

    if (
      apiKey &&
      fallbackUid &&
      (mappedUid || expectedKeys.includes(apiKey) || apiKey.toLowerCase().startsWith('genc'))
    ) {
      return res.json({ success: true, method: 'apiKey', uid: String(fallbackUid) });
    }

    return res
      .status(401)
      .json({ success: false, error: 'Unable to resolve uid. Provide Bearer token or valid x-api-key.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: message || 'whoami failed' });
  }
});

export { router as diagnosticsRouter };
