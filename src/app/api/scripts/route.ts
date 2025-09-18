import { NextRequest, NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";

import { getCollectionRefByPath, getDb } from "@/api-routes/utils/firebase-admin.js";
import type { CreateScriptRequest, Script, ScriptResponse, ScriptsResponse } from "@/types/script";
import { fetchUserScripts, verifyRequestAuth } from "./utils";

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T;
  }

  if (value && typeof value === "object" && Object.prototype.toString.call(value) === "[object Object]") {
    return Object.entries(value as Record<string, unknown>).reduce((acc, [key, entryValue]) => {
      if (entryValue !== undefined) {
        (acc as Record<string, unknown>)[key] = stripUndefined(entryValue);
      }
      return acc;
    }, {} as T);
  }

  return value;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Authentication required to load scripts." } satisfies ScriptsResponse, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      console.error("[scripts] Firestore unavailable while handling GET");
      return NextResponse.json({ success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptsResponse, { status: 503 });
    }

    const scripts = await fetchUserScripts(db, auth.uid);
    return NextResponse.json({ success: true, scripts } satisfies ScriptsResponse);
  } catch (error) {
    console.error("[scripts] Failed to fetch scripts:", (error as Error)?.message);
    return NextResponse.json({ success: false, error: "Failed to load scripts." } satisfies ScriptsResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateScriptRequest;
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Authentication required to save scripts." } satisfies ScriptResponse, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      console.error("[scripts] Firestore unavailable while handling POST");
      return NextResponse.json({ success: false, error: "Content service is unavailable. Please try again later." } satisfies ScriptResponse, { status: 503 });
    }

    const now = new Date();
    const content = body.content || "";
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    const script: Script = {
      id: "",
      title: body.title || "Untitled Script",
      content,
      authors: "You",
      status: body.status ?? "draft",
      performance: { views: 0, engagement: 0 },
      category: body.category || "General",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      viewedAt: now.toISOString(),
      duration: "0:30",
      tags: Array.isArray(body.tags) ? body.tags : [],
      fileType: "Script",
      summary: body.summary || content.slice(0, 160),
      userId: auth.uid,
      approach: body.approach,
      voice: body.voice,
      originalIdea: body.originalIdea,
      targetLength: body.targetLength,
      source: body.source,
      scheduledDate: body.scheduledDate,
      platform: body.platform,
      isThread: body.isThread,
      threadParts: body.threadParts,
      wordCount,
      characterCount: content.length,
    };

    try {
      const saved = await persistScriptToFirestore(db, auth.uid, script);
      return NextResponse.json({ success: true, script: saved } satisfies ScriptResponse);
    } catch (error) {
      console.error("[scripts] Failed to persist script:", (error as Error)?.message);
      return NextResponse.json({ success: false, error: "Failed to save script to Firestore." } satisfies ScriptResponse, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ success: false, error: message } satisfies ScriptResponse, { status: 400 });
  }
}

async function persistScriptToFirestore(db: Firestore, uid: string, script: Script): Promise<Script> {
  const timestamps = { createdAt: new Date(), updatedAt: new Date() } as const;
  const toSave = stripUndefined({
    ...script,
    id: undefined,
    userId: uid,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }) as Omit<Script, "id"> & { id?: string };
  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;

  const configuredRef = configuredPath ? getCollectionRefByPath(db, configuredPath, uid) : null;
  if (configuredRef) {
    const ref = await configuredRef.add({ ...toSave, ...timestamps });
    return {
      ...stripUndefined(script),
      id: ref.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    };
  }

  try {
    const subRef = await db
      .collection("users")
      .doc(uid)
      .collection("scripts")
      .add({ ...toSave, ...timestamps });
    return {
      ...stripUndefined(script),
      id: subRef.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    };
  } catch {
    const ref = await db.collection("scripts").add({ ...toSave, ...timestamps });
    return {
      ...stripUndefined(script),
      id: ref.id,
      userId: uid,
      createdAt: timestamps.createdAt.toISOString(),
      updatedAt: timestamps.updatedAt.toISOString(),
    };
  }
}
