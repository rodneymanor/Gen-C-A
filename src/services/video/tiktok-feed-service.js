import { rapidApiFetch } from '@/api-routes/videos/rapidapi-rate-limit.js';

class TikTokFeedServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'TikTokFeedServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function getLowestQualityVideoUrl(video) {
  const bitRates = video?.bit_rate ?? [];

  if (Array.isArray(bitRates) && bitRates.length > 0) {
    const sorted = [...bitRates].sort((a, b) => (a.bit_rate ?? 0) - (b.bit_rate ?? 0));
    const lowest = sorted[0];
    const playList = lowest?.play_addr?.url_list ?? [];

    if (playList[0]) {
      return {
        playUrl: playList[0],
        downloadUrl: playList[0],
      };
    }
  }

  const playList = video?.play_addr?.url_list ?? [];
  const dlList = video?.download_addr?.url_list ?? [];
  return {
    playUrl: playList[0] ?? dlList[0] ?? '',
    downloadUrl: dlList[0] ?? playList[0] ?? '',
  };
}

class TikTokFeedService {
  async fetchUserFeed({ username, count = 20 }) {
    if (!username) {
      throw new TikTokFeedServiceError('Username is required', 400);
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      throw new TikTokFeedServiceError('RAPIDAPI_KEY not configured', 500);
    }

    const response = await rapidApiFetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/${encodeURIComponent(
        username,
      )}/feed`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      },
      'tiktok user feed',
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new TikTokFeedServiceError('Failed to fetch TikTok user feed', response.status, {
        statusText: response.statusText,
        rawError: errorText,
      });
    }

    const apiData = await response.json();
    if (!apiData || apiData.status !== 'ok' || !apiData.data || !apiData.data.aweme_list) {
      throw new TikTokFeedServiceError('Invalid API response structure', 500, { rawResponse: apiData });
    }

    const videosData = apiData.data.aweme_list ?? [];
    const userData = videosData[0]?.author ?? {};

    const videos = videosData.slice(0, count).map((video) => {
      const videoUrls = getLowestQualityVideoUrl(video.video);

      return {
        id: video.aweme_id ?? '',
        description: video.desc ?? '',
        createTime: video.create_time ?? 0,
        duration: video.video?.duration ?? 0,
        cover:
          video.video?.cover?.url_list?.[0] ??
          video.video?.origin_cover?.url_list?.[0] ??
          '',
        playUrl: videoUrls.playUrl,
        downloadUrl: videoUrls.downloadUrl,
        stats: {
          diggCount: video.statistics?.digg_count ?? 0,
          shareCount: video.statistics?.share_count ?? 0,
          commentCount: video.statistics?.comment_count ?? 0,
          playCount: video.statistics?.play_count ?? 0,
          collectCount: video.statistics?.collect_count ?? 0,
        },
        music: {
          id: video.music?.id ?? video.music?.id_str ?? '',
          title: video.music?.title ?? '',
          author: video.music?.author ?? video.music?.owner_nickname ?? '',
          playUrl: video.music?.play_url?.url_list?.[0] ?? '',
          cover:
            video.music?.cover_large?.url_list?.[0] ??
            video.music?.cover_medium?.url_list?.[0] ??
            '',
          original: video.music?.is_original ?? false,
          duration: video.music?.duration ?? 0,
        },
        challenges: (video.cha_list ?? []).map((challenge) => ({
          id: challenge.cid ?? '',
          title: challenge.cha_name ?? '',
          description: challenge.desc ?? '',
          cover: challenge.cover ?? '',
        })),
        hashtags: (video.text_extra ?? [])
          .filter((item) => item.hashtag_name)
          .map((hashtag) => ({
            id: hashtag.hashtag_id ?? '',
            name: hashtag.hashtag_name ?? '',
            start: hashtag.start ?? 0,
            end: hashtag.end ?? 0,
          })),
        author: {
          id: video.author?.uid ?? video.author?.id ?? '',
          username: video.author?.unique_id ?? video.author?.uniqueId ?? '',
          nickname: video.author?.nickname ?? '',
          avatar:
            video.author?.avatar_larger?.url_list?.[0] ??
            video.author?.avatar_medium?.url_list?.[0] ??
            video.author?.avatar_thumb?.url_list?.[0] ??
            '',
          verified: video.author?.verification_type === 1,
          signature: video.author?.signature ?? '',
          stats: {
            followingCount: video.author?.following_count ?? 0,
            followerCount: video.author?.follower_count ?? 0,
            heartCount: video.author?.total_favorited ?? 0,
            videoCount: video.author?.aweme_count ?? 0,
            diggCount: video.author?.favoriting_count ?? 0,
            heart: video.author?.total_favorited ?? 0,
          },
        },
      };
    });

    return {
      success: true,
      userInfo: {
        id: userData.uid ?? userData.id ?? '',
        username: userData.unique_id ?? userData.uniqueId ?? '',
        nickname: userData.nickname ?? '',
        avatar:
          userData.avatar_larger?.url_list?.[0] ??
          userData.avatar_medium?.url_list?.[0] ??
          userData.avatar_thumb?.url_list?.[0] ??
          '',
        signature: userData.signature ?? '',
        verified: userData.verification_type === 1,
        privateAccount: userData.secret ?? false,
        stats: {
          followingCount: userData.following_count ?? 0,
          followerCount: userData.follower_count ?? 0,
          heartCount: userData.total_favorited ?? 0,
          videoCount: userData.aweme_count ?? 0,
          diggCount: userData.favoriting_count ?? 0,
          heart: userData.total_favorited ?? 0,
        },
      },
      videos,
      metadata: {
        totalVideos: videosData.length,
        processedTime: Date.now(),
        fetchedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

const SERVICE_INSTANCE_KEY = '__tikTokFeedService__';

function getTikTokFeedService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new TikTokFeedService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { TikTokFeedService, TikTokFeedServiceError, getTikTokFeedService };
