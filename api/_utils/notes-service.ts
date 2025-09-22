import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, verifyBearer } from '../../src/api-routes/utils/firebase-admin.js';
import { getNotesService, NotesServiceError } from '../../src/services/notes/notes-service.js';

export async function getNotesRequestContext(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyBearer(req as any);
  if (!auth) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const db = getDb();
  if (!db) {
    res
      .status(503)
      .json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return null;
  }

  const service = getNotesService(db);
  return { auth, service };
}

export function sendNotesError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string
) {
  if (error instanceof NotesServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
