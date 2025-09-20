import { rapidApiFetch } from './rapidapi-rate-limit.js';
import { processInstagramReels } from '../../lib/instagram-reels-processor.js';

/**
 * Route handler: Fetch Instagram reels for a user via RapidAPI.
 */
export async function handleInstagramReels(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const query = req.query || {};
    const body = req.body || {};

    const rawUserId =
      (method === 'GET'
        ? query.user_id || query.userId || query.id || query.username || query.handle
        : body.user_id || body.userId || body.id || body.username || body.handle) ||
      null;

    if (!rawUserId || (typeof rawUserId === 'string' && rawUserId.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userId = Array.isArray(rawUserId) ? String(rawUserId[0]).trim() : String(rawUserId).trim();

    const countParam = method === 'GET' ? query.count || query.limit : body.count || body.limit;
    const count = countParam ? Math.max(1, Number(countParam) || 0) : undefined;

    const includeFeedVideoParam = method === 'GET'
      ? query.include_feed_video || query.includeFeedVideo
      : body.include_feed_video || body.includeFeedVideo;
    const includeFeedVideo = includeFeedVideoParam !== undefined
      ? String(includeFeedVideoParam).toLowerCase() !== 'false'
      : true;

    const apiHost = 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY || process.env.INSTAGRAM_RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'RapidAPI key is not configured on the server'
      });
    }

    const reelsUrl = new URL(`https://${apiHost}/reels`);
    reelsUrl.searchParams.set('user_id', userId);
    reelsUrl.searchParams.set('include_feed_video', includeFeedVideo ? 'true' : 'false');

    console.log(`🎬 [REELS] Fetching reels for user: ${userId} (include_feed_video=${includeFeedVideo})`);

    const response = await rapidApiFetch(
      reelsUrl.toString(),
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': apiHost,
          'x-rapidapi-key': apiKey
        }
      },
      'instagram reels fetch'
    );

    const rawText = await response.text();
    let json;

    if (rawText) {
      try {
        json = JSON.parse(rawText);
      } catch (error) {
        console.warn('⚠️ [REELS] Received non-JSON response from RapidAPI:', rawText);
      }
    }

    if (!response.ok) {
      const message = (json && (json.error || json.message)) || `RapidAPI request failed with status ${response.status}`;
      return res.status(response.status).json({
        success: false,
        error: message,
        details: rawText || undefined
      });
    }

    if (!json || !json.data) {
      return res.status(502).json({
        success: false,
        error: 'Invalid response from Instagram API'
      });
    }

    const items = Array.isArray(json.data.items) ? json.data.items : [];
    const limitedItems = count ? items.slice(0, count) : items;
    const responseData = {
      ...json.data,
      items: limitedItems
    };

    const resolvedUsername = (() => {
      if (method === 'GET') {
        return typeof req.query?.username === 'string' ? req.query.username : undefined;
      }
      const bodyUsername = req.body?.username;
      return typeof bodyUsername === 'string' ? bodyUsername : undefined;
    })();

    const processed = processInstagramReels(limitedItems, resolvedUsername, count);

    return res.json({
      success: true,
      status: json.status,
      data: responseData,
      processed
    });
  } catch (error) {
    console.error('❌ [REELS] Error fetching Instagram reels:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Instagram reels',
      details: error.message
    });
  }
}

export default handleInstagramReels;
