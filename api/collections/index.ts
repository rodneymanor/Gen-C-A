import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetCollections, handleCreateCollection } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleGetCollections(req as any, res as any);
  if (req.method === 'POST') return handleCreateCollection(req as any, res as any);
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

