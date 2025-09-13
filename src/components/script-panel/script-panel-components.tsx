"use client";

import React, { useState } from "react";

import { FileText, Clock, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideoutHeader } from "@/components/ui/slideout-header";
import { cn } from "@/lib/utils";
import {
  ScriptTabConfig,
  SCRIPT_COMPONENT_ICONS,
  SCRIPT_COMPONENT_LABELS,
  SCRIPT_HOOK_ICONS,
  SCRIPT_HOOK_LABELS,
  ScriptData,
  ScriptMetrics,
  ScriptComponent,
  ScriptHook,
} from "@/types/script-panel";

/**
 * Script Panel Header Component
 */
interface ScriptPanelHeaderProps {
  scriptData: ScriptData;
  copyStatus: string;
  isDownloading: boolean;
  showDownload: boolean;
  customActions?: React.ReactNode;
  onCopy: (content: string) => void;
  onDownload: () => void;
  onClose?: () => void;
}

export function ScriptPanelHeader({
  scriptData,
  copyStatus,
  isDownloading,
  showDownload,
  customActions,
  onCopy,
  onDownload,
  onClose,
}: ScriptPanelHeaderProps) {
  return (
    <SlideoutHeader
      leftContent={
        <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium">
          Script
        </Badge>
      }
      rightActions={
        <>
          {/* Dual Action Button - Copy & Download */}
          <div className="flex overflow-hidden rounded-[var(--radius-button)] border border-neutral-200 bg-neutral-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(scriptData.fullScript)}
              disabled={copyStatus === "copying"}
              className={cn(
                "h-9 rounded-none border-r border-neutral-200 px-2.5 text-xs font-medium transition-colors duration-200",
                copyStatus === "success" && "bg-success-50 text-success-600 dark:bg-success-950/20",
              )}
            >
              {copyStatus === "copying" ? "Copying..." : copyStatus === "success" ? "Copied" : "Copy"}
            </Button>

            {showDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                disabled={isDownloading}
                className="h-9 rounded-none px-2"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Custom Actions */}
          {customActions}
        </>
      }
      onClose={onClose || (() => {})}
    />
  );
}

/**
 * Script Panel Tabs Component
 */
interface ScriptPanelTabsProps {
  tabs: ScriptTabConfig[];
  activeTab: string;
  onTabChange: (tab: "full" | "components" | "hooks") => void;
}

export function ScriptPanelTabs({ tabs, activeTab, onTabChange }: ScriptPanelTabsProps) {
  return (
    <div className="flex border-b border-neutral-200 bg-neutral-200/30">
      {tabs
        .filter((tab) => tab.enabled)
        .map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key as "full" | "components" | "hooks")}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-600 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </button>
        ))}
    </div>
  );
}

/**
 * Full Script View Component
 */
interface FullScriptViewProps {
  script: string;
  metrics: ScriptMetrics;
  showMetrics: boolean;
  onCopy: (content: string) => void;
  copyStatus: string;
}

export function FullScriptView({ script, metrics, showMetrics, onCopy, copyStatus }: FullScriptViewProps) {
  return (
    <div className="p-6">
      <div className="relative">
        <div className="group relative rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-100/50 p-5">
          {/* Script Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-neutral-200 bg-neutral-50">
              <span className="text-sm font-semibold text-neutral-600">T</span>
            </div>
            <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">Transcript</span>
          </div>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(script)}
            className={cn(
              "absolute top-5 right-5 h-7 px-3 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100",
              copyStatus === "success" && "bg-success-50 text-success-600 dark:bg-success-950/20 opacity-100",
            )}
          >
            {copyStatus === "success" ? "Copied" : "Copy"}
          </Button>

          {/* Script Content */}
          <div className="mt-8 text-sm leading-relaxed whitespace-pre-wrap text-neutral-900">{script}</div>
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className="mt-4 flex items-center gap-4 border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-2 text-neutral-600">
              <FileText className="h-4 w-4" />
              <span className="text-xs">{metrics.totalWords} words</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">~{Math.ceil(metrics.totalDuration)}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Components View
 */
interface ComponentsViewProps {
  components: ScriptComponent[];
  onCopy: (content: string, type?: string) => void;
}

export function ComponentsView({ components, onCopy }: ComponentsViewProps) {
  const [copiedComponent, setCopiedComponent] = useState<string | null>(null);

  const handleComponentCopy = async (content: string, componentId: string, componentType: string) => {
    setCopiedComponent(componentId);
    await onCopy(content, componentType);
    setTimeout(() => setCopiedComponent(null), 2000);
  };

  return (
    <div className="space-y-4 p-6">
      {components.map((component) => (
        <div
          key={component.id}
          className="group relative rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-100/50 p-5 transition-colors duration-200 hover:bg-neutral-100/60"
        >
          {/* Component Header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-neutral-200 bg-neutral-50">
              <span className="text-sm font-semibold text-neutral-600">
                {component.icon ?? SCRIPT_COMPONENT_ICONS[component.type] ?? "?"}
              </span>
            </div>
            <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
              {component.label ?? SCRIPT_COMPONENT_LABELS[component.type] ?? component.type}
            </span>
          </div>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComponentCopy(component.content, component.id, component.type)}
            className={cn(
              "absolute top-5 right-5 h-7 px-3 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100",
              copiedComponent === component.id && "bg-success-50 text-success-600 dark:bg-success-950/20 opacity-100",
            )}
          >
            {copiedComponent === component.id ? "Copied" : "Copy"}
          </Button>

          {/* Component Content */}
          <div className="mt-1 text-sm leading-relaxed text-neutral-900">{component.content}</div>

          {/* Meta Info */}
          <div className="mt-3 flex items-center gap-4 border-t border-neutral-200 pt-3">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs">{component.wordCount ?? 0} words</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">~{component.estimatedDuration ?? 0}s</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Hooks View Component - Display list of generated hooks
 */
interface HooksViewProps {
  hooks: ScriptHook[];
  onCopy: (content: string, type?: string) => void;
}

export function HooksView({ hooks, onCopy }: HooksViewProps) {
  const [copiedHook, setCopiedHook] = useState<string | null>(null);

  const handleHookCopy = async (content: string, hookId: string, hookType: string) => {
    setCopiedHook(hookId);
    await onCopy(content, `hook-${hookType}`);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  if (hooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[var(--radius-button)] border border-neutral-200 bg-neutral-50">
          <span className="text-lg font-semibold text-neutral-400">H</span>
        </div>
        <p className="text-sm text-neutral-600">No hooks generated yet</p>
        <p className="mt-1 text-xs text-neutral-500">Hooks will appear here once generated</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Hooks Header Info */}
      <div className="mb-6 rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-100/50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Generated Hooks</h3>
        <p className="text-xs text-neutral-600">
          {hooks.length} hook{hooks.length !== 1 ? "s" : ""} generated for your script. Each hook is optimized to
          capture attention and engagement.
        </p>
      </div>

      {/* Hooks List */}
      {hooks.map((hook) => (
        <div
          key={hook.id}
          className="group relative rounded-[var(--radius-card)] border border-neutral-200 bg-neutral-100/50 p-5 transition-colors duration-200 hover:bg-neutral-100/60"
        >
          {/* Hook Header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-neutral-200 bg-neutral-50">
              <span className="text-sm font-semibold text-neutral-600">{SCRIPT_HOOK_ICONS[hook.type] ?? "H"}</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                {hook.label ?? SCRIPT_HOOK_LABELS[hook.type] ?? hook.type}
              </span>
              {/* Effectiveness indicator if available */}
              {hook.effectiveness !== undefined && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="bg-success-500 h-full transition-all duration-300"
                      style={{ width: `${hook.effectiveness}%` }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500">{hook.effectiveness}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleHookCopy(hook.content, hook.id, hook.type)}
            className={cn(
              "absolute top-5 right-5 h-7 px-3 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100",
              copiedHook === hook.id && "bg-success-50 text-success-600 dark:bg-success-950/20 opacity-100",
            )}
          >
            {copiedHook === hook.id ? "Copied" : "Copy"}
          </Button>

          {/* Hook Content */}
          <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-neutral-900">{hook.content}</div>

          {/* Meta Info */}
          {hook.wordCount && (
            <div className="mt-3 flex items-center gap-4 border-t border-neutral-200 pt-3">
              <div className="flex items-center gap-1.5 text-neutral-600">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs">{hook.wordCount} words</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
