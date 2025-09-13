"use client";

import { useState, useCallback } from "react";

import { UseScriptCopyReturn } from "@/types/script-panel";

/**
 * Custom hook for handling copy-to-clipboard functionality
 * with visual feedback and error handling
 */
export function useScriptCopy(): UseScriptCopyReturn {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "error">("idle");

  const copyText = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator.clipboard) {
      setCopyStatus("error");
      return false;
    }

    setCopyStatus("copying");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("success");

      // Auto-reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);

      return true;
    } catch (error) {
      console.error("Failed to copy text:", error);
      setCopyStatus("error");

      // Reset error status after 2 seconds
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);

      return false;
    }
  }, []);

  const resetCopyStatus = useCallback(() => {
    setCopyStatus("idle");
  }, []);

  return {
    copyText,
    copyStatus,
    resetCopyStatus,
  };
}
