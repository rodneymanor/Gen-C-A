import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleHealthCheck } from '../src/api-routes/creators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleHealthCheck(req as any, res as any);
}

