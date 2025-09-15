import type { ContentItem } from "@/types";
import { ReactDebugger, DEBUG_LEVELS } from "@/utils/debugger";
import { auth } from "@/lib/firebase";

// Static JSON imports for transcripts and creator data
// Note: resolveJsonModule is enabled, so JSON can be imported.
// If you add more creators, import them here and extend the mapping.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON types are dynamic
import aronsogi from "../../data/creators/aronsogi.json";

type CreatorTranscriptJson = {
  creatorId: string;
  name?: string;
  handle?: string;
  transcriptsCount?: number;
  perTranscript?: Array<{
    index: number;
    hook?: { text?: string; type?: string; duration?: number };
    bridge?: { text?: string };
    goldenNugget?: { text?: string };
    cta?: { text?: string | null };
    microHooks?: any[];
  }>;
  savedAt?: string;
};

function mapTranscriptsToItems(json: CreatorTranscriptJson): ContentItem[] {
  const savedAt = json.savedAt ? new Date(json.savedAt) : new Date();
  const creatorName = json.name || json.handle || json.creatorId;

  const items: ContentItem[] = (json.perTranscript || []).map((t) => {
    const title = t.hook?.text?.trim() || `Transcript #${t.index}`;
    const description =
      t.goldenNugget?.text?.trim() ||
      t.bridge?.text?.trim() ||
      t.cta?.text?.toString()?.trim() ||
      "";

    return {
      id: `${json.creatorId}-${t.index}`,
      title,
      description,
      type: "video", // Transcripts originate from short-form videos
      platform: "tiktok", // Best-effort default for this creator
      tags: ["transcript", "short-form"],
      creator: creatorName,
      created: savedAt,
      updated: savedAt,
      status: "published",
      metadata: {
        transcriptIndex: t.index,
        hookType: t.hook?.type,
        hookDuration: t.hook?.duration,
        creatorId: json.creatorId,
      },
    } satisfies ContentItem;
  });

  return items;
}

function mapScriptToItem(s: any): ContentItem {
  const created = s.createdAt ? new Date(s.createdAt) : new Date();
  const updated = s.updatedAt ? new Date(s.updatedAt) : created;
  return {
    id: s.id,
    title: s.title || "Untitled Script",
    description: s.summary || (s.content || "").slice(0, 160),
    type: "script",
    platform: s.platform || "other",
    wordCount: s.wordCount || (s.content ? String(s.content).trim().split(/\s+/).length : undefined),
    tags: Array.isArray(s.tags) ? s.tags : [],
    creator: s.authors || undefined,
    created,
    updated,
    status: (s.status === "published" || s.status === "draft" || s.status === "archived") ? s.status : "draft",
    metadata: {
      approach: s.approach,
      fileType: s.fileType,
      duration: s.duration,
      source: s.source,
      characterCount: s.characterCount,
    },
  } satisfies ContentItem;
}

function mapNoteToItem(n: any): ContentItem {
  const created = n.createdAt ? new Date(n.createdAt) : new Date();
  const updated = n.updatedAt ? new Date(n.updatedAt) : created;
  return {
    id: n.id,
    title: n.title || "Untitled Note",
    description: n.content ? String(n.content).slice(0, 200) : "",
    type: "note",
    tags: Array.isArray(n.tags) ? n.tags : [],
    created,
    updated,
    status: n.starred ? "published" : "draft",
    metadata: { starred: !!n.starred, userId: n.userId },
  } satisfies ContentItem;
}

export async function getLibraryContent(): Promise<ContentItem[]> {
  const debug = new ReactDebugger("LibraryData", { level: DEBUG_LEVELS.DEBUG });
  const transcriptSources: CreatorTranscriptJson[] = [aronsogi];
  const transcriptItems = transcriptSources.flatMap(mapTranscriptsToItems);

  let scriptItems: ContentItem[] = [];
  let noteItems: ContentItem[] = [];

  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken(true) : null;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Client": "library",
    };
    debug.info("Fetching scripts from /api/scripts", { hasAuth: !!token });
    const res = await fetch("/api/scripts", { cache: "no-store" as any, headers });
    if (res.ok) {
      const data = await res.json();
      debug.debug("/api/scripts response", { status: res.status, count: Array.isArray(data?.scripts) ? data.scripts.length : 0 });
      if (data && Array.isArray(data.scripts)) {
        scriptItems = data.scripts.map(mapScriptToItem);
      }
    }
  } catch {}

  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken(true) : null;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Client": "library",
    };
    debug.info("Fetching notes from /api/notes", { hasAuth: !!token });
    const res = await fetch("/api/notes", { cache: "no-store" as any, headers });
    if (res.ok) {
      const data = await res.json();
      debug.debug("/api/notes response", { status: res.status, count: Array.isArray(data?.notes) ? data.notes.length : 0 });
      if (data && Array.isArray(data.notes)) {
        noteItems = data.notes.map(mapNoteToItem);
      }
    }
  } catch (err: any) {
    debug.error("Failed to fetch notes", { message: err?.message });
  }

  const all = [...scriptItems, ...noteItems, ...transcriptItems].sort((a, b) => b.created.getTime() - a.created.getTime());
  debug.info("Aggregated library content", {
    scripts: scriptItems.length,
    notes: noteItems.length,
    transcripts: transcriptItems.length,
    total: all.length,
  });
  return all;
}
