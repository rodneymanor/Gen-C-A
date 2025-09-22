import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveCreatorLookupService,
  sendCreatorLookupError,
} from '../_utils/creator-lookup-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const service = resolveCreatorLookupService();
  const source = (req.method === 'GET' ? req.query : req.body) as Record<string, unknown>;
  const handle = source?.handle ?? source?.creator ?? source?.username;
  const creatorId = source?.creatorId ?? source?.id;

  try {
    const videoIds = await service.listAnalyzedVideoIds({
      handle: handle != null ? String(handle) : undefined,
      creatorId: creatorId != null ? String(creatorId) : undefined,
    });
    res.status(200).json({ success: true, videoIds });
  } catch (error) {
    sendCreatorLookupError(
      res,
      error,
      'Failed to list analyzed videos',
      '[api/creator/analyzed-video-ids] error:',
    );
  }
}
