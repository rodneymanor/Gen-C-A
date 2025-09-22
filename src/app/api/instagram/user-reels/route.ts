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
    const service = getInstagramService();
    const result = await service.getUserReels(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InstagramServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) },
        { status: error.statusCode },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to fetch Instagram reels";
    console.error("[instagram/user-reels] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
