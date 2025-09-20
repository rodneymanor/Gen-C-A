import { rapidApiFetch } from './rapidapi-rate-limit.js';

/**
 * Route handler: Convert an Instagram handle to its numeric user ID via RapidAPI.
 */
export async function handleInstagramUserId(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const query = req.query || {};
    const body = req.body || {};

    const rawUsername =
      (method === 'GET' ? query.username || query.handle || query.user : body.username || body.handle || body.user) ||
      body.username ||
      body.handle;

    if (!rawUsername || (typeof rawUsername === 'string' && rawUsername.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Username is required to resolve an Instagram user ID'
      });
    }

    const usernameString = Array.isArray(rawUsername) ? rawUsername[0] : String(rawUsername);
    // Trim URL noise and leading '@' so we always hit the RapidAPI endpoint with a clean handle.
    const sanitized = usernameString
      .trim()
      .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0];

    if (!sanitized) {
      return res.status(400).json({
        success: false,
        error: 'Unable to parse a valid Instagram username from the provided input'
      });
    }

    const apiHost = 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com';
    const apiKey = process.env.RAPIDAPI_KEY || process.env.INSTAGRAM_RAPIDAPI_KEY || '7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'RapidAPI key is not configured on the server'
      });
    }

    console.log(`📸 [USER-ID] Resolving Instagram username → ID: ${sanitized}`);

    // Fetch the normalized user record and propagate HTTP errors through to the caller.
    const response = await rapidApiFetch(
      `https://${apiHost}/user_id_by_username?username=${encodeURIComponent(sanitized)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': apiHost,
          'x-rapidapi-key': apiKey
        }
      },
      'instagram user-id lookup'
    );

    const rawText = await response.text();
    let json;

    if (rawText) {
      try {
        json = JSON.parse(rawText);
      } catch (error) {
        console.warn('⚠️ [USER-ID] Received non-JSON response from RapidAPI:', rawText);
      }
    }

    if (!response.ok) {
      // Relay the upstream error payload so the frontend can surface actionable feedback.
      const message = (json && (json.error || json.message)) || `RapidAPI request failed with status ${response.status}`;
      return res.status(response.status).json({
        success: false,
        error: message,
        details: rawText || undefined
      });
    }

    const userId = json && (json.UserID ?? json.user_id ?? json.id);
    const resolvedUsername = json && (json.UserName || json.username || sanitized);

    if (!userId) {
      return res.status(404).json({
        success: false,
        error: 'Instagram user ID not found for the provided username'
      });
    }

    return res.json({
      success: true,
      user_id: userId,
      username: resolvedUsername
    });
  } catch (error) {
    console.error('❌ [USER-ID] Error resolving Instagram user ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve Instagram user ID',
      details: error.message
    });
  }
}

export default handleInstagramUserId;
