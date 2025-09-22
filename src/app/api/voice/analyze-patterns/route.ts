import { NextRequest, NextResponse } from "next/server";

import { getVoiceService, VoiceServiceError } from "@/services/voice/voice-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator = {}, ...options } = (body ?? {}) as Record<string, unknown>;

    const service = getVoiceService();
    const result = await service.generate(options);

    return NextResponse.json({ success: true, creator, ...result });
  } catch (error) {
    if (error instanceof VoiceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[voice] analyze-patterns error:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze voice patterns' },
      { status: 500 },
    );
  }
}
