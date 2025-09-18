import type { ContentItem } from '@/types';

export function buildEditorSearchParams(item: ContentItem): URLSearchParams {
  const params = new URLSearchParams();
  params.set('title', item.title);

  const scriptContent =
    item.type === 'script' && typeof item.metadata?.content === 'string'
      ? item.metadata.content
      : undefined;
  const fallbackContent = item.description ?? '';
  const contentForEditor = scriptContent?.trim()
    ? scriptContent
    : fallbackContent;

  if (contentForEditor) {
    params.set('content', contentForEditor);
  }

  if (item.type === 'script') {
    params.set('scriptId', item.id);
  }

  params.set('source', 'library');

  return params;
}

export function getEditorPath(item: ContentItem): string {
  const params = buildEditorSearchParams(item);
  return `/editor?${params.toString()}`;
}
