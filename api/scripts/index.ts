import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { getDb, verifyBearer } = await import('../../src/api-routes/utils/firebase-admin.js');
    const auth = await verifyBearer(req as any);
    if (!auth) return res.status(401).json({ success: false, error: 'Authentication required' });

    const db = getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Content service unavailable' });

    const { getScriptsService, ScriptsServiceError } = await import(
      '../../src/services/scripts/scripts-service.js'
    );
    const service = getScriptsService(db);

    if (req.method === 'GET') {
      const scripts = await service.listScripts(auth.uid);
      return res.status(200).json({ success: true, scripts });
    }
    if (req.method === 'POST') {
      const script = await service.createScript(auth.uid, (req.body as any) || {});
      return res.status(201).json({ success: true, script });
    }
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Failed to process scripts request';
    console.error('[api/scripts] error:', message);
    return res.status(status).json({ success: false, error: message });
  }
}
