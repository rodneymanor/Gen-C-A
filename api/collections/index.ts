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

    if (req.method === 'GET') {
      const result = await service.listCollections(userId);
      const response: Record<string, unknown> = {
        success: true,
        collections: result.collections,
        total: result.total,
      };
      if (Array.isArray(result.accessibleCoaches)) {
        response.accessibleCoaches = result.accessibleCoaches;
      }
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const { title, description = '' } = (req.body as any) || {};
      const collection = await service.createCollection(userId, { title, description });
      return res
        .status(201)
        .json({ success: true, message: 'Collection created successfully', collection });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return sendCollectionsError(res, error, 'Failed to process collections request', '[api/collections] error:');
  }
}
