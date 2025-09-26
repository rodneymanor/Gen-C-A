import type { VercelRequest, VercelResponse } from '@vercel/node';
import { debugLogRequest } from '../_utils/request-logger';
import { proxyToBackend } from '../_utils/backend-proxy';

// TEMP SHIM: Delegate to canonical backend implementation.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  debugLogRequest(req, 'collections/index:proxy');
  return proxyToBackend(req, res, '/api/collections');
}
