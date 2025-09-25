import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const headerValue = (req.headers['x-user-id'] as string) || (req.headers['X-User-Id'] as any);
  const queryValue = (req.query?.userId as any) || undefined;
  const bodyValue = typeof req.body === 'object' && req.body !== null ? (req.body as any).userId : undefined;
  const userId = (headerValue || queryValue || bodyValue) && String(headerValue || queryValue || bodyValue);

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId required (x-user-id or query/body param)' });
  }

  try {
    const { getDb } = await import('../../src/api-routes/utils/firebase-admin.js');
    const db = getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Firestore not initialized' });

    const { getCollectionsAdminService, CollectionsServiceError } = await import(
      '../../src/services/collections/collections-admin-service.js'
    );
    const service = getCollectionsAdminService(db);

    if (req.method === 'GET') {
      const result = await service.listCollections(userId);
      const response: Record<string, unknown> = {
        success: true,
        collections: result.collections,
        total: result.total,
      };
      if (Array.isArray(result.accessibleCoaches)) response.accessibleCoaches = result.accessibleCoaches;
      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const { title, description = '' } = (req.body as any) || {};
      const collection = await service.createCollection(userId, { title, description });
      return res.status(201).json({ success: true, message: 'Collection created successfully', collection });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Failed to process collections request';
    console.error('[api/collections] error:', message);
    return res.status(status).json({ success: false, error: message });
  }
}
