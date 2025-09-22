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

  const { videoId, targetCollectionId } = (req.body as any) || {};
  if (!videoId || typeof targetCollectionId === 'undefined') {
    return res
      .status(400)
      .json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
  }

  try {
    const service = resolveCollectionsService();
    const result = await service.copyVideo(userId, { videoId, targetCollectionId });
    return res
      .status(200)
      .json({ success: true, message: 'Video copied successfully', newVideoId: result.newVideoId });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to copy video', '[api/collections/copy-video] error:');
  }
}
