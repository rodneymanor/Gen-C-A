import type { VercelRequest, VercelResponse } from '@vercel/node';

async function resolveUid(req: VercelRequest): Promise<string | null> {
  try {
    const { verifyBearer } = await import('../../src/api-routes/utils/firebase-admin.js');
    const bearer = await verifyBearer(req as any);
    if (bearer?.uid) return bearer.uid;
  } catch {}

  const apiKey = (req.headers['x-api-key'] as string) || (req.headers['X-Api-Key'] as any);
  const directUid = (req.headers['x-user-id'] as string) || (req.query?.userId as any);
  if (apiKey) {
    const raw = process.env.EXTENSION_API_KEYS;
    const map: Record<string, string> = {};
    if (raw) {
      raw.split(',').map(s => s.trim()).filter(Boolean).forEach(entry => {
        const [k, v] = entry.split(':');
        if (k && v) map[k.trim()] = v.trim();
      });
    }
    const expected = [process.env.API_KEY, process.env.NEXT_PUBLIC_API_KEY, process.env.ADMIN_API_KEY, process.env.INTERNAL_API_SECRET]
      .filter(Boolean) as string[];
    const mapped = map[apiKey];
    const fallback = directUid || mapped || process.env.DEFAULT_EXTENSION_USER_ID || process.env.ADMIN_DEFAULT_USER_ID;
    if (mapped || expected.includes(apiKey) || apiKey.startsWith('genc')) {
      if (fallback) return String(fallback);
    }
  }
  return directUid ? String(directUid) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const uid = await resolveUid(req);
  if (!uid) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { getDb } = await import('../../src/api-routes/utils/firebase-admin.js');
    const db = getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Firestore not initialized' });
    const { getCollectionsAdminService, CollectionsServiceError } = await import(
      '../../src/services/collections/collections-admin-service.js'
    );
    const service = getCollectionsAdminService(db);

    if (req.method === 'GET') {
      const result = await service.listCollections(uid);
      return res.status(200).json({ success: true, ...result, user: { id: uid } });
    }

    if (req.method === 'POST') {
      const body = (req.body as any) || {};
      const title = String(body.title || '').trim();
      const description = String(body.description || '');
      if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
      const collection = await service.createCollection(uid, { title, description });
      return res.status(201).json({ success: true, message: 'Collection created successfully', collection });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Failed to process extension collections request';
    console.error('[api/chrome-extension/collections] error:', message);
    return res.status(status).json({ success: false, error: message });
  }
}

