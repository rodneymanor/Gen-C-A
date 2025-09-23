import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface PageLoadContextValue {
  busyCount: number;
  beginPageLoad: () => void;
  endPageLoad: () => void;
}

const PageLoadContext = createContext<PageLoadContextValue | undefined>(undefined);

export const PageLoadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [busyCount, setBusyCount] = useState(0);
  const mounted = useRef(true);

  React.useEffect(() => () => { mounted.current = false; }, []);

  const beginPageLoad = useCallback(() => {
    setBusyCount((c) => c + 1);
  }, [setBusyCount]);

  const endPageLoad = useCallback(() => {
    setBusyCount((c) => Math.max(0, c - 1));
  }, [setBusyCount]);

  const value = useMemo<PageLoadContextValue>(() => ({
    busyCount,
    beginPageLoad,
    endPageLoad,
  }), [busyCount, beginPageLoad, endPageLoad]);

  return (
    <PageLoadContext.Provider value={value}>{children}</PageLoadContext.Provider>
  );
};

export function usePageLoad() {
  const ctx = useContext(PageLoadContext);
  if (!ctx) throw new Error('usePageLoad must be used within PageLoadProvider');
  return ctx;
}
