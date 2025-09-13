"use client";

import { useState, useEffect, useRef } from "react";

import { PartialBlock } from "@blocknote/core";
import { BarChart3, Target, Lightbulb, ChevronDown, Check, X, Edit2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EnhancedReadabilityService,
  defaultReadabilitySettings,
  type ReadabilityAnalysis,
} from "@/lib/enhanced-readability-service";
import { auth } from "@/lib/firebase";
import { type HighlightConfig, type ScriptAnalysis } from "@/lib/script-analysis";

import { FloatingToolbar } from "./floating-toolbar";
import { HemingwayEditorWrapper } from "./hemingway-editor-wrapper";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface HemingwayEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  elements?: ScriptElements; // New prop for structured elements
  onBlocksChange?: (blocks: PartialBlock[]) => void; // New prop for JSON blocks
  title?: string;
  onTitleChange?: (title: string) => void;
  showTitleEditor?: boolean;
  context?: "ideas" | "notes" | "scripts"; // Context for conditional actions
}

interface AnalysisStats {
  total: number;
  hooks: number;
  bridges: number;
  goldenNuggets: number;
  wtas: number;
  words: number;
  characters: number;
  estimatedTime: string;
}

export function HemingwayEditor({
  value,
  onChange,
  placeholder = "Start writing your script...",
  minRows = 10,
  maxRows = 50,
  readOnly = false,
  autoFocus = false,
  elements,
  onBlocksChange,
  title = "",
  onTitleChange,
  showTitleEditor = false,
  context = "scripts",
}: HemingwayEditorProps) {
  const [highlightConfig] = useState<HighlightConfig>({
    hooks: true,
    bridges: true,
    goldenNuggets: true,
    wtas: true,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [distractionFreeMode, setDistractionFreeMode] = useState(false);
  const [activeTab, setActiveTab] = useState("readability");

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  // Update editTitle when title prop changes
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  const handleTitleEdit = () => {
    if (onTitleChange) {
      setIsEditingTitle(true);
      setEditTitle(title);
    }
  };

  const handleTitleSave = () => {
    if (onTitleChange && editTitle.trim() !== title) {
      onTitleChange(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when value changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(value);
        // Limit history to 50 entries
        if (newHistory.length > 50) {
          newHistory.shift();
        } else {
          setHistoryIndex(historyIndex + 1);
        }
        setHistory(newHistory);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [value, history, historyIndex]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key === "z") {
        event.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          onChange(history[newIndex]);
        }
      } else if (
        ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "z") ||
        ((event.metaKey || event.ctrlKey) && event.key === "y")
      ) {
        event.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          onChange(history[newIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history, onChange]);

  const setupMediaRecorder = (stream: MediaStream) => {
    const options = { mimeType: "audio/webm" };
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      // Process the audio
      await processAudioWithGemini(audioBlob);

      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop());
    };
  };

  const processAudioWithGemini = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            const base64 = reader.result.toString().split(",")[1];
            resolve(base64);
          } else {
            reject(new Error("Failed to read audio"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Get Firebase Auth token
      if (!auth?.currentUser) {
        throw new Error("Please sign in to use voice transcription");
      }

      const token = await auth.currentUser.getIdToken();

      // Send to Gemini transcription API
      const response = await fetch("/api/transcribe/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: "webm",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data = await response.json();

      if (data.success && data.transcription) {
        // Add transcribed text to content
        const transcribedText = data.transcription;
        onChange(value + (value.trim() ? "\n\n" : "") + transcribedText);

        toast.success("Transcription completed successfully!");
      } else {
        throw new Error("No transcription received");
      }
    } catch (error) {
      console.error("Failed to process recording:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setupMediaRecorder(stream);

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.success("Recording started");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error("Microphone permission denied. Please check your browser settings.");
        } else if (error.name === "NotFoundError") {
          toast.error("No microphone found. Please connect a microphone and try again.");
        } else {
          toast.error("Failed to access microphone: " + error.message);
        }
      } else {
        toast.error("Failed to start recording");
      }

      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Processing recording...");
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleAIAction = async (actionType: string, option?: string) => {
    if (!value.trim()) {
      toast.error("No content to process");
      return;
    }

    try {
      // Handle copy action
      if (actionType === "copy") {
        await navigator.clipboard.writeText(value);
        toast.success("Content copied to clipboard!");
        return;
      }

      // Handle edit action (placeholder - could open in separate editor)
      if (actionType === "edit") {
        toast.info("Edit mode activated - content is now editable");
        return;
      }

      // Handle remix action for ideas/notes
      if (actionType === "remix") {
        // Redirect to script editor with content as initial value
        const params = new URLSearchParams({
          content: value,
          title: title || "Remixed from Idea Inbox",
        });
        window.location.href = `/dashboard/scripts/editor?${params.toString()}`;
        return;
      }

      let response;

      if (actionType === "humanize") {
        response = await fetch("/api/humanize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value }),
        });
      } else if (actionType === "shorten") {
        response = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value }),
        });
      } else {
        // Use the general AI action endpoint
        response = await fetch("/api/ai-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: value,
            actionType,
            option,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newText = data.humanizedText || data.shortenedText || data.modifiedText;
        if (newText) {
          onChange(newText);
          toast.success(
            `Script ${actionType === "humanize" ? "humanized" : actionType === "shorten" ? "shortened" : "updated"} successfully!`,
          );
        }
      } else {
        throw new Error(data.error || "Action failed");
      }
    } catch (error) {
      console.error("AI action failed:", error);
      toast.error(`Failed to ${actionType} script: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSave = async () => {
    try {
      if (!value.trim()) {
        toast.error("Please provide content for your note");
        return;
      }

      if (!auth?.currentUser) {
        toast.error("Please sign in to save notes");
        return;
      }

      const token = await auth.currentUser.getIdToken();

      // Auto-generate title from content if no title is provided
      const autoTitle = title.trim() || value.trim().split("\n")[0].substring(0, 50).trim() || "Untitled Note";

      // Create note data
      const noteData = {
        title: autoTitle,
        content: value.trim(),
        type: "text",
        tags: [], // Default empty tags for now
        starred: false,
      };

      console.log("📝 [HemingwayEditor] Saving note:", noteData);

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save note");
      }

      const data = await response.json();
      console.log("✅ [HemingwayEditor] Note saved:", data);

      toast.success("Note saved successfully!");

      // Redirect to notes page to see the saved note
      setTimeout(() => {
        window.location.href = "/dashboard/notes";
      }, 1000);
    } catch (error) {
      console.error("❌ [HemingwayEditor] Save failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    }
  };

  const handleExport = () => {
    // Create a downloadable text file
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Script exported successfully!");
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const [currentAnalysis, setCurrentAnalysis] = useState<ScriptAnalysis>({
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  });

  // Readability analysis state
  const [readabilityService] = useState(() => new EnhancedReadabilityService(defaultReadabilitySettings));
  const [readabilityAnalysis, setReadabilityAnalysis] = useState<ReadabilityAnalysis | null>(null);

  // Analyze readability when value changes
  useEffect(() => {
    if (value.trim()) {
      try {
        const analysis = readabilityService.analyzeText(value);
        setReadabilityAnalysis(analysis);
      } catch (error) {
        console.error("Readability analysis failed:", error);
        setReadabilityAnalysis(null);
      }
    } else {
      setReadabilityAnalysis(null);
    }
  }, [value, readabilityService]);

  // Calculate estimated reading/speaking time based on word count
  const calculateEstimatedTime = (words: number): string => {
    if (words === 0) return "0s";

    // Average speaking rate: 150-180 words per minute for content creation
    // Using 160 wpm as a good middle ground for social media scripts
    const wordsPerMinute = 160;
    const totalSeconds = Math.round((words / wordsPerMinute) * 60);

    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Get analysis stats from current analysis
  const getAnalysisStats = (): AnalysisStats => {
    const hooks = currentAnalysis.hooks.length;
    const bridges = currentAnalysis.bridges.length;
    const goldenNuggets = currentAnalysis.goldenNuggets.length;
    const wtas = currentAnalysis.wtas.length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;

    return {
      total: hooks + bridges + goldenNuggets + wtas,
      hooks,
      bridges,
      goldenNuggets,
      wtas,
      words,
      characters: value.length,
      estimatedTime: calculateEstimatedTime(words),
    };
  };

  const stats = getAnalysisStats();

  if (distractionFreeMode) {
    return (
      <div className="relative h-full">
        <HemingwayEditorWrapper
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          readOnly={readOnly}
          autoFocus={autoFocus}
          highlightConfig={highlightConfig}
          elements={elements}
          onAnalysisChange={setCurrentAnalysis}
          onBlocksChange={onBlocksChange}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 px-3 text-xs"
          onClick={() => setDistractionFreeMode(false)}
        >
          Exit Focus Mode
        </Button>
      </div>
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Floating Expand Button when sidebar is collapsed */}
      {sidebarCollapsed && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-50 h-8 px-3 text-xs shadow-md"
          onClick={() => setSidebarCollapsed(false)}
          title="Show sidebar"
        >
          <BarChart3 className="mr-1 h-3 w-3" />
          Stats
        </Button>
      )}

      {/* Main Content Area */}
      <div className="main-content flex h-full flex-col">
        {/* Title Editor */}
        {showTitleEditor && (
          <div className="border-b p-4">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="border-none px-0 text-2xl font-bold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Enter title..."
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTitleSave}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTitleCancel}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="group flex cursor-pointer items-center gap-2 py-2"
                onClick={handleTitleEdit}
                title="Click to edit title"
              >
                <h1 className="text-2xl font-bold transition-colors group-hover:text-blue-600">
                  {title || "Untitled"}
                </h1>
                <Edit2 className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1">
          <HemingwayEditorWrapper
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minRows={minRows}
            maxRows={maxRows}
            readOnly={readOnly}
            autoFocus={autoFocus}
            highlightConfig={highlightConfig}
            elements={elements}
            onAnalysisChange={setCurrentAnalysis}
            onBlocksChange={onBlocksChange}
          />
        </div>

        {/* Floating Toolbar replaces footer */}
        {!distractionFreeMode && (
          <FloatingToolbar
            text={value}
            isRecording={isRecording}
            isProcessing={isProcessing}
            onToggleRecording={handleToggleRecording}
            onToggleFocusMode={() => setDistractionFreeMode(true)}
            onAIAction={handleAIAction}
            onSave={handleSave}
            onExport={handleExport}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            disabled={readOnly}
            context={context}
          />
        )}
      </div>

      {/* Right Sidebar - Statistics & Analysis */}
      {!sidebarCollapsed && (
        <div className="right-sidebar bg-background/50 border-border/50 overflow-y-auto border-l backdrop-blur-sm">
          <div className="sidebar-content">
            {/* Sidebar Header */}
            <div className="hemingway-sidebar-header -m-4 mb-4 flex items-center justify-between p-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(true)}
                className="h-8 w-8 p-0"
                title="Collapse sidebar"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
            </div>

            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-0 rounded-none border-0 bg-transparent p-0">
                <TabsTrigger
                  value="readability"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground flex items-center justify-center gap-1 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium transition-all data-[state=active]:border-[#555864] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Target className="h-3 w-3" />
                  Readability
                </TabsTrigger>
                <TabsTrigger
                  value="writing"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground flex items-center justify-center gap-1 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium transition-all data-[state=active]:border-[#555864] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <BarChart3 className="h-3 w-3" />
                  Writing
                </TabsTrigger>
              </TabsList>

              {/* Readability Tab Content */}
              <TabsContent value="readability" className="mt-4 space-y-4">
                {readabilityAnalysis && (
                  <Card className="hemingway-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        Readability Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/10 mb-4 rounded-lg p-3 text-center">
                        <div className="text-primary mb-2 text-3xl font-bold">
                          {readabilityAnalysis.overall.score.toFixed(1)}
                        </div>
                        <Badge
                          variant={
                            readabilityAnalysis.overall.level === "easy"
                              ? "default"
                              : readabilityAnalysis.overall.level === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                          className="mb-1"
                        >
                          {readabilityAnalysis.overall.level.toUpperCase()}
                        </Badge>
                        <div className="text-muted-foreground text-xs">{readabilityAnalysis.overall.gradeLevel}</div>
                      </div>

                      {/* Show only actionable suggestions */}
                      {readabilityAnalysis.overall.suggestions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="flex items-center gap-1 text-sm font-medium text-orange-600">
                            <Lightbulb className="h-3 w-3" />
                            Quick Improvements
                          </h4>
                          <div className="space-y-2">
                            {readabilityAnalysis.overall.suggestions.slice(0, 2).map((suggestion, index) => (
                              <div key={index} className="readability-suggestion">
                                {suggestion}
                              </div>
                            ))}
                          </div>
                          {readabilityAnalysis.overall.suggestions.length > 2 && (
                            <details>
                              <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors">
                                <ChevronDown className="h-3 w-3 transition-transform" />
                                Show {readabilityAnalysis.overall.suggestions.length - 2} more suggestions
                              </summary>
                              <div className="mt-2 space-y-2">
                                {readabilityAnalysis.overall.suggestions.slice(2).map((suggestion, index) => (
                                  <div key={index + 2} className="readability-suggestion">
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Writing Stats Tab Content */}
              <TabsContent value="writing" className="mt-4 space-y-4">
                {/* Essential Statistics Only */}
                <Card className="hemingway-card">
                  <CardContent className="pt-4">
                    {/* Primary Stat - Reading Time */}
                    <div className="mb-4 text-center">
                      <div className="text-primary mb-1 text-4xl font-bold">{stats.estimatedTime}</div>
                      <div className="text-muted-foreground text-sm font-medium">Reading Time</div>
                    </div>

                    {/* Expandable Details */}
                    <details className="mt-4">
                      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs transition-colors">
                        <ChevronDown className="h-3 w-3 transition-transform" />
                        View detailed statistics
                      </summary>
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {/* Words in details */}
                        <div className="bg-primary/10 rounded p-3 text-center">
                          <div className="text-primary text-lg font-semibold">{stats.words}</div>
                          <div className="text-muted-foreground text-xs font-medium">Words</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/20 rounded p-2 text-center">
                            <div className="font-medium">{stats.characters}</div>
                            <div className="text-muted-foreground text-xs">Characters</div>
                          </div>
                          <div className="bg-muted/20 rounded p-2 text-center">
                            <div className="font-medium">
                              {value.split(/[.!?]+/).filter((s) => s.trim().length > 0).length}
                            </div>
                            <div className="text-muted-foreground text-xs">Sentences</div>
                          </div>
                        </div>
                        <div className="bg-muted/20 rounded p-2 text-center">
                          <div className="font-medium">
                            {value.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length}
                          </div>
                          <div className="text-muted-foreground text-xs">Paragraphs</div>
                        </div>
                      </div>
                    </details>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
