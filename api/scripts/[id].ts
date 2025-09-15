import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetScriptById, handleUpdateScript, handleDeleteScript } from '../../src/api-routes/scripts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Inject params.id for handlers that expect Express-style params
  (req as any).params = { id: (req.query as any).id };

  if (req.method === 'GET') return handleGetScriptById(req as any, res as any);
  if (req.method === 'PUT') return handleUpdateScript(req as any, res as any);
  if (req.method === 'DELETE') return handleDeleteScript(req as any, res as any);
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

