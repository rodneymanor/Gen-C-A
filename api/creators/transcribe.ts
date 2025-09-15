import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCreatorTranscription } from '../../src/api-routes/creators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCreatorTranscription(req as any, res as any);
}

