import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleBatchVoiceAnalysis } from '../../src/api-routes/voice/analyze-batch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleBatchVoiceAnalysis(req as any, res as any);
}
