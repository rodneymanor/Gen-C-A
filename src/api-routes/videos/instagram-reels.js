import { getInstagramService, InstagramServiceError } from '../../services/video/instagram-service.js';

export async function handleInstagramReels(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const source = method === 'GET' ? req.query || {} : req.body || {};
    const service = getInstagramService();

    const result = await service.getUserReels({
      userId: source.user_id || source.userId || source.id || source.username || source.handle,
      count: source.count || source.limit,
      includeFeedVideo:
        source.include_feed_video !== undefined || source.includeFeedVideo !== undefined
          ? String(source.include_feed_video ?? source.includeFeedVideo).toLowerCase() !== 'false'
          : true,
      username: source.username,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof InstagramServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) });
    }
    console.error('❌ [REELS] Error fetching Instagram reels:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch Instagram reels' });
  }
}

export default handleInstagramReels;
