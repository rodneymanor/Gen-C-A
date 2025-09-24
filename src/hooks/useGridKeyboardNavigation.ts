import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type RefObject } from 'react';

interface UseGridKeyboardNavigationOptions<T> {
  items: T[];
  columns: number;
  onItemSelect?: (item: T, index: number) => void;
  onItemActivate?: (item: T, index: number) => void;
  disabled?: boolean;
  initialFocusIndex?: number;
}

interface UseGridKeyboardNavigationResult<T> {
  gridRef: RefObject<HTMLDivElement>;
  focusedIndex: number;
  isKeyboardMode: boolean;
  focusFirstItem: () => void;
  focusItem: (index: number) => void;
  getItemProps: (index: number) => {
    ref: (element: HTMLElement | null) => void;
    tabIndex: number;
    'data-keyboard-focused': boolean;
    onMouseEnter: () => void;
    onClick: () => void;
    onFocus: () => void;
  };
  gridProps: HTMLAttributes<HTMLDivElement> & {
    ref: RefObject<HTMLDivElement>;
  };
}

const LEADING_WHITESPACE_SPLIT = /\s+/g;

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function useGridKeyboardNavigation<T>({
  items,
  columns,
  onItemSelect,
  onItemActivate,
  disabled = false,
  initialFocusIndex = -1,
}: UseGridKeyboardNavigationOptions<T>): UseGridKeyboardNavigationResult<T> {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDetectedColumns = useRef<number>(columns);

  const [focusedIndex, setFocusedIndex] = useState<number>(initialFocusIndex);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const getActualColumnCount = useCallback((): number => {
    if (!isBrowser || !gridRef.current) return columns;

    try {
      const computedStyle = window.getComputedStyle(gridRef.current);
      const gridTemplateColumns = computedStyle.gridTemplateColumns;

      if (gridTemplateColumns && gridTemplateColumns !== 'none') {
        const columnArray = gridTemplateColumns
          .split(LEADING_WHITESPACE_SPLIT)
          .filter((col) => col.trim().length > 0);
        const actualColumns = columnArray.length;

        if (actualColumns !== lastDetectedColumns.current) {
          lastDetectedColumns.current = actualColumns;
        }

        return actualColumns > 0 ? actualColumns : columns;
      }
    } catch (error) {
      console.warn('[useGridKeyboardNavigation] Failed to detect grid columns', error);
    }

    return columns;
  }, [columns]);

  const getGridDimensions = useCallback(() => {
    const actualColumns = getActualColumnCount();
    const rows = Math.ceil(items.length / actualColumns);
    return { columns: actualColumns, rows };
  }, [items.length, getActualColumnCount]);

  const setVisualFocus = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length && itemRefs.current[index]) {
        itemRefs.current[index]?.focus();
        setFocusedIndex(index);
      }
    },
    [items.length],
  );

  const focusItemWithSelection = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length && itemRefs.current[index]) {
        itemRefs.current[index]?.focus();
        setFocusedIndex(index);
        onItemSelect?.(items[index] as T, index);
      }
    },
    [items, onItemSelect],
  );

  const navigateToIndex = useCallback(
    (newIndex: number) => {
      if (disabled || items.length === 0) return;
      const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
      focusItemWithSelection(clampedIndex);
    },
    [disabled, items.length, focusItemWithSelection],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isBrowser || disabled || items.length === 0) return;
      if (!gridRef.current?.contains(document.activeElement)) return;

      const { columns: actualColumns } = getGridDimensions();
      let newIndex = focusedIndex;
      let handled = false;

      switch (event.key) {
        case 'ArrowRight':
          newIndex = focusedIndex < items.length - 1 ? focusedIndex + 1 : focusedIndex;
          handled = true;
          break;
        case 'ArrowLeft':
          newIndex = focusedIndex > 0 ? focusedIndex - 1 : focusedIndex;
          handled = true;
          break;
        case 'ArrowDown':
          newIndex = Math.min(focusedIndex + actualColumns, items.length - 1);
          handled = true;
          break;
        case 'ArrowUp':
          newIndex = Math.max(focusedIndex - actualColumns, 0);
          handled = true;
          break;
        case 'Home':
          newIndex = 0;
          handled = true;
          break;
        case 'End':
          newIndex = items.length - 1;
          handled = true;
          break;
        case 'Enter':
        case ' ': {
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            event.preventDefault();
            onItemActivate?.(items[focusedIndex] as T, focusedIndex);
            handled = true;
          }
          break;
        }
        default:
          break;
      }

      if (handled) {
        event.preventDefault();
        setIsKeyboardMode(true);
        if (newIndex !== focusedIndex) {
          navigateToIndex(newIndex);
        }
      }
    },
    [disabled, focusedIndex, getGridDimensions, items, navigateToIndex, onItemActivate],
  );

  const handleScroll = useCallback(() => {
    if (!isBrowser) return;
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (disabled) return;
      if (isScrolling) return;
      setIsKeyboardMode(false);
      setVisualFocus(index);
    },
    [disabled, isScrolling, setVisualFocus],
  );

  const handleMouseClick = useCallback(
    (index: number) => {
      if (disabled) return;
      setIsKeyboardMode(false);
      setVisualFocus(index);
      onItemActivate?.(items[index] as T, index);
    },
    [disabled, items, onItemActivate, setVisualFocus],
  );

  useEffect(() => {
    if (!isBrowser || disabled) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, disabled]);

  useEffect(() => {
    if (!isBrowser || disabled) return;

    const handleWindowScroll = handleScroll;
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    const gridElement = gridRef.current;
    gridElement?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      gridElement?.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, disabled]);

  useEffect(() => {
    if (!isBrowser || disabled) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > 1 || Math.abs(event.deltaX) > 1) {
        handleScroll();
      }
    };

    const handleTouchStart = () => handleScroll();
    const handleTouchMove = () => handleScroll();

    document.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleScroll, disabled]);

  useEffect(() => {
    if (disabled || items.length === 0) {
      setFocusedIndex(-1);
      return;
    }

    if (focusedIndex === -1 && isKeyboardMode) {
      setFocusedIndex(0);
    }
  }, [items.length, disabled, focusedIndex, isKeyboardMode]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items.length]);

  const focusFirstItem = useCallback(() => {
    if (!disabled && items.length > 0) {
      setIsKeyboardMode(true);
      navigateToIndex(0);
    }
  }, [disabled, items.length, navigateToIndex]);

  const focusItemByIndex = useCallback(
    (index: number) => {
      if (!disabled && index >= 0 && index < items.length) {
        setIsKeyboardMode(true);
        navigateToIndex(index);
      }
    },
    [disabled, items.length, navigateToIndex],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: focusedIndex === index ? 0 : -1,
      'data-keyboard-focused': isKeyboardMode && focusedIndex === index,
      onMouseEnter: () => handleMouseEnter(index),
      onClick: () => handleMouseClick(index),
      onFocus: () => {
        if (!isKeyboardMode && focusedIndex !== index) {
          setVisualFocus(index);
        }
      },
    }),
    [focusedIndex, isKeyboardMode, handleMouseEnter, handleMouseClick, setVisualFocus],
  );

  const { columns: actualColumns, rows: actualRows } = useMemo(() => getGridDimensions(), [getGridDimensions]);

  return {
    gridRef,
    focusedIndex,
    isKeyboardMode,
    focusFirstItem,
    focusItem: focusItemByIndex,
    getItemProps,
    gridProps: {
      ref: gridRef,
      role: 'grid',
      'aria-rowcount': actualRows,
      'aria-colcount': actualColumns,
    },
  };
}
