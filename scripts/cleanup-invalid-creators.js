#!/usr/bin/env node
/**
 * Cleanup invalid creator docs and related speakingStyles.
 * Usage:
 *   node scripts/cleanup-invalid-creators.js <docId1> <docId2> ...
 *
 * Requires Firebase Admin credentials available the same way as the app:
 * - FIREBASE_SERVICE_ACCOUNT env (JSON) OR
 * - FIREBASE_SERVICE_ACCOUNT_PATH pointing to a local JSON file OR
 * - GOOGLE_APPLICATION_CREDENTIALS / application default credentials
 */

import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function initDb() {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(sa), projectId: sa.project_id });
      } else {
        const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
        const resolved = saPath && (path.isAbsolute(saPath) ? saPath : path.join(process.cwd(), saPath));
        if (resolved && fs.existsSync(resolved)) {
          const sa = JSON.parse(fs.readFileSync(resolved, 'utf8'));
          initializeApp({ credential: cert(sa), projectId: sa.project_id });
          process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
        } else {
          initializeApp({ credential: applicationDefault() });
        }
      }
    } catch (e) {
      console.error('Failed to initialize Firebase Admin:', e);
      process.exit(1);
    }
  }
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

async function main() {
  const ids = process.argv.slice(2).filter(Boolean);
  if (!ids.length) {
    console.error('Please pass one or more creator doc IDs to delete.');
    console.error('Example: node scripts/cleanup-invalid-creators.js Ww6888dSQkrAGR0qM6hU nDKXG5mHrovHyBiUjav6');
    process.exit(2);
  }

  const db = await initDb();

  for (const id of ids) {
    try {
      console.log(`Deleting creator doc: ${id}`);
      await db.collection('creators').doc(id).delete();

      console.log(`Deleting related speakingStyles with creatorId == ${id}`);
      const styles = await db.collection('speakingStyles').where('creatorId', '==', id).get();
      const batch = db.batch();
      styles.forEach((doc) => batch.delete(doc.ref));
      if (!styles.empty) await batch.commit();

      console.log(`✅ Cleaned ${id}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${id}:`, e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

