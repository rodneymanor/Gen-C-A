export interface Script {
  id: string;
  title: string;
  content: string;
  authors: string;
  status: "draft" | "published" | "scheduled" | "sent";
  performance: { views: number; engagement: number };
  category: string;
  createdAt: string;
  updatedAt: string;
  viewedAt: string;
  duration: string;
  tags: string[];
  fileType: "Script" | "Template";
  summary: string;
  userId: string;
  approach: "speed-write" | "educational" | "ai-voice";
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
  originalIdea?: string;
  targetLength?: string;
  wordCount?: number;
  source?: "ghostwriter" | "ideas" | "scripting" | "hooks" | "collections";
  // Enhanced scheduling and platform support
  scheduledDate?: string;
  platform?: "tiktok" | "instagram" | "youtube";
  publishedUrl?: string;
  isThread?: boolean;
  threadParts?: string[];
  characterCount?: number;
  // For quick generators (hooks, ideas, tips)
  elements?: {
    items?: Array<{ number: number; text: string }>;
    rawContent?: string;
    type?: string;
    // Legacy fields for backward compatibility
    hook?: string;
    bridge?: string;
    goldenNugget?: string;
    wta?: string;
  };
}

export interface CreateScriptRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  summary?: string;
  approach: "speed-write" | "educational" | "ai-voice";
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
  originalIdea?: string;
  targetLength?: string;
  source?: "ghostwriter" | "ideas" | "scripting" | "hooks" | "collections";
  // Enhanced scheduling and platform support
  scheduledDate?: string;
  platform?: "tiktok" | "instagram" | "youtube";
  status?: "draft" | "scheduled" | "sent";
  isThread?: boolean;
  threadParts?: string[];
}

export interface UpdateScriptRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  summary?: string;
  status?: "draft" | "published" | "scheduled" | "sent";
  scheduledDate?: string;
  platform?: "tiktok" | "instagram" | "youtube";
  publishedUrl?: string;
  isThread?: boolean;
  threadParts?: string[];
}

export interface ScriptsResponse {
  success: boolean;
  scripts: Script[];
  error?: string;
}

export interface ScriptResponse {
  success: boolean;
  script?: Script;
  error?: string;
}
