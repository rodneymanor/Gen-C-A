import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { getScriptsService, ScriptsServiceError } from "@/services/scripts/scripts-service.js";
import type { ScriptResponse, ScriptsResponse } from "@/types/script";
import { verifyRequestAuth } from "@/app/api/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to load scripts." } satisfies ScriptsResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      console.error("[scripts] Firestore unavailable while handling GET");
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptsResponse,
        { status: 503 },
      );
    }

    const service = getScriptsService(db);
    const scripts = await service.listScripts(auth.uid);
    return NextResponse.json({ success: true, scripts } satisfies ScriptsResponse);
  } catch (unknownError) {
    if (unknownError instanceof ScriptsServiceError) {
      console.warn("[scripts] Service error while fetching scripts:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies ScriptsResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to load scripts.';
    console.error("[scripts] Failed to fetch scripts:", message);
    return NextResponse.json(
      { success: false, error: "Failed to load scripts." } satisfies ScriptsResponse,
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json(
      { success: false, error: message } satisfies ScriptResponse,
      { status: 400 },
    );
  }

  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to save scripts." } satisfies ScriptResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      console.error("[scripts] Firestore unavailable while handling POST");
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptResponse,
        { status: 503 },
      );
    }

    const service = getScriptsService(db);
    const saved = await service.createScript(auth.uid, body);
    return NextResponse.json({ success: true, script: saved } satisfies ScriptResponse);
  } catch (unknownError) {
    if (unknownError instanceof ScriptsServiceError) {
      console.warn("[scripts] Service error while saving script:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies ScriptResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to save script to Firestore.';
    console.error("[scripts] Failed to save script:", message);
    return NextResponse.json(
      { success: false, error: "Failed to save script to Firestore." } satisfies ScriptResponse,
      { status: 500 },
    );
  }
}
