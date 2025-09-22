import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractUserId,
  resolveCollectionsService,
  sendCollectionsError,
} from '../_utils/collections-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = extractUserId(req);
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
  }

  try {
    const service = resolveCollectionsService();
    const result = await service.listCollections(userId);

    return res.status(200).json({
      success: true,
      collections: result.collections,
      accessibleCoaches: result.accessibleCoaches,
      total: result.total,
    });
  } catch (error) {
    return sendCollectionsError(
      res,
      error,
      'Failed to fetch user collections',
      '[api/collections/user-collections] error:'
    );
  }
}
