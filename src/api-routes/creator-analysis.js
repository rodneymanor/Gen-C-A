// Load Firebase Admin compatibly in dev (TS) and prod (bundled JS)
import { getDb as getAdminDb } from './utils/firebase-admin.js';
import {
  CreatorAnalysisServiceError,
  getCreatorAnalysisService,
} from '../services/creator/creator-analysis-service.js';

export async function handleSaveCreatorAnalysis(req, res) {
  try {
    const db = getAdminDb();
    const service = getCreatorAnalysisService(db || null);

    try {
      const result = await service.saveAnalysis(req.body ?? {});
      return res.json({ success: true, ...result });
    } catch (error) {
      if (error instanceof CreatorAnalysisServiceError) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      console.error('Save analysis error:', error);
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  } catch (error) {
    console.error('Save analysis error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
