import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleInstagramUserId } from '../../src/api-routes/videos/instagram-user-id.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleInstagramUserId(req as any, res as any);
}
