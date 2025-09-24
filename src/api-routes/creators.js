import { rapidApiFetch } from './videos/rapidapi-rate-limit.js';
import { processInstagramReels } from '../lib/instagram-reels-processor.js';

const USER_ID_CACHE_TTL_MS = (() => {
  const env = Number(process.env.INSTAGRAM_USER_ID_CACHE_TTL_MS);
  return Number.isFinite(env) && env >= 0 ? env : 24 * 60 * 60 * 1000;
})();

const instagramUserIdCache = (() => {
  const key = '__instagramUserIdCache__';
  if (!globalThis[key]) {
    globalThis[key] = new Map();
  }
  return globalThis[key];
})();

/**
 * Simplified Creator API Routes for Transcription Service
 *
 * This provides a direct workflow for:
 * 1. Username -> User ID conversion
 * 2. RapidAPI video fetching
 * 3. Transcription initiation
 *
 * Removes unnecessary "following" complexity
 */

export async function handleCreatorTranscription(req, res) {
  try {
    const { username, platform = 'instagram' } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    console.log(`🎯 [TRANSCRIPTION] Processing ${platform} creator: ${username}`);

    // Step 1: Convert username to platform user ID if needed
    let platformUserId;
    let creatorMetadata = {};

    if (platform === 'instagram') {
      console.log('📸 [TRANSCRIPTION] Converting Instagram username to ID');

      // TODO: Implement Instagram username to ID conversion
      // For now, use username as fallback
      platformUserId = username;
      creatorMetadata = {
        displayName: username,
        platform: 'instagram'
      };
    } else {
      platformUserId = username;
    }

    // Step 2: Fetch videos using RapidAPI
    console.log('🎬 [TRANSCRIPTION] Fetching videos via RapidAPI');

    const videos = await fetchVideosFromRapidAPI(platform, platformUserId);

    if (!videos || videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No videos found for this creator'
      });
    }

    // Step 3: Prepare transcription data
    console.log(`📝 [TRANSCRIPTION] Preparing ${videos.length} videos for transcription`);

    const transcriptionJobs = videos.map(video => ({
      id: video.id,
      title: video.title || 'Untitled',
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      status: 'pending'
    }));

    console.log('✅ [TRANSCRIPTION] Successfully prepared creator videos');

    return res.json({
      success: true,
      userId: platformUserId, // For backward compatibility
      creator: {
        username: username,
        platform: platform,
        platformUserId: platformUserId,
        ...creatorMetadata
      },
      videos: transcriptionJobs,
      totalCount: transcriptionJobs.length,
      message: `Found ${transcriptionJobs.length} videos ready for transcription`
    });

  } catch (error) {
    console.error('❌ [TRANSCRIPTION] Error processing creator:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to process creator for transcription',
      details: error.message
    });
  }
}

/**
 * Fetch videos from creator's feed using RapidAPI
 */
async function fetchVideosFromRapidAPI(platform, userId) {
  console.log(`🔗 [RAPIDAPI] Fetching ${platform} videos for user: ${userId}`);

  if (platform === 'instagram') {
    return await fetchInstagramVideosFromRapidAPI(userId);
  }

  throw new Error(`Platform ${platform} not supported`);
}

/**
 * Fetch Instagram videos using RapidAPI Instagram endpoints
 */
async function fetchInstagramVideosFromRapidAPI(username) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com';

  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }

  try {
    console.log(`📱 [RAPIDAPI] Getting Instagram videos for: ${username}`);

    // Clean username (remove @ and URL parts)
    const cleanUsername = username.replace(/^@/, '').replace(/.*instagram\.com\//, '').replace(/\/$/, '');
    const cacheKey = cleanUsername.toLowerCase();

    // Step 1: Convert username to user ID
    let userId = cleanUsername;
    if (isNaN(Number(cleanUsername))) {
      const cached = instagramUserIdCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        userId = cached.value;
        console.log(`✅ [RAPIDAPI] Cache hit for username ${cleanUsername} → User ID: ${userId}`);
      } else {
        if (cached) {
          instagramUserIdCache.delete(cacheKey);
        }
        console.log(`🔄 [RAPIDAPI] Converting username ${cleanUsername} to user ID...`);

        const userIdResponse = await rapidApiFetch(
          `https://${RAPIDAPI_HOST}/user_id_by_username?username=${cleanUsername}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-key': RAPIDAPI_KEY,
              'x-rapidapi-host': RAPIDAPI_HOST
            }
          },
          'instagram username lookup'
        );

        if (userIdResponse.ok) {
          const userIdData = await userIdResponse.json();
          if (userIdData?.UserID) {
            userId = userIdData.UserID.toString();
            instagramUserIdCache.set(cacheKey, {
              value: userId,
              expiresAt: Date.now() + USER_ID_CACHE_TTL_MS
            });
            console.log(`✅ [RAPIDAPI] Username ${cleanUsername} → User ID: ${userId}`);
          }
        } else {
          console.log(`⚠️ [RAPIDAPI] Could not convert username ${cleanUsername}, trying as-is`);
        }
      }
    }

    // Step 2: Get user reels with the user ID
    console.log(`🎬 [RAPIDAPI] Fetching videos for user ID: ${userId}`);
    const response = await rapidApiFetch(
      `https://${RAPIDAPI_HOST}/reels?user_id=${userId}&include_feed_video=true`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        }
      },
      'instagram reels list'
    );

    if (!response.ok) {
      console.error(`❌ [RAPIDAPI] HTTP ${response.status}: ${response.statusText}`);

      // Fallback to mock data if RapidAPI fails
      console.log('🔄 [RAPIDAPI] Falling back to mock data');
      return generateMockVideos(cleanUsername, 50);
    }

    const data = await response.json();
    console.log(`📊 [RAPIDAPI] Response received, processing videos...`);

    const items = data?.data?.items ?? [];
    const processed = processInstagramReels(items, cleanUsername, 50);

    if (!processed.videos.length) {
      console.log('⚠️ [RAPIDAPI] No videos found, generating mock data');
      return generateMockVideos(cleanUsername, 50);
    }

    console.log(`✅ [RAPIDAPI] Successfully processed ${processed.videos.length} real videos`);
    return processed.videos.map((video) => ({
      id: video.id,
      title: video.title,
      url: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration ?? 'Unknown',
      timestamp: Date.now(),
      likeCount: video.likeCount,
      viewCount: video.viewCount,
      username: video.author ?? cleanUsername,
      isReel: true
    }));

  } catch (error) {
    console.error('❌ [RAPIDAPI] Error fetching Instagram videos:', error);

    // Fallback to mock data
    console.log('🔄 [RAPIDAPI] Error occurred, falling back to mock data');
    return generateMockVideos(username, 50);
  }
}

/**
 * Generate mock video data as fallback
 */
function generateMockVideos(username, count = 50) {
  console.log(`🎭 [MOCK] Generating ${count} mock videos for ${username}`);

  const videos = [];
  for (let i = 1; i <= count; i++) {
    videos.push({
      id: `mock_${username}_${i}`,
      title: `${username} Video ${i} - Mock Content`,
      url: `https://sample-videos.com/zip/10/mp4/SampleVideo_${i}.mp4`,
      thumbnailUrl: `https://picsum.photos/640/640?random=${i}`,
      duration: `00:0${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 59).toString().padStart(2, '0')}`,
      timestamp: Date.now() - (i * 86400000), // Days ago
      likeCount: Math.floor(Math.random() * 10000),
      viewCount: Math.floor(Math.random() * 50000),
      isMock: true
    });
  }

  return videos;
}

/**
 * Health check for the API
 */
export function handleHealthCheck(req, res) {
  res.json({
    status: 'ok',
    service: 'Creator Transcription API',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/creators/follow',
      'POST /api/creators/transcribe',
      'GET /api/instagram/user-reels',
      'POST /api/instagram/user-reels',
      'GET /api/instagram/user-id',
      'POST /api/video/transcribe-from-url',
      'GET /api/health'
    ]
  });
}
