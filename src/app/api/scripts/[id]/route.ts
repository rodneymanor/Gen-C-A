import { NextRequest, NextResponse } from "next/server";
import type { CollectionReference, DocumentReference, Firestore } from "firebase-admin/firestore";

import { getCollectionRefByPath, getDb } from "@/api-routes/utils/firebase-admin.js";
import type { ScriptResponse, UpdateScriptRequest } from "@/types/script";
import { formatScriptDoc, verifyRequestAuth } from "../utils";

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function sanitizeScriptUpdates(updates: UpdateScriptRequest): Record<string, unknown> {
  const sanitized = stripUndefined({ ...updates });

  if (Array.isArray(updates.tags)) {
    sanitized.tags = updates.tags.map(String);
  }

  return sanitized;
}

async function resolveScriptDocRef(
  db: Firestore,
  uid: string,
  id: string,
): Promise<DocumentReference | null> {
  let docRef: DocumentReference | null = db
    .collection("users")
    .doc(uid)
    .collection("scripts")
    .doc(id);
  let snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  docRef = db.collection("scripts").doc(id);
  snapshot = await docRef.get();
  if (snapshot.exists) {
    return docRef;
  }

  const configuredPath = process.env.CONTENT_SCRIPTS_PATH;
  if (configuredPath) {
    const collection = getCollectionRefByPath(db, configuredPath, uid) as CollectionReference | null;
    if (collection) {
      try {
        const configuredDoc = collection.doc(id);
        const configuredSnapshot = await configuredDoc.get();
        if (configuredSnapshot.exists) {
          return configuredDoc;
        }
      } catch (error) {
        console.warn(
          "[scripts] resolveScriptDocRef configured path failed:",
          (error as Error)?.message,
        );
      }
    }
  }

  return null;
}

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

    const docRef = await resolveScriptDocRef(db, auth.uid, id);
    if (!docRef) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const script = formatScriptDoc(snapshot);
    const owner = typeof script.userId === "string" ? script.userId : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies ScriptResponse,
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: true, script } satisfies ScriptResponse,
    );
  } catch (error) {
    console.error("[scripts] Failed to fetch script:", (error as Error)?.message);
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
  let updates: UpdateScriptRequest;

  try {
    updates = (await request.json()) as UpdateScriptRequest;
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

    const docRef = await resolveScriptDocRef(db, auth.uid, id);
    if (!docRef) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const raw = snapshot.data() as Record<string, unknown> | undefined;
    const owner = typeof raw?.userId === "string" ? (raw.userId as string) : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies ScriptResponse,
        { status: 403 },
      );
    }

    const sanitized = sanitizeScriptUpdates(updates);
    const nextUpdatedAt = new Date();

    await docRef.set({ ...sanitized, updatedAt: nextUpdatedAt }, { merge: true });

    const updatedSnapshot = await docRef.get();
    const script = formatScriptDoc(updatedSnapshot);

    return NextResponse.json(
      { success: true, script } satisfies ScriptResponse,
    );
  } catch (error) {
    console.error("[scripts] Failed to update script:", (error as Error)?.message);
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

    const docRef = await resolveScriptDocRef(db, auth.uid, id);
    if (!docRef) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies ScriptResponse,
        { status: 404 },
      );
    }

    const raw = snapshot.data() as Record<string, unknown> | undefined;
    const owner = typeof raw?.userId === "string" ? (raw.userId as string) : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies ScriptResponse,
        { status: 403 },
      );
    }

    await docRef.delete();

    return NextResponse.json(
      { success: true } satisfies ScriptResponse,
    );
  } catch (error) {
    console.error("[scripts] Failed to delete script:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to delete script." } satisfies ScriptResponse,
      { status: 500 },
    );
  }
}
