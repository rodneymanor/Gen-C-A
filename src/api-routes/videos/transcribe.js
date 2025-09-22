import {
  getVideoTranscriptionService,
  VideoTranscriptionServiceError,
} from '../../services/video/video-transcription-service.js';

export async function handleVideoTranscribe(req, res) {
  try {
    const service = getVideoTranscriptionService();
    const result = await service.transcribeFromUrl(req.body || {});
    return res.json(result);
  } catch (error) {
    if (error instanceof VideoTranscriptionServiceError) {
      console.error('[video/transcribe] Service error:', error.message);
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(error.debug ? { debug: error.debug } : {}),
      });
    }
    console.error('[video/transcribe] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
