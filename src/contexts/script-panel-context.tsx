"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface ScriptPanelContextType {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const ScriptPanelContext = createContext<ScriptPanelContextType | undefined>(undefined);

export function ScriptPanelProvider({ children }: { children: ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);
  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  const contextValue = useMemo(
    () => ({
      isPanelOpen,
      openPanel,
      closePanel,
      togglePanel,
    }),
    [isPanelOpen],
  );

  return <ScriptPanelContext.Provider value={contextValue}>{children}</ScriptPanelContext.Provider>;
}

export function useScriptPanel() {
  const context = useContext(ScriptPanelContext);
  if (context === undefined) {
    throw new Error("useScriptPanel must be used within a ScriptPanelProvider");
  }
  return context;
}
