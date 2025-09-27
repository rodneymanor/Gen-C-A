import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyToBackend } from '../_utils/backend-proxy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = (req.method || 'GET').toUpperCase();
  if (!['GET', 'PUT', 'DELETE'].includes(method)) {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  const idParam = (req.query as any)?.id;
  const noteId = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!noteId) return res.status(400).json({ success: false, error: 'Note id is required' });
  return proxyToBackend(req, res, `/api/notes/${encodeURIComponent(String(noteId))}`);
}
