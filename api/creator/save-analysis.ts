import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyToBackend } from '../_utils/backend-proxy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  return proxyToBackend(req, res, '/api/creator/save-analysis');
}
