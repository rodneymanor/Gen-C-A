import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVoiceAnalyzePatterns } from '../../src/api-routes/voice.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleVoiceAnalyzePatterns(req as any, res as any);
}

