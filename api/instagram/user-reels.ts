import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleInstagramReels } from '../../src/api-routes/creators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleInstagramReels(req as any, res as any);
}

