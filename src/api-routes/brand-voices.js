// Use JS Firebase Admin utils compatible with Vercel runtime
import { getDb as getAdminDb } from './utils/firebase-admin.js';
import {
  BrandVoicesServiceError,
  getBrandVoicesService,
} from '../services/brand-voices/brand-voices-service.js';

function resolveService(res, onUnavailableMessage) {
  const db = getAdminDb();
  if (!db) {
    return {
      service: null,
      respondUnavailable() {
        res
          .status(500)
          .json({ success: false, error: onUnavailableMessage || 'Brand voices unavailable. Firestore not initialized.' });
      },
    };
  }

  try {
    return { service: getBrandVoicesService(db), respondUnavailable: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[brand-voices] failed to initialise service:', message);
    res.status(500).json({ success: false, error: 'Failed to initialise brand voices service.' });
    return { service: null, respondUnavailable: null };
  }
}

function handleServiceError(res, error, fallback) {
  if (error instanceof BrandVoicesServiceError) {
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  console.error('[brand-voices] unexpected error:', error);
  return res.status(500).json({ success: false, error: fallback });
}

export async function handleListBrandVoices(req, res) {
  try {
    const { service, respondUnavailable } = resolveService(
      res,
      'Brand voices unavailable. Firestore not initialized.',
    );
    if (!service) {
      respondUnavailable?.();
      return;
    }

    const voices = await service.listBrandVoices();
    return res.json({ success: true, voices });
  } catch (error) {
    console.error('List brand voices error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function handleGetBrandVoiceTemplates(req, res) {
  try {
    const creatorId = req.query?.creatorId || req.body?.creatorId;
    const brandVoiceId = req.query?.brandVoiceId || req.query?.voiceId || req.body?.brandVoiceId;
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const { service, respondUnavailable } = resolveService(
      res,
      'Brand voice templates unavailable. Firestore not initialized.',
    );
    if (!service) {
      respondUnavailable?.();
      return;
    }

    try {
      const result = await service.getTemplates({
        creatorId,
        brandVoiceId,
      });

      return res.json({ success: true, ...result });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load brand voice templates');
    }
  } catch (error) {
    console.error('Get brand voice templates error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function handleDeleteBrandVoice(req, res) {
  try {
    const secret = req.headers['x-internal-secret'] || req.body?.secret;
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const creatorId = req.body?.creatorId || req.query?.creatorId;
    const brandVoiceId = req.body?.brandVoiceId || req.body?.voiceId || req.query?.brandVoiceId || req.query?.voiceId;
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const { service, respondUnavailable } = resolveService(
      res,
      'Unable to delete brand voice. Firestore not initialized.',
    );
    if (!service) {
      respondUnavailable?.();
      return;
    }

    try {
      const deleted = await service.deleteBrandVoice({ creatorId, brandVoiceId });
      return res.json({ success: true, deleted });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to delete brand voice');
    }
  } catch (error) {
    console.error('Delete brand voice error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Admin: Update brand voice metadata (displayName, isShared, isDefault)
 * POST /api/brand-voices/update-meta
 * body: { creatorId, displayName?: string, isShared?: boolean, isDefault?: boolean }
 * auth: x-internal-secret header must match INTERNAL_API_SECRET
 */
export async function handleUpdateBrandVoiceMeta(req, res) {
  try {
    const secret = req.headers['x-internal-secret'] || req.body?.secret;
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { creatorId, displayName, isShared, isDefault, brandVoiceId, voiceId } = req.body || {};
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const { service, respondUnavailable } = resolveService(
      res,
      'Unable to update brand voice meta. Firestore not initialized.',
    );
    if (!service) {
      respondUnavailable?.();
      return;
    }

    try {
      await service.updateBrandVoiceMeta({
        creatorId,
        brandVoiceId: brandVoiceId || voiceId,
        displayName,
        isShared,
        isDefault,
        templates: req.body?.templates,
        styleSignature: req.body?.styleSignature,
        perTranscript: req.body?.perTranscript,
        videoMeta: req.body?.videoMeta,
      });

      return res.json({ success: true });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to update brand voice meta');
    }
  } catch (error) {
    console.error('Update brand voice meta error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
