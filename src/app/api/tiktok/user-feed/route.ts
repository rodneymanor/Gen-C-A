import { NextRequest, NextResponse } from "next/server";

import { getTikTokFeedService, TikTokFeedServiceError } from "@/services/video/tiktok-feed-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; count?: number };
    const service = getTikTokFeedService();
    const result = await service.fetchUserFeed({ username: body?.username, count: body?.count });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TikTokFeedServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, ...(error.debug || {}) },
        { status: error.statusCode },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to fetch TikTok user feed";
    console.error("[tiktok/user-feed] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
