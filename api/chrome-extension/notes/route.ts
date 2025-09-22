import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  ChromeExtensionNotesServiceError,
  getChromeExtensionNotesService,
} from "@/services/chrome-extension/chrome-extension-notes-service.js";

interface ChromeNote {
  id?: string;
  title: string;
  content: string;
  url?: string;
  type: "text" | "youtube" | "webpage" | "video" | "voice";
  tags?: string[];
  metadata?: {
    domain?: string;
    favicon?: string;
    videoId?: string;
    duration?: number;
    channelName?: string;
    publishedAt?: string;
    voiceMetadata?: {
      originalAudioDuration?: number;
      transcriptionService?: "gemini";
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      language?: string;
      confidence?: number;
    };
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface NotesResponse {
  success: boolean;
  notes?: ChromeNote[];
  note?: ChromeNote;
  error?: string;
  count?: number;
}

function resolveNotesService() {
  const firestore = getAdminDb();
  return getChromeExtensionNotesService({ firestore });
}

function parseLimit(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildListOptions(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const options: {
    noteId?: string;
    limit?: number;
    type?: string;
    search?: string;
    tags?: string;
  } = {};

  const noteId = params.get("noteId");
  if (noteId) options.noteId = noteId;

  const limit = parseLimit(params.get("limit"));
  if (limit !== undefined) options.limit = limit;

  const type = params.get("type");
  if (type) options.type = type;

  const search = params.get("search");
  if (search) options.search = search;

  const tags = params.get("tags");
  if (tags) options.tags = tags;

  return options;
}

function normalizePayload(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function respondWithServiceError(
  context: string,
  error: unknown,
  fallbackMessage: string,
): NextResponse<NotesResponse> {
  if (error instanceof ChromeExtensionNotesServiceError) {
    console.warn(`${context} service error: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(`${context} unexpected error:`, details);
  return NextResponse.json({ success: false, error: fallbackMessage }, { status: 500 });
}

export async function GET(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<NotesResponse>;
  }

  const { user } = authResult;

  try {
    const service = resolveNotesService();
    const result = await service.listNotes(user.uid, buildListOptions(request));
    return NextResponse.json(result);
  } catch (error) {
    return respondWithServiceError(
      "[Chrome Extension Notes] GET",
      error,
      "Failed to retrieve notes",
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<NotesResponse>;
  }

  const { user } = authResult;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const service = resolveNotesService();
    const result = await service.createNote(user.uid, normalizePayload(body));
    return NextResponse.json(result);
  } catch (error) {
    return respondWithServiceError("[Chrome Extension Notes] POST", error, "Failed to create note");
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<NotesResponse>;
  }

  const { user } = authResult;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const service = resolveNotesService();
    const result = await service.updateNote(user.uid, normalizePayload(body));
    return NextResponse.json(result);
  } catch (error) {
    return respondWithServiceError("[Chrome Extension Notes] PUT", error, "Failed to update note");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<NotesResponse>;
  }

  const { user } = authResult;
  const params = new URL(request.url).searchParams;
  const noteId = params.get("noteId");

  try {
    const service = resolveNotesService();
    const result = await service.deleteNote(user.uid, noteId ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    return respondWithServiceError("[Chrome Extension Notes] DELETE", error, "Failed to delete note");
  }
}
