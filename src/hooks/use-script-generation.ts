"use client";

import { useCallback, useMemo, useState } from "react";

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { AIAnalysisService } from "@/services/ai-analysis-service";

type GeneratedScript = {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
};

type GenerateScriptResponse = {
  success: boolean;
  script?: GeneratedScript;
  error?: string;
};

export function useScriptGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = useCallback(
    async (idea: string, length: "15" | "20" | "30" | "45" | "60" | "90" = "60", persona?: any) => {
      console.log("🚀 [useScriptGeneration] Starting script generation:", { idea, length, persona });
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("🤖 [useScriptGeneration] Using real Gemini backend for script generation");
        
        // Initialize AI Analysis Service
        const aiService = new AIAnalysisService();
        
        // Create a comprehensive transcript/prompt for the AI to analyze
        const scriptPrompt = `
Generate a ${length}-second script for the following idea: "${idea}"

Please create engaging content that follows this structure:
- Hook: An attention-grabbing opener that stops people from scrolling
- Bridge: A transition that connects the hook to the main content
- Golden Nugget: The core value or main insight 
- WTA (What to Action): A compelling call-to-action that encourages engagement

The script should be optimized for social media platforms and designed to maximize viewer engagement and retention.

${persona ? `Target persona: ${JSON.stringify(persona)}` : ''}

Please ensure the content is valuable, actionable, and appropriate for a ${length}-second format.
        `.trim();
        
        console.log("📝 [useScriptGeneration] Sending to AI analysis service...");
        console.log("📊 [useScriptGeneration] Prompt length:", scriptPrompt.length, "characters");
        
        // Use the real AI service to generate script components
        const components = await aiService.analyzeScriptComponents(scriptPrompt);
        
        if (!components) {
          throw new Error("Failed to generate script components from AI service");
        }
        
        console.log("📝 [useScriptGeneration] Generated script components:", components);
        
        // Map the AI service response to our expected format
        const script: GeneratedScript = {
          hook: components.hook,
          bridge: components.bridge,
          goldenNugget: components.nugget, // AI service uses 'nugget', we expect 'goldenNugget'
          wta: components.wta
        };
        
        const response: GenerateScriptResponse = {
          success: true,
          script
        };
        
        console.log("✅ [useScriptGeneration] Script generation successful");
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ [useScriptGeneration] Exception:", err);
        setError(message);
        return { success: false, error: message } as GenerateScriptResponse;
      } finally {
        console.log("🏁 [useScriptGeneration] Setting loading to false");
        setIsLoading(false);
      }
    },
    [],
  );

  return useMemo(() => ({ generateScript, isLoading, error }), [generateScript, isLoading, error]);
}
