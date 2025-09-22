import { rapidApiFetch } from '@/api-routes/videos/rapidapi-rate-limit.js';
import { processInstagramReels } from '@/lib/instagram-reels-processor.js';

class InstagramServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'InstagramServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function sanitizeUsername(input) {
  if (!input) return '';
  const value = Array.isArray(input) ? input[0] : input;
  return String(value)
    .trim()
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0];
}

class InstagramService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.RAPIDAPI_KEY || process.env.INSTAGRAM_RAPIDAPI_KEY;
    this.apiHost = 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com';
  }

  ensureApiKey() {
    if (!this.apiKey) {
      throw new InstagramServiceError('RapidAPI key is not configured on the server', 500);
    }
  }

  async getUserId(usernameInput) {
    const username = sanitizeUsername(usernameInput);
    if (!username) {
      throw new InstagramServiceError('Username is required to resolve an Instagram user ID', 400);
    }

    this.ensureApiKey();

    const response = await rapidApiFetch(
      `https://${this.apiHost}/user_id_by_username?username=${encodeURIComponent(username)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey,
        },
      },
      'instagram user-id lookup',
    );

    const rawText = await response.text();
    let json;
    if (rawText) {
      try {
        json = JSON.parse(rawText);
      } catch (error) {
        console.warn('⚠️ [InstagramService] Received non-JSON response from RapidAPI:', rawText);
      }
    }

    if (!response.ok) {
      const message = (json && (json.error || json.message)) || `RapidAPI request failed with status ${response.status}`;
      throw new InstagramServiceError(message, response.status, { rawError: rawText });
    }

    const userId = json && (json.UserID ?? json.user_id ?? json.id);
    const resolvedUsername = json && (json.UserName || json.username || username);

    if (!userId) {
      throw new InstagramServiceError('Instagram user ID not found for the provided username', 404);
    }

    return {
      success: true,
      user_id: userId,
      username: resolvedUsername,
    };
  }

  async getUserReels(params = {}) {
    const { userId, count, includeFeedVideo = true, username } = params;
    const sanitizedUserId = sanitizeUsername(userId);

    if (!sanitizedUserId) {
      throw new InstagramServiceError('User ID is required', 400);
    }

    this.ensureApiKey();

    const reelsUrl = new URL(`https://${this.apiHost}/reels`);
    reelsUrl.searchParams.set('user_id', sanitizedUserId);
    reelsUrl.searchParams.set('include_feed_video', includeFeedVideo ? 'true' : 'false');

    const response = await rapidApiFetch(
      reelsUrl.toString(),
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': this.apiHost,
          'x-rapidapi-key': this.apiKey,
        },
      },
      'instagram reels fetch',
    );

    const rawText = await response.text();
    let json;
    if (rawText) {
      try {
        json = JSON.parse(rawText);
      } catch (error) {
        console.warn('⚠️ [InstagramService] Received non-JSON response from RapidAPI:', rawText);
      }
    }

    if (!response.ok) {
      const message = (json && (json.error || json.message)) || `RapidAPI request failed with status ${response.status}`;
      throw new InstagramServiceError(message, response.status, { rawError: rawText });
    }

    if (!json || !json.data) {
      throw new InstagramServiceError('Invalid response from Instagram API', 502);
    }

    const items = Array.isArray(json.data.items) ? json.data.items : [];
    const limitedItems = count ? items.slice(0, Math.max(1, Number(count) || 0)) : items;
    const responseData = {
      ...json.data,
      items: limitedItems,
    };

    const processed = processInstagramReels(limitedItems, username, count);

    return {
      success: true,
      status: json.status,
      data: responseData,
      processed,
    };
  }
}

const SERVICE_INSTANCE_KEY = '__instagramService__';

function getInstagramService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new InstagramService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { InstagramService, InstagramServiceError, getInstagramService };
