import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveBrandVoicesService,
  sendBrandVoicesError,
} from '../_utils/brand-voices-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const secret = req.headers['x-internal-secret'] || req.body?.secret;
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const service = resolveBrandVoicesService(res);
  if (!service) return;

  const creatorSource = req.body?.creatorId ?? req.query?.creatorId;
  const brandSource =
    req.body?.brandVoiceId ?? req.body?.voiceId ?? req.query?.brandVoiceId ?? req.query?.voiceId;

  try {
    const deleted = await service.deleteBrandVoice({
      creatorId: creatorSource != null ? String(creatorSource) : undefined,
      brandVoiceId: brandSource != null ? String(brandSource) : undefined,
    });
    res.status(200).json({ success: true, deleted });
  } catch (error) {
    sendBrandVoicesError(res, error, 'Failed to delete brand voice', '[api/brand-voices/delete] error:');
  }
}
