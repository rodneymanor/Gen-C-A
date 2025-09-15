import { NextRequest, NextResponse } from "next/server";

interface TikTokUserFeedRequest {
  username: string;
  count?: number;
}

interface TikTokUserFeedResponse {
  success: boolean;
  userInfo?: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
    signature: string;
    verified: boolean;
    privateAccount: boolean;
    stats: {
      followingCount: number;
      followerCount: number;
      heartCount: number;
      videoCount: number;
      diggCount: number;
      heart: number;
    };
  };
  videos?: Array<{
    id: string;
    description: string;
    createTime: number;
    duration: number;
    cover: string;
    playUrl: string;
    downloadUrl: string;
    stats: {
      diggCount: number;
      shareCount: number;
      commentCount: number;
      playCount: number;
      collectCount: number;
    };
    music: {
      id: string;
      title: string;
      author: string;
      playUrl: string;
      cover: string;
      original: boolean;
      duration: number;
    };
    challenges: Array<{
      id: string;
      title: string;
      description: string;
      cover: string;
    }>;
    hashtags: Array<{
      id: string;
      name: string;
      start: number;
      end: number;
    }>;
    author: {
      id: string;
      username: string;
      nickname: string;
      avatar: string;
      verified: boolean;
      signature: string;
      stats: {
        followingCount: number;
        followerCount: number;
        heartCount: number;
        videoCount: number;
        diggCount: number;
        heart: number;
      };
    };
  }>;
  metadata?: {
    totalVideos: number;
    processedTime: number;
    fetchedAt: string;
  };
  error?: string;
  details?: string;
  rawError?: string;
  rawResponse?: any;
  timestamp: string;
}

// Helper function to select the lowest quality video URL based on bit_rate
function getLowestQualityVideoUrl(video: any): { playUrl: string; downloadUrl: string } {
  const bitRates: any[] = video?.bit_rate ?? [];

  if (Array.isArray(bitRates) && bitRates.length > 0) {
    // Sort by bit_rate (ascending) to get lowest quality first
    const sorted = [...bitRates].sort((a, b) => (a.bit_rate ?? 0) - (b.bit_rate ?? 0));
    const lowest = sorted[0];
    const playList: string[] = lowest?.play_addr?.url_list ?? [];

    if (playList[0]) {
      console.log(
        `🔽 Selected lowest quality: ${lowest.bit_rate ?? "unknown"} bit_rate (${lowest.gear_name ?? "unknown gear"})`,
      );
      return {
        playUrl: playList[0],
        downloadUrl: playList[0],
      };
    }
  }

  // Fallback to original logic if bit_rate array not available
  console.log("⚠️ No bit_rate array found, using fallback URLs");
  const playList: string[] = video?.play_addr?.url_list ?? [];
  const dlList: string[] = video?.download_addr?.url_list ?? [];
  return {
    playUrl: playList[0] ?? dlList[0] ?? "",
    downloadUrl: dlList[0] ?? playList[0] ?? "",
  };
}

export async function POST(request: NextRequest) {
  console.log("🎵 TikTok User Feed API - Starting request");

  try {
    const body: TikTokUserFeedRequest = await request.json();
    const { username, count = 20 } = body;

    if (!username) {
      console.log("❌ Missing username parameter");
      return NextResponse.json(
        {
          success: false,
          error: "Username is required",
          timestamp: new Date().toISOString(),
        } satisfies TikTokUserFeedResponse,
        { status: 400 },
      );
    }

    console.log(`🔍 Fetching TikTok user feed for: ${username} (${count} videos)`);

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      console.log("❌ RAPIDAPI_KEY not found in environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "RAPIDAPI_KEY not configured",
        },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/${encodeURIComponent(username)}/feed`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com",
          "x-rapidapi-key": rapidApiKey,
        },
      },
    );

    if (!response.ok) {
      console.log(`❌ RapidAPI request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log("Error details:", errorText);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch TikTok user feed",
          details: `API returned ${response.status}: ${response.statusText}`,
          rawError: errorText,
          timestamp: new Date().toISOString(),
        } satisfies TikTokUserFeedResponse,
        { status: response.status },
      );
    }

    const apiData = await response.json();
    console.log("✅ Successfully fetched TikTok user feed");
    console.log("📊 Raw API response structure:", JSON.stringify(apiData, null, 2));

    // Check if we have valid data structure
    if (!apiData || apiData.status !== "ok" || !apiData.data || !apiData.data.aweme_list) {
      console.log("❌ Invalid API response structure");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API response structure",
          details: "API returned data in unexpected format",
          rawResponse: apiData,
          timestamp: new Date().toISOString(),
        } satisfies TikTokUserFeedResponse,
        { status: 500 },
      );
    }

    const videosData = apiData.data.aweme_list ?? [];
    // Extract user data from the first video if available
    const firstVideo = videosData[0];
    const userData = firstVideo?.author ?? {};

    console.log(`📊 Retrieved ${videosData.length} videos`);

    // Extract and structure the essential information for other processes
    const processedResponse: TikTokUserFeedResponse = {
      success: true,
      userInfo: userData
        ? {
            id: userData.uid ?? userData.id ?? "",
            username: userData.unique_id ?? userData.uniqueId ?? "",
            nickname: userData.nickname ?? "",
            avatar:
              userData.avatar_larger?.url_list?.[0] ??
              userData.avatar_medium?.url_list?.[0] ??
              userData.avatar_thumb?.url_list?.[0] ??
              "",
            signature: userData.signature ?? "",
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
          }
        : undefined,
      videos: videosData.map((video: any) => {
        // Get lowest quality URLs for this video
        const videoUrls = getLowestQualityVideoUrl(video.video);

        return {
          id: video.aweme_id ?? "",
          description: video.desc ?? "",
          createTime: video.create_time ?? 0,
          duration: video.video?.duration ?? 0,
          cover: video.video?.cover?.url_list?.[0] ?? video.video?.origin_cover?.url_list?.[0] ?? "",
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
            id: video.music?.id ?? video.music?.id_str ?? "",
            title: video.music?.title ?? "",
            author: video.music?.author ?? video.music?.owner_nickname ?? "",
            playUrl: video.music?.play_url?.url_list?.[0] ?? "",
            cover: video.music?.cover_large?.url_list?.[0] ?? video.music?.cover_medium?.url_list?.[0] ?? "",
            original: video.music?.is_original ?? false,
            duration: video.music?.duration ?? 0,
          },
          challenges: (video.cha_list ?? []).map((challenge: any) => ({
            id: challenge.cid ?? "",
            title: challenge.cha_name ?? "",
            description: challenge.desc ?? "",
            cover: challenge.cover ?? "",
          })),
          hashtags: (video.text_extra ?? [])
            .filter((item: any) => item.hashtag_name)
            .map((hashtag: any) => ({
              id: hashtag.hashtag_id ?? "",
              name: hashtag.hashtag_name ?? "",
              start: hashtag.start ?? 0,
              end: hashtag.end ?? 0,
            })),
          author: {
            id: video.author?.uid ?? video.author?.id ?? "",
            username: video.author?.unique_id ?? video.author?.uniqueId ?? "",
            nickname: video.author?.nickname ?? "",
            avatar:
              video.author?.avatar_larger?.url_list?.[0] ??
              video.author?.avatar_medium?.url_list?.[0] ??
              video.author?.avatar_thumb?.url_list?.[0] ??
              "",
            verified: video.author?.verification_type === 1,
            signature: video.author?.signature ?? "",
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
      }),
      metadata: {
        totalVideos: videosData.length,
        processedTime: Date.now(),
        fetchedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Successfully processed TikTok user feed data");
    return NextResponse.json(processedResponse);
  } catch (error) {
    console.error("❌ TikTok User Feed API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } satisfies TikTokUserFeedResponse,
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const count = parseInt(searchParams.get("count") ?? "20");

  if (!username) {
    return NextResponse.json(
      {
        success: false,
        error: "Username parameter is required",
        timestamp: new Date().toISOString(),
      } satisfies TikTokUserFeedResponse,
      { status: 400 },
    );
  }

  // Forward to POST handler
  const mockRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ username, count }),
  });

  return POST(mockRequest as NextRequest);
}
