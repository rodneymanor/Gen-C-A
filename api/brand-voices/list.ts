import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { getDb } = await import('../../src/api-routes/utils/firebase-admin.js');
    const db = getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Firestore not initialized' });
    }
    const { getBrandVoicesService, BrandVoicesServiceError } = await import(
      '../../src/services/brand-voices/brand-voices-service.js'
    );
    const service = getBrandVoicesService(db);
    const voices = await service.listBrandVoices();
    return res.status(200).json({ success: true, voices });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Failed to load brand voices';
    console.error('[api/brand-voices/list] error:', message);
    return res.status(status).json({ success: false, error: message });
  }
}
