import { NextRequest, NextResponse } from "next/server";

import { getInstagramService, InstagramServiceError } from "@/services/video/instagram-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      count?: number;
      includeFeedVideo?: boolean;
      username?: string;
    };

    if (!body?.userId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'userId is required to fetch reels' },
        { status: 400 },
      );
    }

    const service = getInstagramService();
    const result = await service.getUserReels({
      userId: body.userId.trim(),
      count: body.count,
      includeFeedVideo: body.includeFeedVideo,
      username: body.username,
    });
    return NextResponse.json(result);
  } catch (unknownError) {
    if (unknownError instanceof InstagramServiceError) {
      return NextResponse.json(
        { success: false, error: unknownError.message, ...(unknownError.debug ? { debug: unknownError.debug } : {}) },
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : "Failed to fetch Instagram reels";
    console.error("[instagram/user-reels] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
