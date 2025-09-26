import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractUserId,
  resolveUserId,
  resolveCollectionsService,
  sendCollectionsError,
} from '../_utils/collections-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const userId = (await resolveUserId(req)) || extractUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized: missing user context' });
  }

  const { collectionId, videoLimit } = (req.body as any) || {};

  try {
    const service = resolveCollectionsService();
    const result = await service.listCollectionVideos(userId, { collectionId, limit: videoLimit });
    return res.status(200).json({ success: true, videos: result.videos, totalCount: result.totalCount });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to fetch collection videos', '[api/videos/collection] error:');
  }
}
