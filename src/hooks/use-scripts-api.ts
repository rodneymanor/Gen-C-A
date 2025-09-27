"use client";

import { useState, useCallback, useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Script, CreateScriptRequest, UpdateScriptRequest } from "@/types/script";
import { createApiClient } from "@/api/client";

interface UseScriptsApiReturn {
  scripts: Script[];
  loading: boolean;
  error: string | null;
  fetchScripts: () => Promise<void>;
  createScript: (scriptData: CreateScriptRequest) => Promise<Script | null>;
  updateScript: (id: string, updateData: UpdateScriptRequest) => Promise<Script | null>;
  deleteScript: (id: string) => Promise<boolean>;
}

function extractEnvelopeError(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "error" in payload) {
    const { error } = payload as { error?: unknown };
    if (typeof error === "string" && error.trim()) return error;
  }
  return undefined;
}

export function useScriptsApi(): UseScriptsApiReturn {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const client = useMemo(() => createApiClient(""), []);

  const fetchScripts = useCallback(async () => {
    if (!firebaseUser) return;

    setLoading(true);
    setError(null);

    try {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const { data, error: apiError } = await client.GET("/api/scripts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (apiError) {
        throw new Error(extractEnvelopeError(apiError) || "Failed to fetch scripts");
      }
      if (data?.success) setScripts(data.scripts ?? []);
      else throw new Error(extractEnvelopeError(data) || "Failed to fetch scripts");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching scripts:", err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, client]);

  const createScript = useCallback(
    async (scriptData: CreateScriptRequest): Promise<Script | null> => {
      if (!firebaseUser) {
        setError("User not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const { data, error: apiError } = await client.POST("/api/scripts", {
          body: scriptData,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (apiError) throw new Error(extractEnvelopeError(apiError) || "Failed to create script");
        if (data?.success && data.script) {
          setScripts((prev) => [data.script as Script, ...prev]);
          return data.script as Script;
        }
        throw new Error(extractEnvelopeError(data) || "Failed to create script");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error creating script:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, client],
  );

  const updateScript = useCallback(
    async (id: string, updateData: UpdateScriptRequest): Promise<Script | null> => {
      if (!firebaseUser) {
        setError("User not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const { data, error: apiError } = await client.PUT("/api/scripts/{id}", {
          params: { path: { id } },
          body: updateData,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (apiError) throw new Error(extractEnvelopeError(apiError) || "Failed to update script");
        if (data?.success && data.script) {
          setScripts((prev) => prev.map((s) => (s.id === id ? (data.script as Script) : s)));
          return data.script as Script;
        }
        throw new Error(extractEnvelopeError(data) || "Failed to update script");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error updating script:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, client],
  );

  const deleteScript = useCallback(
    async (id: string): Promise<boolean> => {
      if (!firebaseUser) {
        setError("User not authenticated");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await firebaseUser.getIdToken();
        const { data, error: apiError } = await client.DELETE("/api/scripts/{id}", {
          params: { path: { id } },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (apiError) throw new Error(extractEnvelopeError(apiError) || "Failed to delete script");
        if (data?.success) {
          setScripts((prev) => prev.filter((s) => s.id !== id));
          return true;
        }
        throw new Error(extractEnvelopeError(data) || "Failed to delete script");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error deleting script:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [firebaseUser, client],
  );

  return {
    scripts,
    loading,
    error,
    fetchScripts,
    createScript,
    updateScript,
    deleteScript,
  };
}
