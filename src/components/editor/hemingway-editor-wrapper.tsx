"use client";

import React from "react";

import { HemingwayEditorCore, type HemingwayEditorCoreProps } from "./hemingway-editor-core";
import { type HighlightConfig, type ScriptAnalysis } from "@/lib/script-analysis";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface WrapperProps extends Omit<HemingwayEditorCoreProps, 'elements' | 'highlightConfig' | 'onAnalysisChange'> {
  highlightConfig?: HighlightConfig;
  elements?: ScriptElements;
  onAnalysisChange?: (analysis: ScriptAnalysis) => void;
  onBlocksChange?: (blocks: unknown[]) => void;
}

export function HemingwayEditorWrapper(props: WrapperProps) {
  return <HemingwayEditorCore {...props} />;
}
