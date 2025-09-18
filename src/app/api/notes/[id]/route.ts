import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { verifyRequestAuth } from "@/app/api/scripts/utils";
import type { NoteRecord } from "../utils";
import { findNoteById, formatNoteDoc, resolveNoteDocRef } from "../utils";

interface NoteResponse {
  success: boolean;
  note?: NoteRecord;
  error?: string;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
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
        { success: false, error: "Authentication required to load notes." } satisfies NoteResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies NoteResponse,
        { status: 503 },
      );
    }

    const note = await findNoteById(db, auth.uid, id);
    if (!note) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies NoteResponse,
        { status: 404 },
      );
    }

    const owner = typeof note.userId === "string" ? note.userId : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies NoteResponse,
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: true, note } satisfies NoteResponse,
    );
  } catch (error) {
    console.error("[notes] Failed to fetch note:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to load note." } satisfies NoteResponse,
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json(
      { success: false, error: message } satisfies NoteResponse,
      { status: 400 },
    );
  }

  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update notes." } satisfies NoteResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies NoteResponse,
        { status: 503 },
      );
    }

    const docRef = await resolveNoteDocRef(db, auth.uid, id);
    if (!docRef) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies NoteResponse,
        { status: 404 },
      );
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies NoteResponse,
        { status: 404 },
      );
    }

    const data = snapshot.data() as Record<string, unknown> | undefined;
    const owner = typeof data?.userId === "string" ? (data.userId as string) : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies NoteResponse,
        { status: 403 },
      );
    }

    const normalized = stripUndefined({ ...body });
    if (Array.isArray(body.tags)) {
      normalized.tags = body.tags.map(String);
    }
    if (typeof body.starred === "boolean") {
      normalized.starred = body.starred;
    }

    const nextUpdatedAt = new Date();
    await docRef.set({ ...normalized, updatedAt: nextUpdatedAt }, { merge: true });

    const updatedSnapshot = await docRef.get();
    const note = formatNoteDoc(updatedSnapshot);

    return NextResponse.json(
      { success: true, note } satisfies NoteResponse,
    );
  } catch (error) {
    console.error("[notes] Failed to update note:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to update note." } satisfies NoteResponse,
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
        { success: false, error: "Authentication required to delete notes." } satisfies NoteResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies NoteResponse,
        { status: 503 },
      );
    }

    const docRef = await resolveNoteDocRef(db, auth.uid, id);
    if (!docRef) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies NoteResponse,
        { status: 404 },
      );
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Not found" } satisfies NoteResponse,
        { status: 404 },
      );
    }

    const data = snapshot.data() as Record<string, unknown> | undefined;
    const owner = typeof data?.userId === "string" ? (data.userId as string) : undefined;
    if (owner && owner !== auth.uid) {
      return NextResponse.json(
        { success: false, error: "Forbidden" } satisfies NoteResponse,
        { status: 403 },
      );
    }

    await docRef.delete();

    return NextResponse.json(
      { success: true } satisfies NoteResponse,
    );
  } catch (error) {
    console.error("[notes] Failed to delete note:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to delete note." } satisfies NoteResponse,
      { status: 500 },
    );
  }
}
