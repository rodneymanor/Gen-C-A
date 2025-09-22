import {
  getVideoOrchestratorService,
  VideoOrchestratorServiceError,
} from '../../services/video/video-orchestrator-service.js';

export async function handleVideoWorkflow(req, res) {
  try {
    const service = getVideoOrchestratorService();
    const result = await service.orchestrateWorkflow(req.body || {});
    return res.json(result);
  } catch (error) {
    if (error instanceof VideoOrchestratorServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) });
    }
    console.error('[video/orchestrate] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to orchestrate video workflow',
    });
  }
}
