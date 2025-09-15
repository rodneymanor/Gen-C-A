import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleListAnalyzedVideoIds } from '../../src/api-routes/creator-lookup.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleListAnalyzedVideoIds(req as any, res as any);
}

