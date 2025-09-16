import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import type { Script, ScriptResponse, UpdateScriptRequest } from "@/types/script";
import { formatScriptDoc, readScripts, verifyRequestAuth, writeScripts } from "../utils";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const auth = await verifyRequestAuth(request);
    const db = getDb();
    if (auth && db) {
      let docRef = db.collection("users").doc(auth.uid).collection("scripts").doc(id);
      let snapshot = await docRef.get();
      if (!snapshot.exists) {
        docRef = db.collection("scripts").doc(id);
        snapshot = await docRef.get();
      }
      if (snapshot.exists) {
        const script = formatScriptDoc(snapshot);
        if (script.userId && script.userId !== auth.uid) {
          return NextResponse.json({ success: false, error: "Forbidden" } satisfies ScriptResponse, { status: 403 });
        }
        return NextResponse.json({ success: true, script } satisfies ScriptResponse);
      }
    }
  } catch (error) {
    console.warn("[scripts] Firestore GET by id failed, fallback:", (error as Error)?.message);
  }

  const scripts = readScripts();
  const script = scripts.find((s) => s.id === id);
  if (!script) {
    return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
  }
  return NextResponse.json({ success: true, script } satisfies ScriptResponse);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const updates = (await request.json()) as UpdateScriptRequest;

    try {
      const auth = await verifyRequestAuth(request);
      const db = getDb();
      if (auth && db) {
        let docRef = db.collection("users").doc(auth.uid).collection("scripts").doc(id);
        let snapshot = await docRef.get();
        if (!snapshot.exists) {
          docRef = db.collection("scripts").doc(id);
          snapshot = await docRef.get();
        }
        if (!snapshot.exists) {
          return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
        }

        const raw = snapshot.data() as Record<string, unknown> | undefined;
        const owner = typeof raw?.userId === "string" ? (raw.userId as string) : undefined;
        if (owner && owner !== auth.uid) {
          return NextResponse.json({ success: false, error: "Forbidden" } satisfies ScriptResponse, { status: 403 });
        }

        await docRef.set({ ...(raw || {}), ...updates, updatedAt: new Date() }, { merge: true });
        const existing = formatScriptDoc(snapshot);
        const updated: Script = {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, script: updated } satisfies ScriptResponse);
      }
    } catch (error) {
      console.warn("[scripts] Firestore PUT failed, fallback JSON:", (error as Error)?.message);
    }

    const scripts = readScripts();
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
    }

    const updated: Script = {
      ...scripts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    scripts[idx] = updated;
    writeScripts(scripts);

    return NextResponse.json({ success: true, script: updated } satisfies ScriptResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ success: false, error: message } satisfies ScriptResponse, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const auth = await verifyRequestAuth(request);
    const db = getDb();
    if (auth && db) {
      let docRef = db.collection("users").doc(auth.uid).collection("scripts").doc(id);
      let snapshot = await docRef.get();
      if (!snapshot.exists) {
        docRef = db.collection("scripts").doc(id);
        snapshot = await docRef.get();
      }
      if (!snapshot.exists) {
        return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
      }

      const raw = snapshot.data() as Record<string, unknown> | undefined;
      const owner = typeof raw?.userId === "string" ? (raw.userId as string) : undefined;
      if (owner && owner !== auth.uid) {
        return NextResponse.json({ success: false, error: "Forbidden" } satisfies ScriptResponse, { status: 403 });
      }

      await docRef.delete();
      return NextResponse.json({ success: true } satisfies ScriptResponse);
    }
  } catch (error) {
    console.warn("[scripts] Firestore DELETE failed, fallback JSON:", (error as Error)?.message);
  }

  const scripts = readScripts();
  const idx = scripts.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ success: false, error: "Not found" } satisfies ScriptResponse, { status: 404 });
  }
  scripts.splice(idx, 1);
  writeScripts(scripts);
  return NextResponse.json({ success: true } satisfies ScriptResponse);
}

