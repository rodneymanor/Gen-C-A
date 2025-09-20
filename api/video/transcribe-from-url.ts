import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVideoTranscribe } from '../../src/api-routes/videos/transcribe.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleVideoTranscribe(req as any, res as any);
}
