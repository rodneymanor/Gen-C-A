import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleSaveCreatorAnalysis } from '../../src/api-routes/creator-analysis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleSaveCreatorAnalysis(req as any, res as any);
}

