import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { verifyRequestAuth } from "@/app/api/utils/auth";
import { getNotesService, NotesServiceError } from "@/services/notes/notes-service.js";
import type { NoteRecord } from "./types";

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

    const service = getNotesService(db);
    const notes = await service.listNotes(auth.uid);
    return NextResponse.json(
      { success: true, notes } satisfies NotesResponse,
    );
  } catch (unknownError) {
    if (unknownError instanceof NotesServiceError) {
      console.warn("[notes] Service error while fetching notes:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies NotesResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to load notes.';
    console.error("[notes] Failed to fetch notes:", message);
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

    const service = getNotesService(db);
    const saved = await service.createNote(auth.uid, body);
    return NextResponse.json(
      { success: true, note: saved } satisfies NoteResponse,
    );
  } catch (unknownError) {
    if (unknownError instanceof NotesServiceError) {
      console.warn("[notes] Service error while saving note:", unknownError.message);
      return NextResponse.json(
        { success: false, error: unknownError.message } satisfies NoteResponse,
        { status: unknownError.statusCode },
      );
    }
    const message = unknownError instanceof Error ? unknownError.message : 'Failed to save note to Firestore.';
    console.error("[notes] Failed to save note:", message);
    return NextResponse.json(
      { success: false, error: "Failed to save note to Firestore." } satisfies NoteResponse,
      { status: 500 },
    );
  }
}
