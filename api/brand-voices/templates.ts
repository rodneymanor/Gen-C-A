import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGetBrandVoiceTemplates } from '../../src/api-routes/brand-voices.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleGetBrandVoiceTemplates(req as any, res as any);
}

