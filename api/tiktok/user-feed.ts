import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleTikTokUserFeed } from '../../src/api-routes/tiktok.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleTikTokUserFeed(req as any, res as any);
}

