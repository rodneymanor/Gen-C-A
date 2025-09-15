import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDeleteCollection } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleDeleteCollection(req as any, res as any);
}

