import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDeleteBrandVoice } from '../../src/api-routes/brand-voices.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleDeleteBrandVoice(req as any, res as any);
}

