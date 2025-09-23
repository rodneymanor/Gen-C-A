import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { getScriptsService, ScriptsServiceError } from "@/services/scripts/scripts-service.js";
import type { ScriptResponse } from "@/types/script";
import { verifyRequestAuth } from "@/app/api/utils/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to load scripts." } satisfies ScriptResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptResponse,
        { status: 503 },
      );
    }

    const service = getScriptsService(db);
    const script = await service.getScriptById(auth.uid, id);

    return NextResponse.json(
      { success: true, script } satisfies ScriptResponse,
    );
  } catch (unknownError) {
    if (unknownError instanceof ScriptsServiceError) {
      console.warn("[scripts] Service error while fetching script:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies ScriptResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to load script.';
    console.error("[scripts] Failed to fetch script:", message);
    return NextResponse.json(
      { success: false, error: "Failed to load script." } satisfies ScriptResponse,
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  let updates: Record<string, unknown>;

  try {
    updates = (await request.json()) as Record<string, unknown>;
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
        { success: false, error: "Authentication required to update scripts." } satisfies ScriptResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptResponse,
        { status: 503 },
      );
    }

    const service = getScriptsService(db);
    const script = await service.updateScript(auth.uid, id, updates);

    return NextResponse.json(
      { success: true, script } satisfies ScriptResponse,
    );
  } catch (unknownError) {
    if (unknownError instanceof ScriptsServiceError) {
      console.warn("[scripts] Service error while updating script:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies ScriptResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to update script.';
    console.error("[scripts] Failed to update script:", message);
    return NextResponse.json(
      { success: false, error: "Failed to update script." } satisfies ScriptResponse,
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete scripts." } satisfies ScriptResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptResponse,
        { status: 503 },
      );
    }

    const service = getScriptsService(db);
    await service.deleteScript(auth.uid, id);

    return NextResponse.json(
      { success: true } satisfies ScriptResponse,
    );
  } catch (unknownError) {
    if (unknownError instanceof ScriptsServiceError) {
      console.warn("[scripts] Service error while deleting script:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies ScriptResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to delete script.';
    console.error("[scripts] Failed to delete script:", message);
    return NextResponse.json(
      { success: false, error: "Failed to delete script." } satisfies ScriptResponse,
      { status: 500 },
    );
  }
}
