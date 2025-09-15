import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetNoteById, handleUpdateNote, handleDeleteNote } from '../../src/api-routes/notes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  (req as any).params = { id: (req.query as any).id };

  if (req.method === 'GET') return handleGetNoteById(req as any, res as any);
  if (req.method === 'PUT') return handleUpdateNote(req as any, res as any);
  if (req.method === 'DELETE') return handleDeleteNote(req as any, res as any);
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

