import type { ContentItem } from '@/types';
import { ReactDebugger, DEBUG_LEVELS } from '@/utils/debugger';
import { auth } from '@/lib/firebase';

function mapScriptToItem(script: any): ContentItem {
  const created = script.createdAt ? new Date(script.createdAt) : new Date();
  const updated = script.updatedAt ? new Date(script.updatedAt) : created;

  return {
    id: script.id,
    title: script.title || 'Untitled Script',
    description:
      script.summary ||
      (script.content ? String(script.content).slice(0, 160) : ''),
    type: 'script',
    platform: script.platform || 'other',
    wordCount: script.wordCount ||
      (script.content ? String(script.content).trim().split(/\s+/).length : undefined),
    tags: Array.isArray(script.tags) ? script.tags : [],
    creator: script.authors || undefined,
    created,
    updated,
    status:
      script.status === 'published' ||
      script.status === 'draft' ||
      script.status === 'archived'
        ? script.status
        : 'draft',
    metadata: {
      approach: script.approach,
      fileType: script.fileType,
      duration: script.duration,
      source: script.source,
      characterCount: script.characterCount,
      content: script.content,
      elements: script.elements,
      voice: script.voice,
    },
  } satisfies ContentItem;
}

function mapNoteToItem(note: any): ContentItem {
  const created = note.createdAt ? new Date(note.createdAt) : new Date();
  const updated = note.updatedAt ? new Date(note.updatedAt) : created;

  return {
    id: note.id,
    title: note.title || 'Untitled Note',
    description: note.content ? String(note.content).slice(0, 200) : '',
    type: 'note',
    tags: Array.isArray(note.tags) ? note.tags : [],
    created,
    updated,
    status: note.starred ? 'published' : 'draft',
    metadata: { starred: !!note.starred, userId: note.userId },
  } satisfies ContentItem;
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be signed in to load your library.');
  }

  const token = await currentUser.getIdToken(true);

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Client': 'library',
  };
}

export async function getLibraryContent(): Promise<ContentItem[]> {
  const debug = new ReactDebugger('LibraryService', { level: DEBUG_LEVELS.DEBUG });
  const headers = await buildAuthHeaders();

  const [scripts, notes] = await Promise.all([
    fetch('/api/scripts', { cache: 'no-store' as any, headers }),
    fetch('/api/notes', { cache: 'no-store' as any, headers }),
  ]);

  if (!scripts.ok) {
    const message = await resolveErrorMessage(scripts, 'Failed to load scripts');
    debug.error('Failed to fetch scripts', { message });
    throw new Error(message);
  }

  if (!notes.ok) {
    const message = await resolveErrorMessage(notes, 'Failed to load notes');
    debug.error('Failed to fetch notes', { message });
    throw new Error(message);
  }

  const scriptsPayload = await scripts.json();
  const notesPayload = await notes.json();

  if (!Array.isArray(scriptsPayload?.scripts)) {
    throw new Error('Unexpected scripts payload received from the server.');
  }

  if (!Array.isArray(notesPayload?.notes)) {
    throw new Error('Unexpected notes payload received from the server.');
  }

  const scriptItems = scriptsPayload.scripts.map(mapScriptToItem);
  const noteItems = notesPayload.notes.map(mapNoteToItem);

  debug.debug('Library content sample', {
    scripts: scriptItems.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.created.toISOString(),
      type: item.type,
    })),
    notes: noteItems.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.created.toISOString(),
      type: item.type,
    })),
  });

  return [...scriptItems, ...noteItems].sort(
    (a, b) => b.created.getTime() - a.created.getTime(),
  );
}

export async function deleteLibraryItem(item: ContentItem): Promise<void> {
  const debug = new ReactDebugger('LibraryService', { level: DEBUG_LEVELS.DEBUG });

  let endpoint: string | null = null;

  if (item.type === 'script') {
    endpoint = `/api/scripts/${item.id}`;
  } else if (item.type === 'note') {
    endpoint = `/api/notes/${item.id}`;
  }

  if (!endpoint) {
    debug.warn('Delete not supported for content type', { type: item.type });
    return;
  }

  const headers = await buildAuthHeaders();
  headers['X-Client'] = 'library-actions';

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    debug.error('Failed to delete content item', {
      id: item.id,
      status: response.status,
      message,
    });
    throw new Error(
      message || `Failed to delete content (status ${response.status})`,
    );
  }

  debug.info('Deleted content item', { id: item.id, type: item.type });
}

async function resolveErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const errorPayload = await response.json();
    if (errorPayload?.error) {
      return errorPayload.error;
    }
  } catch {
    try {
      const text = await response.text();
      if (text) {
        return text;
      }
    } catch {
      // ignore
    }
  }

  return `${fallback} (status ${response.status})`;
}
