import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractUserId,
  resolveCollectionsService,
  sendCollectionsError,
} from '../_utils/collections-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const userId = extractUserId(req);
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
  }

  const { collectionId, videoData } = (req.body as any) || {};
  if (!collectionId || !videoData || !videoData.originalUrl) {
    return res
      .status(400)
      .json({ success: false, error: 'collectionId and videoData.originalUrl are required' });
  }

  try {
    const service = resolveCollectionsService();
    const result = await service.addVideoToCollection(userId, { collectionId, videoData });
    return res.status(201).json({ success: true, videoId: result.videoId, video: result.video });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to add video to collection', '[api/videos/add-to-collection] error:');
  }
}
