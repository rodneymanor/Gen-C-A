import { NextRequest, NextResponse } from "next/server";

import { getInstagramService, InstagramServiceError } from "@/services/video/instagram-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string };
    const service = getInstagramService();
    const result = await service.getUserId(body?.username);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InstagramServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) },
        { status: error.statusCode },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to resolve Instagram user ID";
    console.error("[instagram/user-id] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
