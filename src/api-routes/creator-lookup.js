// Load Firebase Admin compatibly in dev (TS) and prod (bundled JS)
import { getDb as getAdminDb } from './utils/firebase-admin.js';
import {
  CreatorLookupServiceError,
  getCreatorLookupService,
} from '../services/creator/creator-lookup-service.js';

/**
 * GET /api/creator/analyzed-video-ids?handle=foo
 * Returns list of videoIds already analyzed for a creator (from scriptStructures)
 */
export async function handleListAnalyzedVideoIds(req, res) {
  try {
    const db = getAdminDb();
    const service = getCreatorLookupService(db || null);
    const handle = req.query?.handle || req.query?.creator || null;
    const creatorId = req.query?.creatorId || null;

    try {
      const videoIds = await service.listAnalyzedVideoIds({
        handle: handle != null ? String(handle) : undefined,
        creatorId: creatorId != null ? String(creatorId) : undefined,
      });
      return res.json({ success: true, videoIds });
    } catch (error) {
      if (error instanceof CreatorLookupServiceError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('List analyzed video ids error:', error);
      return res.status(500).json({ success: false, error: 'Failed to list analyzed videos' });
    }
  } catch (error) {
    console.error('List analyzed video ids error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list analyzed videos' });
  }
}
