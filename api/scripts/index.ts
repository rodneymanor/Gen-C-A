import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetScripts, handleCreateScript } from '../../src/api-routes/scripts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleGetScripts(req as any, res as any);
  if (req.method === 'POST') return handleCreateScript(req as any, res as any);
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

