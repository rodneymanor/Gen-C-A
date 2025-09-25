import type { VercelRequest, VercelResponse } from '@vercel/node';

function redacted(value: any) {
  return Boolean(value);
}

function bucketLooksValid(name?: string | null) {
  if (!name) return false;
  return !name.includes('http') && name.includes('appspot.com');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const report: any = { success: true, checks: {} };

  // Env sanity (non-secret presence flags only)
  report.checks.env = {
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

  // Dynamic imports to avoid import-time crashes
  let getDb: any, verifyBearer: any;
  try {
    ({ getDb, verifyBearer } = await import('../../src/api-routes/utils/firebase-admin.js'));
  } catch (e: any) {
    report.checks.importError = e?.message || String(e);
    return res.status(500).json(report);
  }

  // Firestore init
  const db = getDb();
  report.checks.firestoreInitialized = Boolean(db);
  if (!db) {
    return res.status(500).json(report);
  }

  // Brand voices (no auth required)
  try {
    const { getBrandVoicesService } = await import(
      '../../src/services/brand-voices/brand-voices-service.js'
    );
    const svc = getBrandVoicesService(db);
    const voices = await svc.listBrandVoices({ limit: 1 });
    report.checks.brandVoices = { ok: true, sampleCount: Array.isArray(voices) ? voices.length : 0 };
  } catch (e: any) {
    report.checks.brandVoices = { ok: false, error: e?.message || String(e) };
  }

  // Viral content (no auth)
  try {
    const { ViralContentRepository } = await import(
      '../../src/services/viral-content/repository'
    );
    const repo = new ViralContentRepository({ db });
    const vids = await repo.listVideos({ limit: 1 });
    report.checks.viralContent = { ok: true, sampleCount: Array.isArray(vids) ? vids.length : 0 };
  } catch (e: any) {
    report.checks.viralContent = { ok: false, error: e?.message || String(e) };
  }

  // Auth for notes/scripts (optional)
  try {
    const auth = await verifyBearer(req as any);
    if (!auth) {
      report.checks.user = { authenticated: false, reason: 'missing_or_invalid_token' };
    } else {
      report.checks.user = { authenticated: true, uid: auth.uid };
      // Scripts
      try {
        const { getScriptsService } = await import(
          '../../src/services/scripts/scripts-service.js'
        );
        const ssvc = getScriptsService(db);
        const scripts = await ssvc.listScripts(auth.uid);
        report.checks.scripts = { ok: true, count: Array.isArray(scripts) ? scripts.length : 0 };
      } catch (e: any) {
        report.checks.scripts = { ok: false, error: e?.message || String(e) };
      }
      // Notes
      try {
        const { getNotesService } = await import('../../src/services/notes/notes-service.js');
        const nsvc = getNotesService(db);
        const notes = await nsvc.listNotes(auth.uid);
        report.checks.notes = { ok: true, count: Array.isArray(notes) ? notes.length : 0 };
      } catch (e: any) {
        report.checks.notes = { ok: false, error: e?.message || String(e) };
      }
    }
  } catch (e: any) {
    report.checks.user = { authenticated: false, error: e?.message || String(e) };
  }

  return res.status(200).json(report);
}

