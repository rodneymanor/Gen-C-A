import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseReelsRequest,
  resolveInstagramService,
  sendInstagramError,
} from '../_utils/instagram-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveInstagramService();
    const result = await service.getUserReels(parseReelsRequest(req));
    return res.status(200).json(result);
  } catch (error) {
    return sendInstagramError(res, error, 'Failed to fetch Instagram reels', '[api/instagram/user-reels] error:');
  }
}
