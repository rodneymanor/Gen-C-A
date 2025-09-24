import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let db: Firestore | null = null;
let settingsApplied = false;

export function getAdminDb(): Firestore | null {
  try {
    if (db) return db;

    // Initialize app if needed
    if (!getApps().length) {
      // Prefer service account JSON from env or local file
      let saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'genc-a8f49-firebase-adminsdk-fbsvc-7b158a0d7d.json';
      let resolvedPath = path.isAbsolute(saPath) ? saPath : path.join(process.cwd(), saPath);
      if (!process.env.FIREBASE_SERVICE_ACCOUNT && !fs.existsSync(resolvedPath)) {
        // Auto-discover service account file by pattern in project root
        const files = fs
          .readdirSync(process.cwd())
          .filter((f) => /genc-a8f49-firebase-adminsdk-.*\.json$/i.test(f))
          .map((f) => ({ f, m: fs.statSync(path.join(process.cwd(), f)).mtimeMs }))
          .sort((a, b) => b.m - a.m)
          .map((x) => x.f);
        if (files.length > 0) {
          saPath = files[0]; // most recently modified service account file
          resolvedPath = path.join(process.cwd(), saPath);
        }
      }
      const gaPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount as any), projectId: serviceAccount.project_id });
        // console.log('[firebase-admin] initialized using FIREBASE_SERVICE_ACCOUNT env');
      } else if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        initializeApp({ credential: cert(serviceAccount as any), projectId: serviceAccount.project_id });
        // Also set GOOGLE_APPLICATION_CREDENTIALS for any underlying clients
        process.env.GOOGLE_APPLICATION_CREDENTIALS = resolvedPath;
        // console.log('[firebase-admin] initialized using local service account file:', resolvedPath);
      } else if (gaPath && fs.existsSync(gaPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(gaPath, 'utf8'));
        initializeApp({ credential: cert(serviceAccount as any), projectId: serviceAccount.project_id });
        // console.log('[firebase-admin] initialized using GOOGLE_APPLICATION_CREDENTIALS env');
      } else {
        // Fallback to application default credentials
        initializeApp({ credential: applicationDefault() });
        // console.warn('[firebase-admin] initialized using applicationDefault credentials');
      }
    }

    db = getFirestore();
    if (!settingsApplied) {
      db.settings({ ignoreUndefinedProperties: true });
      settingsApplied = true;
    }
    return db;
  } catch (err) {
    console.error('[firebase-admin] init error:', err);
    return null;
  }
}

export function isAdminInitialized(): boolean {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}
