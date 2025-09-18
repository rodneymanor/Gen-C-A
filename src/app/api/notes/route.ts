import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { verifyRequestAuth } from "@/app/api/scripts/utils";
import type { NoteRecord } from "./utils";
import { fetchUserNotes, persistNote } from "./utils";

interface NotesResponse {
  success: boolean;
  notes?: NoteRecord[];
  error?: string;
}

interface NoteResponse {
  success: boolean;
  note?: NoteRecord;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to load notes." } satisfies NotesResponse,
        { status: 401 },
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Content service is unavailable. Please try again later." } satisfies NotesResponse,
        { status: 503 },
      );
    }

    const notes = await fetchUserNotes(db, auth.uid);
    return NextResponse.json(
      { success: true, notes } satisfies NotesResponse,
    );
  } catch (error) {
    console.error("[notes] Failed to fetch notes:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to load notes." } satisfies NotesResponse,
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
      { success: false, error: message } satisfies NoteResponse,
      { status: 400 },
    );
  }

  try {
    const auth = await verifyRequestAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required to save notes." } satisfies NoteResponse,
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

    const notePayload: Record<string, unknown> = {
      title: (body.title ?? "Untitled").toString(),
      content: (body.content ?? "").toString(),
      type: (body.type ?? "text").toString(),
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      starred: Boolean(body.starred),
    };

    const saved = await persistNote(db, auth.uid, notePayload);
    return NextResponse.json(
      { success: true, note: saved } satisfies NoteResponse,
    );
  } catch (error) {
    console.error("[notes] Failed to save note:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to save note to Firestore." } satisfies NoteResponse,
      { status: 500 },
    );
  }
}
