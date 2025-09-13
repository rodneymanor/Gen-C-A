"use client";

import { useState, useCallback } from "react";

import { ScriptData, UseScriptDownloadReturn } from "@/types/script-panel";

/**
 * Custom hook for handling script download functionality
 * Supports multiple formats (txt, json) with proper file naming
 */
export function useScriptDownload(): UseScriptDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadScript = useCallback((scriptData: ScriptData, format: "txt" | "json" = "txt") => {
    setIsDownloading(true);

    try {
      let content: string;
      let fileName: string;
      let mimeType: string;

      if (format === "txt") {
        // Create a nicely formatted text file
        content = [
          `SCRIPT: ${scriptData.title}`,
          `Generated: ${new Date(scriptData.createdAt).toLocaleDateString()}`,
          `Total Words: ${scriptData.metrics.totalWords}`,
          `Estimated Duration: ${Math.ceil(scriptData.metrics.totalDuration)}s`,
          "",
          "=".repeat(50),
          "FULL SCRIPT",
          "=".repeat(50),
          "",
          scriptData.fullScript,
          "",
          "=".repeat(50),
          "SCRIPT COMPONENTS",
          "=".repeat(50),
          "",
          ...scriptData.components
            .map((component) => [
              `${component.label.toUpperCase()}:`,
              component.content,
              `(${component.wordCount ?? 0} words, ~${component.estimatedDuration ?? 0}s)`,
              "",
            ])
            .flat(),
        ].join("\n");

        fileName = `${sanitizeFileName(scriptData.title)}-script.txt`;
        mimeType = "text/plain";
      } else {
        // JSON format with full data structure
        content = JSON.stringify(scriptData, null, 2);
        fileName = `${sanitizeFileName(scriptData.title)}-script.json`;
        mimeType = "application/json";
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download script:", error);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    downloadScript,
    isDownloading,
  };
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 50); // Limit length
}
