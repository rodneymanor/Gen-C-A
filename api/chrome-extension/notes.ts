import type { VercelRequest, VercelResponse } from '@vercel/node';

async function resolveUid(req: VercelRequest): Promise<string | null> {
  try {
    const { verifyBearer } = await import('../../src/api-routes/utils/firebase-admin.js');
    const bearer = await verifyBearer(req as any);
    if (bearer?.uid) return bearer.uid;
  } catch {}

  const apiKey = (req.headers['x-api-key'] as string) || (req.headers['X-Api-Key'] as any);
  const directUid = (req.headers['x-user-id'] as string) || (req.query?.userId as any);
  if (apiKey) {
    const raw = process.env.EXTENSION_API_KEYS;
    const map: Record<string, string> = {};
    if (raw) {
      raw.split(',').map(s => s.trim()).filter(Boolean).forEach(entry => {
        const [k, v] = entry.split(':');
        if (k && v) map[k.trim()] = v.trim();
      });
    }
    const expected = [process.env.API_KEY, process.env.NEXT_PUBLIC_API_KEY, process.env.ADMIN_API_KEY, process.env.INTERNAL_API_SECRET]
      .filter(Boolean) as string[];
    const mapped = map[apiKey];
    const fallback = directUid || mapped || process.env.DEFAULT_EXTENSION_USER_ID || process.env.ADMIN_DEFAULT_USER_ID;
    if (mapped || expected.includes(apiKey) || apiKey.startsWith('genc')) {
      if (fallback) return String(fallback);
    }
  }
  return directUid ? String(directUid) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const uid = await resolveUid(req);
  if (!uid) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { getDb } = await import('../../src/api-routes/utils/firebase-admin.js');
    const db = getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Content service unavailable' });

    const { getNotesService, NotesServiceError } = await import(
      '../../src/services/notes/notes-service.js'
    );
    const service = getNotesService(db);

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
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Unexpected error';
    console.error('[api/chrome-extension/notes] error:', message);
    return res.status(status).json({ success: false, error: message });
  }
}

