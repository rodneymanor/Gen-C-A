import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVideoScrape } from '../../src/api-routes/videos/scrape-url.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleVideoScrape(req as any, res as any);
}
