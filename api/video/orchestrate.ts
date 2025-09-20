import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVideoWorkflow } from '../../src/api-routes/videos/orchestrate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleVideoWorkflow(req as any, res as any);
}
