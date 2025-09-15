import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleListBrandVoices } from '../../src/api-routes/brand-voices.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleListBrandVoices(req as any, res as any);
}

