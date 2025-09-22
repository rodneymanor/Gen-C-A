import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  resolveCreatorAnalysisService,
  sendCreatorAnalysisError,
} from '../_utils/creator-analysis-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const service = resolveCreatorAnalysisService();

  try {
    const result = await service.saveAnalysis(req.body ?? {});
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendCreatorAnalysisError(res, error, 'Failed to save creator analysis', '[api/creator/save-analysis] error:');
  }
}
