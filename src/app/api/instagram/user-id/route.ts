import { NextRequest, NextResponse } from "next/server";

import { getInstagramService, InstagramServiceError } from "@/services/video/instagram-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string };
    const username = body?.username?.trim();
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required to resolve user ID' },
        { status: 400 },
      );
    }

    const service = getInstagramService();
    const result = await service.getUserId(username);
    return NextResponse.json(result);
  } catch (unknownError) {
    if (unknownError instanceof InstagramServiceError) {
      return NextResponse.json(
        { success: false, error: unknownError.message, ...(unknownError.debug ? { debug: unknownError.debug } : {}) },
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : "Failed to resolve Instagram user ID";
    console.error("[instagram/user-id] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
