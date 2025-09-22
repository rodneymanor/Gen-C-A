import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseTikTokFeedRequest,
  resolveTikTokFeedService,
  sendTikTokFeedError,
} from '../_utils/tiktok-feed-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveTikTokFeedService();
    const { username, count } = parseTikTokFeedRequest(req);
    const result = await service.fetchUserFeed({ username, count: Number(count) });
    return res.status(200).json(result);
  } catch (error) {
    return sendTikTokFeedError(res, error, 'Failed to fetch TikTok user feed', '[api/tiktok/user-feed] error:');
  }
}
