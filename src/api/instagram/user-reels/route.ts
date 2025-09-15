import { NextRequest, NextResponse } from "next/server";

import { withGlobalInstagramRateLimit, retryWithGlobalBackoff } from "@/lib/global-rate-limiter";

// Types based on the actual API response structure
interface InstagramMedia {
  id: string;
  pk: number;
  code: string;
  media_type: number;
  taken_at: number;
  image_versions2: {
    candidates: Array<{
      width: number;
      height: number;
      url: string;
      scans_profile?: string;
    }>;
    additional_candidates?: {
      smart_frame?: {
        width: number;
        height: number;
        url: string;
        scans_profile: string;
      };
      first_frame?: {
        width: number;
        height: number;
        url: string;
        scans_profile: string;
      };
      igtv_first_frame?: {
        width: number;
        height: number;
        url: string;
        scans_profile: string;
      };
    };
  };
  original_width: number;
  original_height: number;
  video_versions?: Array<{
    width: number;
    height: number;
    url: string;
    bandwidth: number;
    id: string;
    type: number;
  }>;
  has_audio?: boolean;
  video_duration?: number;
  caption?: {
    text: string;
    pk: string;
    user_id: number;
    type: number;
    did_report_as_spam: boolean;
    created_at: number;
    created_at_utc: number;
    content_type: string;
    status: string;
    bit_flags: number;
    share_enabled: boolean;
    is_ranked_comment: boolean;
    is_covered: boolean;
    private_reply_status: number;
    media_id: number;
    has_translation?: boolean;
  };
  user: {
    pk: number;
    username: string;
    full_name: string;
    is_private: boolean;
    profile_pic_url: string;
    profile_pic_id?: string;
    is_verified: boolean;
    account_type?: number;
    fan_club_info?: any;
    fbid_v2?: number;
    pk_id: string;
    third_party_downloads_enabled?: number;
    strong_id__: string;
    latest_reel_media?: number;
    avatar_status?: {
      has_avatar: boolean;
    };
    show_account_transparency_details?: boolean;
  };
  product_type: string;
  comment_count: number;
  like_count: number;
  play_count?: number;
  clips_metadata?: {
    music_info?: {
      music_asset_info?: {
        audio_cluster_id: string;
        id: string;
        title: string;
        display_artist: string;
        artist_id: string;
        cover_artwork_uri: string;
        cover_artwork_thumbnail_uri: string;
        progressive_download_url: string;
        fast_start_progressive_download_url: string;
        highlight_start_times_in_ms: number[];
        is_explicit: boolean;
        dash_manifest: string;
      };
    };
    original_sound_info?: {
      audio_asset_id: number;
      progressive_download_url: string;
      dash_manifest: string;
      ig_artist: {
        pk: number;
        username: string;
        full_name: string;
        is_private: boolean;
        profile_pic_url: string;
        profile_pic_id?: string;
        is_verified: boolean;
        pk_id: string;
        strong_id__: string;
        avatar_status: {
          has_avatar: boolean;
        };
      };
      should_mute_audio: boolean;
      original_media_id: number;
      hide_remixing: boolean;
      duration_in_ms: number;
      time_created: number;
      original_audio_title: string;
      consumption_info: {
        is_bookmarked: boolean;
        should_mute_audio_reason: string;
        is_trending_in_clips: boolean;
      };
      allow_creator_to_rename: boolean;
      can_remix_be_shared_to_fb: boolean;
      formatted_clips_media_count?: any;
      audio_parts?: Array<{
        audio_start_time_in_ms: number;
        audio_type: string;
        display_artist: string;
        display_title: string;
        duration_in_ms: number;
        ig_artist: {
          full_name: string;
          id: string;
          is_private: boolean;
          is_verified: boolean;
          pk: number;
          pk_id: string;
          profile_pic_id: string;
          profile_pic_url: string;
          strong_id__: string;
          username: string;
        };
        is_bookmarked: boolean;
        is_eligible_for_audio_effects: boolean;
        is_explicit: boolean;
        music_canonical_id: string;
        parent_start_time_in_ms: number;
        thumbnail_uri: string;
      }>;
      is_explicit: boolean;
      original_audio_subtype: string;
      is_audio_automatically_attributed: boolean;
    };
    audio_type?: string;
    music_canonical_id?: string;
    mashup_info?: {
      mashups_allowed: boolean;
      can_toggle_mashups_allowed: boolean;
      has_been_mashed_up: boolean;
      formatted_mashups_count?: any;
      original_media?: any;
      non_privacy_filtered_mashups_media_count: number;
    };
    branded_content_tag_info?: {
      can_add_tag: boolean;
    };
    shopping_info?: any;
    additional_audio_info?: {
      audio_reattribution_info: {
        should_allow_restore: boolean;
      };
    };
    is_shared_to_fb?: boolean;
    clips_creation_entry_point?: string;
    audio_ranking_info?: {
      best_audio_cluster_id: string;
    };
  };
  usertags?: {
    in: Array<{
      user: {
        pk: number;
        username: string;
        full_name: string;
        is_private: boolean;
        profile_pic_url: string;
        is_verified: boolean;
        pk_id: string;
        strong_id__: string;
        avatar_status: {
          has_avatar: boolean;
        };
      };
      position: [number, number];
      start_time_in_video_in_sec?: any;
      duration_in_video_in_sec?: any;
    }>;
  };
  video_dash_manifest?: string;
  strong_id__?: string;
  fb_user_tags?: {
    in: any[];
  };
  sharing_friction_info?: {
    should_have_sharing_friction: boolean;
    bloks_app_url?: any;
    sharing_friction_payload?: any;
  };
  device_timestamp?: number;
  client_cache_key?: string;
  caption_is_edited?: boolean;
  integrity_review_decision?: string;
  is_visual_reply_commenter_notice_enabled?: boolean;
  is_organic_product_tagging_eligible?: boolean;
  can_viewer_reshare?: boolean;
  comment_inform_treatment?: {
    should_have_inform_treatment: boolean;
    text: string;
    url?: any;
    action_type?: any;
  };
  fundraiser_tag?: {
    has_standalone_fundraiser: boolean;
  };
  can_viewer_save?: boolean;
  is_comments_gif_composer_enabled?: boolean;
  organic_tracking_token?: string;
  hide_view_all_comment_entrypoint?: boolean;
  coauthor_producers?: Array<{
    pk: number;
    username: string;
    full_name: string;
    is_private: boolean;
    profile_pic_url: string;
    profile_pic_id?: string;
    is_verified: boolean;
    pk_id: string;
    strong_id__: string;
    avatar_status: {
      has_avatar: boolean;
    };
  }>;
  reshare_count?: number;
  video_codec?: string;
  number_of_qualities?: number;
}

interface InstagramReelItem {
  media: InstagramMedia;
}

interface InstagramUserReelsResponse {
  items: InstagramReelItem[];
  paging_info: {
    max_id?: string;
    more_available: boolean;
  };
  status: string;
}

export async function GET(request: NextRequest) {
  console.log("🎬 Instagram User Reels API called");

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const includeFeedVideo = searchParams.get("include_feed_video") === "true";

    if (!userId) {
      console.log("❌ Missing user_id parameter");
      return NextResponse.json(
        {
          success: false,
          error: "user_id parameter is required",
        },
        { status: 400 },
      );
    }

    console.log(`🔍 Fetching reels for user ID: ${userId}, include_feed_video: ${includeFeedVideo}`);

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

    // Build the API URL with parameters
    const apiUrl = new URL("https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/reels");
    apiUrl.searchParams.set("user_id", userId);
    if (includeFeedVideo) {
      apiUrl.searchParams.set("include_feed_video", "true");
    }

    console.log(`📡 Calling Instagram API: ${apiUrl.toString()}`);

    const response = await retryWithGlobalBackoff(
      () =>
        withGlobalInstagramRateLimit(async () => {
          const res = await fetch(apiUrl.toString(), {
            method: "GET",
            headers: {
              "x-rapidapi-host": "instagram-api-fast-reliable-data-scraper.p.rapidapi.com",
              "x-rapidapi-key": rapidApiKey,
            },
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
          }
          return res;
        }, `instagram-user-reels-${userId}`),
      3,
      1000,
      `instagram-user-reels-${userId}`,
    );

    // If we reached here, response.ok is true due to throw-on-error above

    const apiData = await response.json();

    // The actual response structure has a 'data' field containing the reels
    const data: InstagramUserReelsResponse = apiData.status === "ok" ? apiData.data : apiData;

    console.log(`✅ Successfully fetched ${data.items?.length ?? 0} reels`);
    console.log(`📊 API Status: ${data.status}, More available: ${data.paging_info?.more_available ?? false}`);

    return NextResponse.json({
      success: true,
      data,
      user_id: userId,
      include_feed_video: includeFeedVideo,
    });
  } catch (error) {
    console.error("❌ Unexpected error in Instagram User Reels API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
