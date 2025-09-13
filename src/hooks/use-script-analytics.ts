"use client";

import { useMemo } from "react";

import { ComponentReadabilityService, type ScriptReadabilityAnalysis } from "@/lib/component-readability-service";
import { ScriptComponent, ScriptMetrics } from "@/types/script-panel";

/**
 * Custom hook for calculating script analytics and metrics
 */
export function useScriptAnalytics(content: string) {
  return useMemo(() => {
    return calculateScriptMetrics(content);
  }, [content]);
}

/**
 * Enhanced hook for calculating script analytics with component-level readability analysis
 */
export function useEnhancedScriptAnalytics(scriptContent: string) {
  return useMemo(() => {
    const basicMetrics = calculateScriptMetrics(scriptContent);

    // Only run component analysis if script has markdown headings
    const hasHeadings = /\*\*[^:]+:\*\*/.test(scriptContent);
    let componentAnalysis: ScriptReadabilityAnalysis | null = null;

    if (hasHeadings && scriptContent.trim()) {
      const readabilityService = new ComponentReadabilityService();
      componentAnalysis = readabilityService.analyzeScriptComponents(scriptContent);
    }

    return {
      ...basicMetrics,
      componentAnalysis,
      hasComponentAnalysis: componentAnalysis !== null,
      overallGradeLevel: componentAnalysis?.averageGradeLevel || "N/A",
      passesThirdGradeTest: componentAnalysis?.passesThirdGradeTest || false,
    };
  }, [scriptContent]);
}

/**
 * Calculate word count and estimated duration for script content
 */
export function calculateScriptMetrics(content: string): {
  wordCount: number;
  estimatedDuration: number;
  readabilityScore?: number;
} {
  const words = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const wordCount = words.length;

  // Average speaking rate: 140-160 words per minute (we'll use 150)
  // For social media content, people speak slightly faster, so 160-180 wpm
  const wordsPerMinute = 170;
  const estimatedDuration = Math.ceil((wordCount / wordsPerMinute) * 60); // in seconds

  return {
    wordCount,
    estimatedDuration,
    readabilityScore: calculateReadabilityScore(content),
  };
}

/**
 * Calculate script components metrics from array of components
 */
export function calculateComponentsMetrics(components: ScriptComponent[]): ScriptMetrics {
  const totalWords = components.reduce((sum, comp) => sum + (comp.wordCount ?? 0), 0);
  const totalDuration = components.reduce((sum, comp) => sum + (comp.estimatedDuration ?? 0), 0);

  return {
    totalWords,
    totalDuration,
    avgWordsPerSecond: totalDuration > 0 ? totalWords / totalDuration : 0,
  };
}

/**
 * Process script components and calculate metrics for each
 */
export function processScriptComponents(
  components: Omit<ScriptComponent, "wordCount" | "estimatedDuration">[],
): ScriptComponent[] {
  return components.map((component) => {
    const metrics = calculateScriptMetrics(component.content);
    return {
      ...component,
      wordCount: metrics.wordCount,
      estimatedDuration: metrics.estimatedDuration,
    };
  });
}

/**
 * Simple readability score calculation (Flesch Reading Ease approximation)
 * Returns score 0-100 (higher = more readable)
 */
function calculateReadabilityScore(content: string): number {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  const vowels = word.match(/[aeiouy]+/g);
  let syllableCount = vowels ? vowels.length : 1;

  // Subtract silent 'e' at the end
  if (word.endsWith("e")) syllableCount--;

  // Ensure at least 1 syllable
  return Math.max(1, syllableCount);
}
