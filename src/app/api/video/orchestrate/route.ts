import { NextRequest, NextResponse } from "next/server";

import {
  getVideoOrchestratorService,
  VideoOrchestratorServiceError,
} from "@/services/video/video-orchestrator-service.js";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const service = getVideoOrchestratorService();
    const result = await service.orchestrateWorkflow(body);
    return NextResponse.json(result);
  } catch (unknownError) {
    if (unknownError instanceof VideoOrchestratorServiceError) {
      return NextResponse.json(
        { success: false, error: unknownError.message, ...(unknownError.debug ? { debug: unknownError.debug } : {}) },
        { status: unknownError.statusCode },
      );
    }

    const message = unknownError instanceof Error ? unknownError.message : "Failed to orchestrate video workflow";
    console.error("[video/orchestrate] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: message },
      { status: 500 },
    );
  }
}
