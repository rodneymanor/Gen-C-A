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
  } catch (error) {
    if (error instanceof VideoOrchestratorServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, ...(error.debug ? { debug: error.debug } : {}) },
        { status: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to orchestrate video workflow";
    console.error("[video/orchestrate] Unexpected error:", message);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: message },
      { status: 500 },
    );
  }
}
