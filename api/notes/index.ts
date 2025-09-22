import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getNotesRequestContext, sendNotesError } from '../_utils/notes-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getNotesRequestContext(req, res);
  if (!context) {
    return;
  }

  const { auth, service } = context;

  try {
    if (req.method === 'GET') {
      const notes = await service.listNotes(auth.uid);
      return res.status(200).json({ success: true, notes });
    }

    if (req.method === 'POST') {
      const note = await service.createNote(auth.uid, (req.body as any) || {});
      return res.status(201).json({ success: true, note });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendNotesError(res, error, 'Failed to process notes request', '[api/notes] error:');
  }
}
