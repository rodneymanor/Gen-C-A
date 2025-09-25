import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const info: any = {
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

  // Firestore availability (load utils at runtime to avoid import-time crashes)
  try {
    const { getDb, verifyBearer } = await import('../src/api-routes/utils/firebase-admin.js');
    const db = getDb();
    info.firestoreInitialized = Boolean(db);
    const auth = await verifyBearer(req as any);
    info.auth = auth ? { uid: auth.uid } : null;
  } catch (e: any) {
    info.firestoreInitialized = false;
    info.auth = null;
    info.importError = e?.message || String(e);
  }

  // Check configured content paths resolve
  try {
    info.contentPaths = {
      scripts: process.env.CONTENT_SCRIPTS_PATH || 'users/{uid}/scripts (default) ',
      notes: process.env.CONTENT_NOTES_PATH || 'users/{uid}/notes (default)',
    };
  } catch {}

  return res.status(200).json(info);
}
