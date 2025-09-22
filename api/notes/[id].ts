import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNotesRequestContext, sendNotesError } from '../_utils/notes-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = (req.query as any)?.id;
  const noteId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!noteId) {
    return res.status(400).json({ success: false, error: 'Note id is required' });
  }

  const context = await getNotesRequestContext(req, res);
  if (!context) {
    return;
  }

  const { auth, service } = context;

  try {
    if (req.method === 'GET') {
      const note = await service.getNoteById(auth.uid, String(noteId));
      return res.status(200).json({ success: true, note });
    }

    if (req.method === 'PUT') {
      const note = await service.updateNote(auth.uid, String(noteId), (req.body as any) || {});
      return res.status(200).json({ success: true, note });
    }

    if (req.method === 'DELETE') {
      await service.deleteNote(auth.uid, String(noteId));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendNotesError(res, error, 'Failed to process note request', '[api/notes/[id]] error:');
  }
}
