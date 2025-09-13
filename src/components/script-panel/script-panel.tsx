"use client";

import React, { useState } from "react";

import { useScriptCopy } from "@/hooks/use-script-copy";
import { useScriptDownload } from "@/hooks/use-script-download";
import { cn } from "@/lib/utils";
import { ScriptPanelProps, ScriptTabConfig, ScriptData } from "@/types/script-panel";

import {
  ScriptPanelHeader,
  ScriptPanelTabs,
  FullScriptView,
  ComponentsView,
  HooksView,
} from "./script-panel-components";

/**
 * ScriptPanel - A comprehensive script display component with tabs,
 * copy functionality, and metrics display following Clarity Design System
 */
// Helper function to get tab configuration
function getTabConfiguration(componentsLength: number, hooksLength: number): ScriptTabConfig[] {
  return [
    { key: "full", label: "Full Script", enabled: true },
    { key: "components", label: "Components", enabled: componentsLength > 0 },
    { key: "hooks", label: "Hooks", enabled: hooksLength > 0 },
  ];
}

export function ScriptPanel({
  scriptData,
  isLoading = false,
  onCopy,
  onDownload,
  onClose,
  className,
  showDownload = true,
  showMetrics = true,
  customActions,
}: ScriptPanelProps) {
  const [activeTab, setActiveTab] = useState<"full" | "components" | "hooks">("full");
  const { copyText, copyStatus } = useScriptCopy();
  const { downloadScript, isDownloading } = useScriptDownload();

  const tabs = getTabConfiguration(scriptData.components.length, scriptData.hooks?.length || 0);

  const handleCopy = async (content: string, componentType?: string) => {
    const success = await copyText(content);
    if (success && onCopy) {
      onCopy(content, componentType as any);
    }
  };

  const handleDownload = () => {
    downloadScript(scriptData);
    if (onDownload) {
      onDownload(scriptData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading script...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ScriptPanelHeader
        scriptData={scriptData}
        copyStatus={copyStatus}
        isDownloading={isDownloading}
        showDownload={showDownload}
        customActions={customActions}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onClose={onClose}
      />

      <ScriptPanelTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab as any} />

      <ScriptPanelContent
        activeTab={activeTab}
        scriptData={scriptData}
        showMetrics={showMetrics}
        onCopy={handleCopy}
        copyStatus={copyStatus}
      />
    </div>
  );
}

/**
 * Script Panel Content Component
 */
interface ScriptPanelContentProps {
  activeTab: string;
  scriptData: ScriptData;
  showMetrics: boolean;
  onCopy: (content: string, type?: string) => void;
  copyStatus: string;
}

function ScriptPanelContent({ activeTab, scriptData, showMetrics, onCopy, copyStatus }: ScriptPanelContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {activeTab === "full" && (
        <FullScriptView
          script={scriptData.fullScript}
          metrics={scriptData.metrics}
          showMetrics={showMetrics}
          onCopy={onCopy}
          copyStatus={copyStatus}
        />
      )}

      {activeTab === "components" && <ComponentsView components={scriptData.components} onCopy={onCopy} />}

      {activeTab === "hooks" && <HooksView hooks={scriptData.hooks || []} onCopy={onCopy} />}
    </div>
  );
}

export default ScriptPanel;
