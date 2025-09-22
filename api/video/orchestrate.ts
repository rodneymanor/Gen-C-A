import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseOrchestratorRequest,
  resolveVideoOrchestratorService,
  sendOrchestratorError,
} from '../_utils/video-orchestrator-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const service = resolveVideoOrchestratorService();
    const result = await service.orchestrateWorkflow(parseOrchestratorRequest(req));
    return res.status(200).json(result);
  } catch (error) {
    return sendOrchestratorError(
      res,
      error,
      'Failed to orchestrate video workflow',
      '[api/video/orchestrate] error:',
    );
  }
}
