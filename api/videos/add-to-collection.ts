import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAddVideoToCollection } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAddVideoToCollection(req as any, res as any);
}

