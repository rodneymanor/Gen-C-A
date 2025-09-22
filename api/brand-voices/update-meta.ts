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

  const {
    creatorId,
    brandVoiceId,
    voiceId,
    displayName,
    isShared,
    isDefault,
    templates,
    styleSignature,
    perTranscript,
    videoMeta,
  } = (req.body ?? {}) as Record<string, unknown>;

  try {
    await service.updateBrandVoiceMeta({
      creatorId: creatorId != null ? String(creatorId) : undefined,
      brandVoiceId:
        brandVoiceId != null
          ? String(brandVoiceId)
          : voiceId != null
            ? String(voiceId)
            : undefined,
      displayName,
      isShared,
      isDefault,
      templates,
      styleSignature,
      perTranscript,
      videoMeta,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    sendBrandVoicesError(res, error, 'Failed to update brand voice meta', '[api/brand-voices/update-meta] error:');
  }
}
