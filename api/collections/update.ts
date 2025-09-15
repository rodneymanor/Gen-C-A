import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpdateCollection } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleUpdateCollection(req as any, res as any);
}

