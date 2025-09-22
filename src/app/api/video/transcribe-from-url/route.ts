import { NextRequest, NextResponse } from "next/server";

import {
  getVideoTranscriptionService,
  VideoTranscriptionServiceError,
} from "@/services/video/video-transcription-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getVideoTranscriptionService();
    const result = await service.transcribeFromUrl(body ?? {});
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof VideoTranscriptionServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[video/transcribe-from-url] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: message },
      { status: 500 },
    );
  }
}
