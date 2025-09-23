import { NextRequest, NextResponse } from "next/server";

import { getTikTokFeedService, TikTokFeedServiceError } from "@/services/video/tiktok-feed-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; count?: number };
    const username = body?.username?.trim();
    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required to fetch TikTok feed" },
        { status: 400 },
      );
    }

    const service = getTikTokFeedService();
    const result = await service.fetchUserFeed({ username, count: body?.count });
    return NextResponse.json(result);
  } catch (unknownError) {
    if (unknownError instanceof TikTokFeedServiceError) {
      return NextResponse.json(
        { success: false, error: unknownError.message, ...(unknownError.debug || {}) },
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : "Failed to fetch TikTok user feed";
    console.error("[tiktok/user-feed] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
