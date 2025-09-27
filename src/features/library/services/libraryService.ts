import type { ContentItem } from '@/types';
import { ReactDebugger, DEBUG_LEVELS } from '@/utils/debugger';
import { auth } from '@/lib/firebase';
import { createApiClient } from '@/api/client';

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
  const headers = await buildAuthHeaders();
  const client = createApiClient('');

  const [scriptsRes, notesRes] = await Promise.all([
    client.GET('/api/scripts', { headers }),
    client.GET('/api/notes', { headers }),
  ]);

  if (scriptsRes.error) throw new Error('Failed to load scripts');
  if (notesRes.error) throw new Error('Failed to load notes');

  const scripts = Array.isArray(scriptsRes.data?.scripts)
    ? (scriptsRes.data?.scripts as any[])
    : [];
  const notes = Array.isArray(notesRes.data?.notes)
    ? (notesRes.data?.notes as any[])
    : [];

  return [...scripts.map(mapScriptToItem), ...notes.map(mapNoteToItem)];
}

export async function deleteLibraryItem(item: ContentItem): Promise<void> {
  const debug = new ReactDebugger('LibraryService', { level: DEBUG_LEVELS.DEBUG });

  const client = createApiClient('');

  if (item.type !== 'script' && item.type !== 'note') {
    debug.warn('Delete not supported for content type', { type: item.type });
    return;
  }

  const headers = await buildAuthHeaders();
  headers['X-Client'] = 'library-actions';

  if (item.type === 'script') {
    const { error } = await client.DELETE('/api/scripts/{id}', {
      params: { path: { id: item.id } },
      headers,
    });
    if (error) throw new Error('Failed to delete script');
  } else {
    const { error } = await client.DELETE('/api/notes/{id}', {
      params: { path: { id: item.id } },
      headers,
    });
    if (error) throw new Error('Failed to delete note');
  }

  debug.info('Deleted content item', { id: item.id, type: item.type });
}
