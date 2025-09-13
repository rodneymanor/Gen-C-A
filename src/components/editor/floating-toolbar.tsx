"use client";

import * as React from "react";
import { memo, useMemo } from "react";

import { Mic, Maximize2, ChevronDown, MicOff, Save, Download, Undo, Redo, Sparkles, Type, Volume2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ClarityLoader } from "@/components/ui/loading";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useVoice, type VoiceType } from "@/contexts/voice-context";

interface AIAction {
  key: string;
  label: string;
  description: string;
  icon: string;
  hasSubmenu?: boolean;
  options?: {
    key: string;
    label: string;
    description: string;
  }[];
}

const UNIVERSAL_ACTIONS: AIAction[] = [
  {
    key: "copy",
    label: "Copy",
    description: "Copy text to clipboard",
    icon: "📋",
  },
  {
    key: "edit",
    label: "Edit",
    description: "Open text in editor for manual editing",
    icon: "✏️",
  },
  {
    key: "humanize",
    label: "Humanize",
    description: "Make the text more natural and conversational",
    icon: "👤",
  },
  {
    key: "shorten",
    label: "Shorten",
    description: "Reduce length while maintaining core message",
    icon: "✂️",
  },
  {
    key: "change_tone",
    label: "Change Tone",
    description: "Modify the emotional tone",
    icon: "🎭",
    hasSubmenu: true,
    options: [
      { key: "professional", label: "Professional", description: "Formal business tone" },
      { key: "casual", label: "Casual", description: "Relaxed informal tone" },
      { key: "friendly", label: "Friendly", description: "Warm approachable tone" },
      { key: "confident", label: "Confident", description: "Assertive self-assured tone" },
      { key: "persuasive", label: "Persuasive", description: "Compelling convincing tone" },
    ],
  },
];

export interface FloatingToolbarProps {
  text: string;
  className?: string;
  // Voice recording
  isRecording?: boolean;
  isProcessing?: boolean;
  onToggleRecording?: () => void;
  // Focus mode
  onToggleFocusMode?: () => void;
  // AI Actions
  onAIAction?: (actionType: string, option?: string) => void;
  // Save and Export
  onSave?: () => void;
  onExport?: () => void;
  isSaving?: boolean;
  // Undo and Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Disabled states
  disabled?: boolean;
  // Context for conditional actions
  context?: "ideas" | "notes" | "scripts";
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = memo(
  ({
    text,
    className,
    isRecording = false,
    isProcessing = false,
    onToggleRecording,
    onToggleFocusMode,
    onAIAction,
    onSave,
    onExport,
    isSaving = false,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    disabled = false,
    context = "scripts",
  }) => {
    const { currentVoice, setCurrentVoice, availableVoices } = useVoice();

    const wordCount = React.useMemo(() => {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(Boolean).length;
    }, [text]);

    const readingTimeSeconds = React.useMemo(() => {
      const wordsPerMinute = 160; // Updated to match Hemingway editor
      return Math.ceil((wordCount / wordsPerMinute) * 60);
    }, [wordCount]);

    const formatTime = (seconds: number) => {
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    };

    const handleVoiceSelect = (voice: VoiceType) => {
      setCurrentVoice(voice);
      toast.success(`Voice changed to ${voice}`);
    };

    const handleAIActionSelect = (actionType: string, option?: string) => {
      onAIAction?.(actionType, option);
    };

    // Memoized statistics to prevent unnecessary recalculations
    const stats = useMemo(
      () => ({
        wordCount,
        readingTime: formatTime(readingTimeSeconds),
        readingTimeSeconds,
      }),
      [wordCount, readingTimeSeconds],
    );

    // Get actions based on context
    const contextualActions = useMemo(() => {
      const actions = [...UNIVERSAL_ACTIONS];

      // Add remix action for ideas/notes context
      if (context === "ideas" || context === "notes") {
        actions.push({
          key: "remix",
          label: "Remix",
          description: "Send to speed script workflow for content creation",
          icon: "🔄",
        });
      }

      return actions;
    }, [context]);

    return (
      <TooltipProvider>
        <div
          className={cn(
            // Enhanced floating design with sidebar styling
            "floating-toolbar-responsive",
            "bg-sidebar border-sidebar-border text-muted-foreground",
            "fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2 transition-all duration-300",
            "flex items-center gap-1 rounded-lg border px-3 py-2 shadow-lg",
            // Hover effect for entire toolbar - subtle like sidebar
            "hover:shadow-xl",
            disabled && "pointer-events-none opacity-50",
            className,
          )}
          role="toolbar"
          aria-label="Editor actions"
        >
          {/* Stats Section with improved visual hierarchy */}
          <div className="toolbar-stats mr-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2 py-1 text-xs font-medium">
                {stats.wordCount} words
              </Badge>
              <div className="toolbar-text text-muted-foreground flex items-center gap-1 text-xs">
                <Type className="h-3 w-3" />
                {stats.readingTime}
              </div>
            </div>
          </div>

          {/* Primary Actions Group */}
          <div className="mr-2 flex items-center gap-1">
            {/* Undo/Redo Group */}
            <div className="border-border/10 bg-muted/30 flex items-center rounded-lg border p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    onClick={onUndo}
                    disabled={disabled || !canUndo}
                    aria-label="Undo last action"
                  >
                    <Undo className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    onClick={onRedo}
                    disabled={disabled || !canRedo}
                    aria-label="Redo last action"
                  >
                    <Redo className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Redo</TooltipContent>
              </Tooltip>
            </div>

            {/* AI Actions with improved design */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 shrink-0 items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors"
                      disabled={disabled}
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">AI</span>
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">AI writing assistance</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center" className="w-64 p-2">
                <DropdownMenuLabel className="text-muted-foreground px-2 text-xs tracking-wide uppercase">
                  Quick Actions
                </DropdownMenuLabel>
                {contextualActions.map((action) => (
                  <div key={action.key}>
                    {action.hasSubmenu ? (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-3 rounded-lg p-3">
                          <span className="text-lg">{action.icon}</span>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{action.label}</span>
                            <span className="text-muted-foreground text-xs">{action.description}</span>
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-1">
                          {action.options?.map((option) => (
                            <DropdownMenuItem
                              key={option.key}
                              onClick={() => handleAIActionSelect(action.key, option.key)}
                              className="rounded-lg p-3"
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">{option.label}</span>
                                <span className="text-muted-foreground text-xs">{option.description}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleAIActionSelect(action.key)}
                        className="flex items-center gap-3 rounded-lg p-3"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{action.label}</span>
                          <span className="text-muted-foreground text-xs">{action.description}</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Secondary Actions Group */}
          <div className="toolbar-secondary border-border/20 ml-2 flex items-center gap-1 border-l pl-3">
            {/* Voice Controls */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors"
                        disabled={disabled}
                      >
                        <Volume2 className="h-4 w-4 shrink-0" />
                        <span className="hidden text-sm sm:inline">{currentVoice}</span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">Select voice</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="p-1">
                  <DropdownMenuLabel className="text-muted-foreground px-2 pb-1 text-xs">
                    Voice Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableVoices.map((voice) => (
                    <DropdownMenuItem
                      key={voice}
                      onClick={() => handleVoiceSelect(voice)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "transition-colors duration-200",
                        voice === currentVoice && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                      )}
                    >
                      <Mic className="h-4 w-4" />
                      <span className="text-sm">{voice}</span>
                      {voice === currentVoice && <span className="text-sidebar-accent-foreground ml-auto">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isRecording
                        ? "bg-destructive/20 text-destructive hover:bg-destructive/50 animate-pulse"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    onClick={onToggleRecording}
                    disabled={disabled || isProcessing}
                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                  >
                    {isProcessing ? (
                      <ClarityLoader size="inline" />
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4 shrink-0" />
                    ) : (
                      <Mic className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{isRecording ? "Stop recording" : "Voice input"}</TooltipContent>
              </Tooltip>
            </div>

            {/* Utility Actions */}
            <div className="border-border/20 ml-2 flex items-center gap-1 border-l pl-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    onClick={onToggleFocusMode}
                    disabled={disabled}
                    aria-label="Enter focus mode"
                  >
                    <Maximize2 className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Focus mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    onClick={onSave}
                    disabled={disabled || isSaving}
                    aria-label="Save script"
                  >
                    {isSaving ? <ClarityLoader size="inline" /> : <Save className="h-4 w-4 shrink-0" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Save script</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
                    onClick={onExport}
                    disabled={disabled}
                    aria-label="Export script"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Export script</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  },
);

FloatingToolbar.displayName = "FloatingToolbar";

export { FloatingToolbar };
export default FloatingToolbar;
