import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("🧪 Testing Instagram User Reels API");

  try {
    // Test with a known user ID (25025320 from the original curl command)
    const testUserId = "25025320";
    const includeFeedVideo = true;

    // Get the base URL for internal API calls
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    const host = request.headers.get("host") ?? "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const testUrl = new URL(`${baseUrl}/api/instagram/user-reels`);
    testUrl.searchParams.set("user_id", testUserId);
    testUrl.searchParams.set("include_feed_video", includeFeedVideo.toString());

    console.log(`🚀 Testing internal API call: ${testUrl.toString()}`);

    const response = await fetch(testUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.log(`❌ Test failed: ${response.status}`);
      return NextResponse.json({
        success: false,
        test_status: "failed",
        error: result.error,
        status_code: response.status,
      });
    }

    console.log(`✅ Test successful`);
    console.log(`📊 Retrieved ${result.data?.items?.length ?? 0} reels`);

    // Return a summary of the test results
    return NextResponse.json({
      success: true,
      test_status: "passed",
      summary: {
        user_id: result.user_id,
        include_feed_video: result.include_feed_video,
        total_reels: result.data?.items?.length ?? 0,
        has_more_available: result.data?.paging_info?.more_available ?? false,
        api_status: result.data?.status,
        next_max_id: result.data?.paging_info?.max_id ?? null,
      },
      sample_reel: result.data?.items?.[0]
        ? {
            id: result.data.items[0].media.id,
            code: result.data.items[0].media.code,
            media_type: result.data.items[0].media.media_type,
            taken_at: result.data.items[0].media.taken_at,
            like_count: result.data.items[0].media.like_count,
            comment_count: result.data.items[0].media.comment_count,
            view_count: result.data.items[0].media.play_count,
            username: result.data.items[0].media.user?.username,
            caption_text: result.data.items[0].media.caption?.text
              ? result.data.items[0].media.caption.text.substring(0, 100) + "..."
              : null,
            has_video: !!result.data.items[0].media.video_versions?.length,
            video_duration: result.data.items[0].media.video_duration,
            thumbnail_url: result.data.items[0].media.image_versions2?.candidates?.[0]?.url,
            has_music: !!result.data.items[0].media.clips_metadata?.music_info,
            has_original_sound: !!result.data.items[0].media.clips_metadata?.original_sound_info,
          }
        : null,
      full_response: result,
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    return NextResponse.json(
      {
        success: false,
        test_status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
