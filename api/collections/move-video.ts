import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMoveVideo } from '../../src/api-routes/collections.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleMoveVideo(req as any, res as any);
}

