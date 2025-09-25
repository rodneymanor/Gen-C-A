import type { DocumentReference } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { AIAnalysisService, type ScriptComponents } from './ai-analysis-service';
import { TranscriptionService } from './transcription-service';

interface TranscriptionTaskOptions {
  videoId: string;
  sourceUrl?: string | null;
  platform?: string | null;
  skipAnalysis?: boolean;
}

const transcriptionService = new TranscriptionService();
const aiAnalysisService = new AIAnalysisService();

export function queueTranscriptionTask(options: TranscriptionTaskOptions): void {
  setImmediate(() => runTranscriptionTask(options).catch((error) => {
    console.error('[transcription-runner] Unhandled transcription error:', error);
  }));
}

async function runTranscriptionTask({
  videoId,
  sourceUrl,
  platform,
  skipAnalysis,
}: TranscriptionTaskOptions): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    console.warn('[transcription-runner] Firestore not initialized; skipping transcription');
    return;
  }

  const docRef = db.collection('videos').doc(String(videoId));
  const nowIso = new Date().toISOString();

  await docRef.set(
    {
      transcriptionStatus: 'processing',
      updatedAt: nowIso,
      metadata: {
        transcriptionStatus: 'processing',
        transcriptionQueuedAt: nowIso,
        transcriptionError: null,
      },
    },
    { merge: true },
  );

  if (!sourceUrl) {
    await markTranscriptionFailed(docRef, 'No source URL available for transcription');
    return;
  }

  try {
    const transcriptionResult = await transcriptionService.transcribeFromUrl(sourceUrl, platform || 'other');

    if (!transcriptionResult || !transcriptionResult.transcript?.trim()) {
      throw new Error('Transcription service returned an empty transcript');
    }

    const isFallback = Boolean(transcriptionResult.transcriptionMetadata?.fallbackUsed);
    let components = transcriptionResult.components;

    if ((!components || isFallback) && !skipAnalysis) {
      try {
        const aiComponents = await aiAnalysisService.analyzeScriptComponents(transcriptionResult.transcript);
        if (aiComponents) {
          components = aiComponents;
        }
      } catch (analysisError) {
        console.warn('[transcription-runner] Script analysis failed, falling back to heuristic split:', analysisError);
      }
    }

    if (!components) {
      components = createHeuristicComponents(transcriptionResult.transcript);
    }

    const snapshot = await docRef.get();
    const existing = snapshot.exists ? (snapshot.data() ?? {}) : {};

    const existingContentMetadata = (existing.contentMetadata ?? {}) as Record<string, unknown>;
    const mergedContentMetadata = {
      ...existingContentMetadata,
      ...(transcriptionResult.contentMetadata ?? {}),
    };

    const existingMetadata = (existing.metadata ?? {}) as Record<string, unknown>;
    const mergedMetadataContent = {
      ...(existingMetadata.contentMetadata ?? {}),
      ...(transcriptionResult.contentMetadata ?? {}),
    };

    const completedAt = new Date().toISOString();

    const updates: Record<string, unknown> = {
      transcript: transcriptionResult.transcript,
      components,
      transcriptionStatus: 'completed',
      visualContext: transcriptionResult.visualContext || existing.visualContext,
      contentMetadata: mergedContentMetadata,
      updatedAt: completedAt,
      metadata: {
        ...existingMetadata,
        transcript: transcriptionResult.transcript,
        scriptComponents: components,
        components,
        transcriptionStatus: 'completed',
        transcriptionCompletedAt: completedAt,
        transcriptionMetadata: transcriptionResult.transcriptionMetadata,
        transcriptionSourceUrl: sourceUrl,
        transcriptionError: null,
        contentMetadata: mergedMetadataContent,
        visualContext: transcriptionResult.visualContext || existingMetadata.visualContext,
      },
    };

    await docRef.set(updates, { merge: true });
  } catch (error) {
    console.error('[transcription-runner] Transcription failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown transcription error';
    await markTranscriptionFailed(docRef, message);
  }
}

async function markTranscriptionFailed(docRef: DocumentReference, message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  await docRef.set(
    {
      transcriptionStatus: 'failed',
      updatedAt: timestamp,
      metadata: {
        transcriptionStatus: 'failed',
        transcriptionError: message,
        transcriptionFailedAt: timestamp,
      },
    },
    { merge: true },
  );
}

function createHeuristicComponents(transcript: string): ScriptComponents {
  const cleaned = transcript.trim();
  if (!cleaned) {
    return {
      hook: '',
      bridge: '',
      nugget: '',
      wta: '',
    };
  }

  const sentences = cleaned
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunkSize = Math.max(1, Math.ceil(sentences.length / 4));

  const hook = sentences.slice(0, chunkSize).join(' ');
  const bridge = sentences.slice(chunkSize, chunkSize * 2).join(' ');
  const nugget = sentences.slice(chunkSize * 2, chunkSize * 3).join(' ');
  const wta = sentences.slice(chunkSize * 3).join(' ') || sentences.slice(-chunkSize).join(' ');

  return {
    hook,
    bridge,
    nugget,
    wta,
  };
}
