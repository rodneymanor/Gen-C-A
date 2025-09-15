import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetUserCollections } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleGetUserCollections(req as any, res as any);
}

