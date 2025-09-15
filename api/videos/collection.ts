import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetCollectionVideos } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleGetCollectionVideos(req as any, res as any);
}

