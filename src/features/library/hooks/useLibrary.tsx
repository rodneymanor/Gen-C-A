import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContentItem } from '@/types';
import { useDebugger, DEBUG_LEVELS } from '@/utils/debugger';
import { usePageLoad } from '@/contexts/PageLoadContext';
import { useAuth } from '@/contexts/AuthContext';
import { deleteLibraryItem, getLibraryContent } from '../services/libraryService';
import type { ContentType, LibraryFilter } from '../types';
import DocumentIcon from '@atlaskit/icon/glyph/document';
import EditIcon from '@atlaskit/icon/glyph/edit';

const FILTERS: LibraryFilter[] = [
  { key: 'all', label: 'All', icon: <DocumentIcon label="" /> },
  { key: 'scripts', label: 'Scripts', icon: <EditIcon label="" /> },
  { key: 'notes', label: 'Notes', icon: <DocumentIcon label="" /> },
];

type UseLibraryState = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeFilter: ContentType;
  setActiveFilter: (filter: ContentType) => void;
  filters: LibraryFilter[];
  filteredContent: ContentItem[];
  selectItem: (item: ContentItem | null) => void;
  selectedItem: ContentItem | null;
  checkedItemIds: string[];
  toggleItemChecked: (item: ContentItem, checked: boolean) => void;
  errorMessage: string | null;
  clearFilters: () => void;
  handleDeleteItem: (item: ContentItem) => Promise<void>;
  deletingItemId: string | null;
  refreshContent: () => Promise<void>;
};

export function useLibrary(): UseLibraryState {
  const debug = useDebugger('LibraryFeature', { level: DEBUG_LEVELS.DEBUG });
  const { beginPageLoad, endPageLoad } = usePageLoad();
  const { firebaseUser, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const pageLoadRef = useRef({ begin: beginPageLoad, end: endPageLoad });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    pageLoadRef.current = { begin: beginPageLoad, end: endPageLoad };
  }, [beginPageLoad, endPageLoad]);

  const refreshContent = useCallback(async () => {
    if (!firebaseUser) {
      debug.warn('Attempted to fetch library content without an authenticated user');
      setContent([]);
      setSelectedItem(null);
      setCheckedItemIds([]);
      setErrorMessage('Sign in to view your library content.');
      return;
    }

    debug.info('Fetching library content', { hasFirebaseUser: true });
    setErrorMessage(null);
    pageLoadRef.current.begin();

    try {
      const items = await getLibraryContent();
      if (!isMountedRef.current) {
        return;
      }

      setContent(items);
      setSelectedItem((prev) => {
        if (!prev) {
          return items[0] ?? null;
        }
        return items.find((item) => item.id === prev.id) ?? items[0] ?? null;
      });
      setCheckedItemIds((prev) => prev.filter((id) => items.some((item) => item.id === id)));
      debug.info('Library content loaded', { count: items.length });
    } catch (error: any) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error?.message ?? 'Failed to load library content.';
      debug.error('Failed to load library content', { message });
      setContent([]);
      setSelectedItem(null);
      setCheckedItemIds([]);
      setErrorMessage(message);
    } finally {
      pageLoadRef.current.end();
    }
  }, [debug, firebaseUser]);

  useEffect(() => {
    if (authLoading) {
      debug.debug('Auth loading; skipping library fetch');
      return;
    }

    if (!firebaseUser) {
      setContent([]);
      setSelectedItem(null);
      setCheckedItemIds([]);
      setErrorMessage('Sign in to view your library content.');
      return;
    }

    void refreshContent();
  }, [authLoading, firebaseUser, refreshContent, debug]);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const search = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'scripts' && item.type === 'script') ||
        (activeFilter === 'notes' && item.type === 'note');

      return matchesSearch && matchesFilter;
    });
  }, [content, searchQuery, activeFilter]);

  const selectItem = useCallback((item: ContentItem | null) => {
    setSelectedItem(item);
  }, []);

  const toggleItemChecked = useCallback((item: ContentItem, checked: boolean) => {
    setCheckedItemIds((prev) =>
      checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const handleDeleteItem = useCallback(
    async (item: ContentItem) => {
      try {
        setDeletingItemId(item.id);
        await deleteLibraryItem(item);
        if (!isMountedRef.current) {
          return;
        }

        setContent((prev) => prev.filter((existing) => existing.id !== item.id));
        setCheckedItemIds((prev) => prev.filter((id) => id !== item.id));
        setSelectedItem((prev) => (prev?.id === item.id ? null : prev));
      } catch (error: any) {
        const message = error?.message ?? 'Failed to delete content item.';
        debug.error('Failed to delete content item', { id: item.id, message });
      } finally {
        if (isMountedRef.current) {
          setDeletingItemId((current) => (current === item.id ? null : current));
        }
      }
    },
    [debug],
  );

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filters: FILTERS,
    filteredContent,
    selectItem,
    selectedItem,
    checkedItemIds,
    toggleItemChecked,
    errorMessage,
    clearFilters,
    handleDeleteItem,
    deletingItemId,
    refreshContent,
  };
}
