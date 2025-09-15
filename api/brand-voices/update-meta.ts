import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpdateBrandVoiceMeta } from '../../src/api-routes/brand-voices.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleUpdateBrandVoiceMeta(req as any, res as any);
}

