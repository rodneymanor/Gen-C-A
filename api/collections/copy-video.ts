import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCopyVideo } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCopyVideo(req as any, res as any);
}

