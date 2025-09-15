import { NextRequest, NextResponse } from "next/server";

// Fetch Instagram profile info by user_id (pk) via RapidAPI
// Request body: { userId: string }
// Response: { success: boolean, profile?: { ...normalized }, error?: string }

export async function POST(request: NextRequest) {
  try {
    const { userId, username }: { userId?: string | number; username?: string } = await request.json();

    if (!userId && !username) {
      return NextResponse.json({ success: false, error: "username or userId is required" }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      console.error("❌ [IG_PROFILE] Missing RAPIDAPI_KEY env var");
      return NextResponse.json({ success: false, error: "Service not configured" }, { status: 500 });
    }

    const query = username
      ? `username=${encodeURIComponent(username)}`
      : `user_id=${encodeURIComponent(String(userId as string | number))}`;
    const url = `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/profile?${query}`;

    console.log("🔎 [IG_PROFILE] Fetching Instagram profile:", username ? { username } : { userId });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "instagram-api-fast-reliable-data-scraper.p.rapidapi.com",
      },
      // 10s timeout via AbortController
      signal: AbortSignal.timeout ? AbortSignal.timeout(10_000) : undefined,
    } as RequestInit);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("❌ [IG_PROFILE] RapidAPI error:", response.status, errorText);
      return NextResponse.json({ success: false, error: `RapidAPI error: ${response.status}` }, { status: 502 });
    }

    const json = await response.json();
    const data = json?.data ?? json; // some responses may wrap in data

    const normalized = {
      pk: data?.pk ?? null,
      username: data?.username ?? null,
      full_name: data?.full_name ?? null,
      is_private: data?.is_private ?? null,
      profile_pic_url: data?.profile_pic_url ?? null,
      profile_pic_id: data?.profile_pic_id ?? null,
      is_verified: data?.is_verified ?? null,
      media_count: data?.media_count ?? null,
      follower_count: data?.follower_count ?? null,
      following_count: data?.following_count ?? null,
      total_igtv_videos: data?.total_igtv_videos ?? null,
      total_clips_count: data?.total_clips_count ?? null,
      has_highlight_reels: data?.has_highlight_reels ?? null,
      category: data?.category ?? null,
      biography: data?.biography ?? null,
      external_url: data?.external_url ?? null,
    };

    console.log("✅ [IG_PROFILE] Profile fetched for:", normalized.username ?? normalized.pk);

    return NextResponse.json({ success: true, profile: normalized });
  } catch (error) {
    console.error("❌ [IG_PROFILE] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
