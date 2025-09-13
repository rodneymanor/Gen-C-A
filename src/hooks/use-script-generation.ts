"use client";

import { useCallback, useMemo, useState } from "react";

import { buildAuthHeaders } from "@/lib/http/auth-headers";

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
      setIsLoading(true);
      setError(null);
      try {
        const headers = await buildAuthHeaders();
        const res = await fetch("/api/script/generate", {
          method: "POST",
          headers,
          body: JSON.stringify({ idea, length, persona }),
        });
        const data: GenerateScriptResponse = await res.json();
        if (!res.ok || !data.success || !data.script) {
          throw new Error(data.error ?? `Failed with status ${res.status}`);
        }
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return { success: false, error: message } as GenerateScriptResponse;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return useMemo(() => ({ generateScript, isLoading, error }), [generateScript, isLoading, error]);
}
