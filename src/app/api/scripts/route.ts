import { NextRequest, NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";

import { getCollectionRefByPath, getDb } from "@/api-routes/utils/firebase-admin.js";
import type { CreateScriptRequest, Script, ScriptResponse, ScriptsResponse } from "@/types/script";
import { fetchUserScripts, genId, readScripts, verifyRequestAuth, writeScripts } from "./utils";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyRequestAuth(request);
    const db = getDb();
    if (auth && db) {
      const scripts = await fetchUserScripts(db, auth.uid);
      return NextResponse.json({ success: true, scripts } satisfies ScriptsResponse);
    }
  } catch (error) {
    console.warn("[scripts] Firestore GET failed, fallback JSON:", (error as Error)?.message);
  }

  const scripts = readScripts();
  return NextResponse.json({ success: true, scripts } satisfies ScriptsResponse);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateScriptRequest;
    const nowIso = new Date().toISOString();
    const content = body.content || "";
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    const script: Script = {
      id: genId(),
      title: body.title || "Untitled Script",
      content,
      authors: "You",
      status: body.status ?? "draft",
      performance: { views: 0, engagement: 0 },
      category: body.category || "General",
      createdAt: nowIso,
      updatedAt: nowIso,
      viewedAt: nowIso,
      duration: "0:30",
      tags: Array.isArray(body.tags) ? body.tags : [],
      fileType: "Script",
      summary: body.summary || content.slice(0, 160),
      userId: "local",
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
      const auth = await verifyRequestAuth(request);
      const db = getDb();
      if (auth && db) {
        const saved = await persistScriptToFirestore(db, auth.uid, script);
        return NextResponse.json({ success: true, script: saved } satisfies ScriptResponse);
      }
    } catch (error) {
      console.warn("[scripts] Firestore POST failed, using JSON store:", (error as Error)?.message);
    }

    const scripts = readScripts();
    scripts.unshift(script);
    writeScripts(scripts);

    return NextResponse.json({ success: true, script } satisfies ScriptResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ success: false, error: message } satisfies ScriptResponse, { status: 400 });
  }
}

async function persistScriptToFirestore(db: Firestore, uid: string, script: Script): Promise<Script> {
  const toSave = { ...script, id: undefined, userId: uid } as Omit<Script, "id"> & { id?: string };
  const timestamps = { createdAt: new Date(), updatedAt: new Date() } as const;
  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;

  const configuredRef = configuredPath ? getCollectionRefByPath(db, configuredPath, uid) : null;
  if (configuredRef) {
    const ref = await configuredRef.add({ ...toSave, ...timestamps });
    return { ...script, id: ref.id, userId: uid };
  }

  try {
    const subRef = await db
      .collection("users")
      .doc(uid)
      .collection("scripts")
      .add({ ...toSave, ...timestamps });
    return { ...script, id: subRef.id, userId: uid };
  } catch {
    const ref = await db.collection("scripts").add({ ...toSave, ...timestamps });
    return { ...script, id: ref.id, userId: uid };
  }
}

