/**
 * Script Panel Types
 *
 * Defines the data structures for script components and analysis data
 * used in the ScriptPanel slideout component.
 */

export type ScriptComponentType =
  | "hook"
  | "bridge"
  | "nugget"
  | "cta"
  | "intro"
  | "transition"
  | "value"
  | "close"
  | "transcript"
  | "custom";

export interface ScriptComponent {
  id: string;
  type: ScriptComponentType;
  label: string;
  content: string;
  wordCount?: number;
  estimatedDuration?: number; // in seconds
  icon?: string; // Single letter icon (H, B, G, C, etc.)
  metadata?: {
    [key: string]: any;
  };
}

export interface ScriptMetrics {
  totalWords: number;
  totalDuration: number;
  avgWordsPerSecond?: number;
  readabilityScore?: number;
  engagementScore?: number;
}

export interface ScriptHook {
  id: string;
  type: "opening" | "problem" | "twist" | "emotional" | "question" | "story" | "custom";
  label: string;
  content: string;
  effectiveness?: number; // 0-100 effectiveness score
  wordCount?: number;
  metadata?: {
    [key: string]: any;
  };
}

export interface ScriptData {
  id: string;
  title: string;
  fullScript: string;
  components: ScriptComponent[];
  hooks?: ScriptHook[]; // Array of generated hooks
  metrics: ScriptMetrics;
  createdAt: Date | string;
  updatedAt: Date | string;
  version?: string;
  tags?: string[];
  metadata?: {
    videoId?: string;
    platform?: string;
    genre?: string;
    targetAudience?: string;
    [key: string]: any;
  };
}

export interface ScriptPanelProps {
  scriptData: ScriptData;
  isLoading?: boolean;
  onCopy?: (content: string, componentType?: ScriptComponentType) => void;
  onDownload?: (scriptData: ScriptData) => void;
  onClose?: () => void;
  className?: string;
  showDownload?: boolean;
  showMetrics?: boolean;
  customActions?: React.ReactNode;
}

export interface ScriptTabConfig {
  key: "full" | "components" | "hooks" | "metrics";
  label: string;
  icon?: React.ReactNode;
  enabled: boolean;
}

// Utility function type for calculating script metrics
export type ScriptAnalyzer = (content: string) => {
  wordCount: number;
  estimatedDuration: number;
  readabilityScore?: number;
};

// Hook return types
export interface UseScriptCopyReturn {
  copyText: (text: string) => Promise<boolean>;
  copyStatus: "idle" | "copying" | "success" | "error";
  resetCopyStatus: () => void;
}

export interface UseScriptDownloadReturn {
  downloadScript: (scriptData: ScriptData, format?: "txt" | "json") => void;
  isDownloading: boolean;
}

// Component icons mapping
export const SCRIPT_COMPONENT_ICONS: Record<ScriptComponentType, string> = {
  hook: "H",
  bridge: "B",
  nugget: "G",
  cta: "C",
  intro: "I",
  transition: "T",
  value: "V",
  close: "X",
  transcript: "T",
  custom: "?",
};

// Default component labels
export const SCRIPT_COMPONENT_LABELS: Record<ScriptComponentType, string> = {
  hook: "Hook",
  bridge: "Bridge",
  nugget: "Golden Nugget",
  cta: "Call to Action",
  intro: "Introduction",
  transition: "Transition",
  value: "Value Proposition",
  close: "Closing",
  transcript: "Transcript",
  custom: "Custom",
};

// Hook type icons mapping
export const SCRIPT_HOOK_ICONS: Record<string, string> = {
  opening: "O",
  problem: "P",
  twist: "T",
  emotional: "E",
  question: "Q",
  story: "S",
  custom: "?",
};

// Default hook labels
export const SCRIPT_HOOK_LABELS: Record<string, string> = {
  opening: "Opening Hook",
  problem: "Problem Hook",
  twist: "Plot Twist",
  emotional: "Emotional Hook",
  question: "Question Hook",
  story: "Story Hook",
  custom: "Custom Hook",
};
