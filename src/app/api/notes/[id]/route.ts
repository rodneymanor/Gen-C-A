import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/api-routes/utils/firebase-admin.js";
import { verifyRequestAuth } from "@/app/api/utils/auth";
import { getNotesService, NotesServiceError } from "@/services/notes/notes-service.js";
import type { NoteRecord } from "../types";

interface NoteResponse {
  success: boolean;
  note?: NoteRecord;
  error?: string;
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

    const service = getNotesService(db);
    const note = await service.getNoteById(auth.uid, id);
    return NextResponse.json(
      { success: true, note } satisfies NoteResponse,
    );
  } catch (error) {
    if (error instanceof NotesServiceError) {
      console.warn("[notes] Service error while fetching note:", error.message);
      return NextResponse.json(
        { success: false, error: error.message } satisfies NoteResponse,
        { status: error.statusCode },
      );
    }
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

    const service = getNotesService(db);
    const note = await service.updateNote(auth.uid, id, body);
    return NextResponse.json(
      { success: true, note } satisfies NoteResponse,
    );
  } catch (error) {
    if (error instanceof NotesServiceError) {
      console.warn("[notes] Service error while updating note:", error.message);
      return NextResponse.json(
        { success: false, error: error.message } satisfies NoteResponse,
        { status: error.statusCode },
      );
    }
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

    const service = getNotesService(db);
    await service.deleteNote(auth.uid, id);

    return NextResponse.json(
      { success: true } satisfies NoteResponse,
    );
  } catch (error) {
    if (error instanceof NotesServiceError) {
      console.warn("[notes] Service error while deleting note:", error.message);
      return NextResponse.json(
        { success: false, error: error.message } satisfies NoteResponse,
        { status: error.statusCode },
      );
    }
    console.error("[notes] Failed to delete note:", (error as Error)?.message);
    return NextResponse.json(
      { success: false, error: "Failed to delete note." } satisfies NoteResponse,
      { status: 500 },
    );
  }
}
