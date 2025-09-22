import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveBrandVoicesService,
  sendBrandVoicesError,
} from '../_utils/brand-voices-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const service = resolveBrandVoicesService(res);
  if (!service) return;

  const source = (req.method?.toUpperCase() === 'GET' ? req.query : req.body) as Record<string, unknown>;
  const creatorCandidate = source?.creatorId ?? source?.creator ?? source?.id;
  const brandCandidate = source?.brandVoiceId ?? source?.voiceId;

  try {
    const result = await service.getTemplates({
      creatorId: creatorCandidate != null ? String(creatorCandidate) : undefined,
      brandVoiceId: brandCandidate != null ? String(brandCandidate) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendBrandVoicesError(res, error, 'Failed to load brand voice templates', '[api/brand-voices/templates] error:');
  }
}
