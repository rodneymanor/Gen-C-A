import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";

interface VoiceNoteTokenUsage {
  noteId: string;
  service: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  audioDuration?: number;
  language?: string;
  timestamp: string;
}

/**
 * Track token usage for voice note transcription
 */
async function trackVoiceNoteTokenUsage(userId: string, usage: VoiceNoteTokenUsage): Promise<void> {
  try {
    // Store in voice_note_token_usage collection for detailed tracking
    await adminDb.collection("voice_note_token_usage").add({
      userId,
      ...usage,
      createdAt: new Date().toISOString(),
    });

    // Update user's monthly token usage summary
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const userStatsRef = adminDb.collection("user_voice_stats").doc(`${userId}_${currentMonth}`);

    await adminDb.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
      const doc = (await transaction.get(
        userStatsRef,
      )) as unknown as FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;

      if (doc.exists) {
        const data = doc.data();
        transaction.update(userStatsRef, {
          totalTokens: (data?.totalTokens ?? 0) + usage.totalTokens,
          totalNotes: (data?.totalNotes ?? 0) + 1,
          totalAudioDuration: (data?.totalAudioDuration ?? 0) + (usage.audioDuration ?? 0),
          lastUsedAt: usage.timestamp,
        });
      } else {
        transaction.set(userStatsRef, {
          userId,
          month: currentMonth,
          totalTokens: usage.totalTokens,
          totalNotes: 1,
          totalAudioDuration: usage.audioDuration ?? 0,
          firstUsedAt: usage.timestamp,
          lastUsedAt: usage.timestamp,
          createdAt: new Date().toISOString(),
        });
      }
    });

    console.log(`📊 [Token Usage] Tracked ${usage.totalTokens} tokens for user ${userId}`);
  } catch (error) {
    console.error(`❌ [Token Usage] Failed to track usage:`, error);
    throw error;
  }
}

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
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface CreateNoteRequest {
  title: string;
  content: string;
  url?: string;
  type?: "text" | "youtube" | "webpage" | "video" | "voice";
  tags?: string[];
  metadata?: ChromeNote["metadata"];
}

interface NotesResponse {
  success: boolean;
  notes?: ChromeNote[];
  note?: ChromeNote;
  error?: string;
  count?: number;
}

/**
 * GET /api/chrome-extension/notes
 * Retrieves notes for Chrome extension
 * Query parameters:
 * - noteId: specific note ID to retrieve (optional)
 * - limit: number (default: 50, max: 100)
 * - type: filter by note type (text, youtube, webpage, video, voice)
 * - search: search in title/content
 * - tags: comma-separated tags to filter by
 */
export async function GET(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  try {
    console.log("📝 [Chrome Extension Notes] Starting notes retrieval");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<NotesResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const type = searchParams.get("type") as ChromeNote["type"] | null;
    const search = searchParams.get("search");
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()) : null;

    // If noteId is provided, return specific note
    if (noteId) {
      console.log(`👤 [Chrome Extension Notes] Fetching specific note ${noteId} for user: ${userId}`);

      const noteDoc = await adminDb.collection("chrome_extension_notes").doc(noteId).get();

      if (!noteDoc.exists) {
        return NextResponse.json(
          {
            success: false,
            error: "Note not found",
          },
          { status: 404 },
        );
      }

      const noteData = noteDoc.data() as ChromeNote;
      if (noteData.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
          },
          { status: 403 },
        );
      }

      const note: ChromeNote = {
        id: noteDoc.id,
        ...noteData,
      };

      console.log(`✅ [Chrome Extension Notes] Retrieved specific note: ${noteId}`);

      return NextResponse.json({
        success: true,
        note,
      });
    }

    console.log(`👤 [Chrome Extension Notes] Fetching notes for user: ${userId}`, {
      limit,
      type,
      search,
      tags,
    });

    // Build Firestore query
    let query = adminDb
      .collection("chrome_extension_notes")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(limit);

    // Apply type filter if specified
    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    let notes: ChromeNote[] = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      }),
    ) as ChromeNote[];

    // Apply client-side filters (since Firestore has limited querying)
    if (search) {
      const searchLower = search.toLowerCase();
      notes = notes.filter(
        (note) => note.title.toLowerCase().includes(searchLower) || note.content.toLowerCase().includes(searchLower),
      );
    }

    if (tags && tags.length > 0) {
      notes = notes.filter((note) => note.tags && tags.some((tag) => note.tags!.includes(tag)));
    }

    console.log(`✅ [Chrome Extension Notes] Retrieved ${notes.length} notes`);

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error("❌ [Chrome Extension Notes] Error retrieving notes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve notes",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chrome-extension/notes
 * Creates a new note from Chrome extension
 */
export async function POST(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  try {
    console.log("📝 [Chrome Extension Notes] Starting note creation");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<NotesResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse request body
    const body: CreateNoteRequest = await request.json();
    const { title, content, url, type = "text", tags = [], metadata = {} } = body;

    // Validate required fields
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and content are required",
        },
        { status: 400 },
      );
    }

    console.log(`👤 [Chrome Extension Notes] Creating note for user: ${userId}`, {
      title: title.substring(0, 50),
      type,
      hasUrl: !!url,
      tagsCount: tags.length,
      hasVoiceMetadata: type === "voice" && metadata?.voiceMetadata,
    });

    // Prepare note data
    const now = new Date().toISOString();
    const noteData: Omit<ChromeNote, "id"> = {
      title: title.trim(),
      content: content.trim(),
      url: url?.trim(),
      type,
      tags: tags.filter((tag) => tag.trim()),
      metadata: {
        ...metadata,
        domain: url ? new URL(url).hostname : undefined,
      },
      createdAt: now,
      updatedAt: now,
      userId,
    };

    // Save to Firestore
    const docRef = await adminDb.collection("chrome_extension_notes").add(noteData);

    const savedNote: ChromeNote = {
      id: docRef.id,
      ...noteData,
    };

    // Track token usage for voice notes
    if (type === "voice" && metadata?.voiceMetadata?.totalTokens) {
      try {
        await trackVoiceNoteTokenUsage(userId, {
          noteId: docRef.id,
          service: metadata.voiceMetadata.transcriptionService ?? "gemini",
          inputTokens: metadata.voiceMetadata.inputTokens ?? 0,
          outputTokens: metadata.voiceMetadata.outputTokens ?? 0,
          totalTokens: metadata.voiceMetadata.totalTokens,
          audioDuration: metadata.voiceMetadata.originalAudioDuration,
          language: metadata.voiceMetadata.language,
          timestamp: now,
        });
        console.log(`📊 [Chrome Extension Notes] Token usage tracked for voice note: ${docRef.id}`);
      } catch (tokenError) {
        console.error(`❌ [Chrome Extension Notes] Failed to track token usage:`, tokenError);
        // Don't fail the note creation if token tracking fails
      }
    }

    console.log(`✅ [Chrome Extension Notes] Note created successfully: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      note: savedNote,
    });
  } catch (error) {
    console.error("❌ [Chrome Extension Notes] Error creating note:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create note",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/chrome-extension/notes
 * Updates an existing note
 * Requires noteId in request body
 */
export async function PUT(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  try {
    console.log("📝 [Chrome Extension Notes] Starting note update");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<NotesResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse request body
    const body = await request.json();
    const { noteId, title, content, tags, metadata } = body;

    if (!noteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Note ID is required",
        },
        { status: 400 },
      );
    }

    console.log(`👤 [Chrome Extension Notes] Updating note ${noteId} for user: ${userId}`);

    // Get existing note and verify ownership
    const noteDoc = await adminDb.collection("chrome_extension_notes").doc(noteId).get();

    if (!noteDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Note not found",
        },
        { status: 404 },
      );
    }

    const existingNote = noteDoc.data() as ChromeNote;
    if (existingNote.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 },
      );
    }

    // Prepare update data
    const updateData: Partial<ChromeNote> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = tags.filter((tag: string) => tag.trim());
    if (metadata !== undefined) updateData.metadata = { ...existingNote.metadata, ...metadata };

    // Update in Firestore
    await adminDb.collection("chrome_extension_notes").doc(noteId).update(updateData);

    const updatedNote: ChromeNote = {
      ...existingNote,
      ...updateData,
      id: noteId,
    };

    console.log(`✅ [Chrome Extension Notes] Note updated successfully: ${noteId}`);

    return NextResponse.json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    console.error("❌ [Chrome Extension Notes] Error updating note:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update note",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/chrome-extension/notes
 * Deletes a note
 * Requires noteId in query parameters
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<NotesResponse>> {
  try {
    console.log("📝 [Chrome Extension Notes] Starting note deletion");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<NotesResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Get noteId from query parameters
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Note ID is required",
        },
        { status: 400 },
      );
    }

    console.log(`👤 [Chrome Extension Notes] Deleting note ${noteId} for user: ${userId}`);

    // Get existing note and verify ownership
    const noteDoc = await adminDb.collection("chrome_extension_notes").doc(noteId).get();

    if (!noteDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Note not found",
        },
        { status: 404 },
      );
    }

    const existingNote = noteDoc.data() as ChromeNote;
    if (existingNote.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 },
      );
    }

    // Delete from Firestore
    await adminDb.collection("chrome_extension_notes").doc(noteId).delete();

    console.log(`✅ [Chrome Extension Notes] Note deleted successfully: ${noteId}`);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ [Chrome Extension Notes] Error deleting note:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete note",
      },
      { status: 500 },
    );
  }
}
