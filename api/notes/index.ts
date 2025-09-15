import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetNotes, handleCreateNote } from '../../src/api-routes/notes.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleGetNotes(req as any, res as any);
  if (req.method === 'POST') return handleCreateNote(req as any, res as any);
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

