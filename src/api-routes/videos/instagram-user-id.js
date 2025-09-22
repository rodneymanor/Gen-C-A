import { getInstagramService, InstagramServiceError } from '../../services/video/instagram-service.js';

export async function handleInstagramUserId(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const source = method === 'GET' ? req.query || {} : req.body || {};
    const service = getInstagramService();
    const result = await service.getUserId(source.username || source.handle || source.user || source.id);
    return res.json(result);
  } catch (error) {
    if (error instanceof InstagramServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) });
    }
    console.error('❌ [USER-ID] Error resolving Instagram user ID:', error);
    return res.status(500).json({ success: false, error: 'Failed to resolve Instagram user ID' });
  }
}

export default handleInstagramUserId;
