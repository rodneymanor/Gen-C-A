"use client";

import { Suspense, lazy } from "react";

import { PartialBlock } from "@blocknote/core";

import { type HighlightConfig, type ScriptAnalysis } from "@/lib/script-analysis";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface HemingwayEditorCoreProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  highlightConfig: HighlightConfig;
  elements?: ScriptElements;
  onAnalysisChange?: (analysis: ScriptAnalysis) => void;
  onBlocksChange?: (blocks: PartialBlock[]) => void;
}

// Dynamic import with proper error handling
const HemingwayEditorCore = lazy(() =>
  import("./hemingway-editor-core")
    .then((module) => ({ default: module.HemingwayEditorCore }))
    .catch((error) => {
      console.error("Failed to load HemingwayEditorCore:", error);
      return {
        default: ({ placeholder }: HemingwayEditorCoreProps) => (
          <div className="flex items-center justify-center p-8 text-red-500">
            <div className="text-center">
              <p className="mb-2">Error loading editor</p>
              <p className="text-sm text-gray-500">Please refresh the page</p>
            </div>
          </div>
        ),
      };
    }),
);

// Loading fallback component
const EditorLoadingFallback = () => (
  <div className="relative flex-1">
    <div className="border-border/20 bg-background/50 border-b px-6 py-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
    </div>
    <div className="p-6">
      <div className="space-y-3">
        <div className="h-4 animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  </div>
);

export function HemingwayEditorWrapper(props: HemingwayEditorCoreProps) {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <HemingwayEditorCore {...props} />
    </Suspense>
  );
}
