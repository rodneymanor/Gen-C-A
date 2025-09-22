import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  extractUserId,
  resolveCollectionsService,
  sendCollectionsError,
  isApiKeyValid,
} from '../_utils/collections-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!isApiKeyValid(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = extractUserId(req);
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
  }

  const collectionId = (req.query?.collectionId || (req.body as any)?.collectionId) as string | undefined;
  if (!collectionId) {
    return res.status(400).json({ success: false, error: 'collectionId required' });
  }

  try {
    const service = resolveCollectionsService();
    await service.deleteCollection(userId, String(collectionId));
    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
      collectionId: String(collectionId),
    });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to delete collection', '[api/collections/delete] error:');
  }
}
