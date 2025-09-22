import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveBrandVoicesService,
  sendBrandVoicesError,
} from '../_utils/brand-voices-service';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const service = resolveBrandVoicesService(res);
  if (!service) return;

  try {
    const voices = await service.listBrandVoices();
    res.status(200).json({ success: true, voices });
  } catch (error) {
    sendBrandVoicesError(res, error, 'Failed to load brand voices', '[api/brand-voices/list] error:');
  }
}
