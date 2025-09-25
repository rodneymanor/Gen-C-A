import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../../src/api-routes/utils/firebase-admin.js';
import { getNotesService, NotesServiceError } from '../../src/services/notes/notes-service.js';
import { resolveExtensionUser } from '../_utils/extension-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await resolveExtensionUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const db = getDb();
  if (!db) {
    return res.status(503).json({ success: false, error: 'Content service unavailable' });
  }

  const service = getNotesService(db);
  const uid = auth.uid;

  try {
    if (req.method === 'GET') {
      const list = await service.listNotes(uid);
      return res.json({ success: true, notes: list, count: list.length });
    }

    if (req.method === 'POST') {
      const payload = (req.body as any) || {};
      const note = await service.createNote(uid, payload);
      return res.status(201).json({ success: true, note });
    }

    if (req.method === 'PUT') {
      const payload = (req.body as any) || {};
      const noteId = String(payload.id || payload.noteId || '');
      if (!noteId) return res.status(400).json({ success: false, error: 'noteId is required' });
      const updated = await service.updateNote(uid, noteId, payload);
      return res.json({ success: true, note: updated });
    }

    if (req.method === 'DELETE') {
      const idParam = (req.query?.noteId || req.query?.id) as string | string[] | undefined;
      const noteId = Array.isArray(idParam) ? idParam[0] : idParam;
      if (!noteId) return res.status(400).json({ success: false, error: 'noteId is required' });
      await service.deleteNote(uid, String(noteId));
      return res.json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    if (error instanceof NotesServiceError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[api/chrome-extension/notes] error:', error);
    return res.status(500).json({ success: false, error: message });
  }
}

