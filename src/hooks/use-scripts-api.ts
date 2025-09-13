"use client";

import { useState, useCallback } from "react";

import { useAuth } from "@/contexts/auth-context";
import { Script, CreateScriptRequest, UpdateScriptRequest } from "@/types/script";

interface UseScriptsApiReturn {
  scripts: Script[];
  loading: boolean;
  error: string | null;
  fetchScripts: () => Promise<void>;
  createScript: (scriptData: CreateScriptRequest) => Promise<Script | null>;
  updateScript: (id: string, updateData: UpdateScriptRequest) => Promise<Script | null>;
  deleteScript: (id: string) => Promise<boolean>;
}

export function useScriptsApi(): UseScriptsApiReturn {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    // Get the ID token for authentication
    const idToken = await user.getIdToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    };
  }, [user]);

  const fetchScripts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/scripts", {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scripts: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setScripts(data.scripts);
      } else {
        throw new Error(data.error || "Failed to fetch scripts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching scripts:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  const createScript = useCallback(
    async (scriptData: CreateScriptRequest): Promise<Script | null> => {
      if (!user) {
        setError("User not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/scripts", {
          method: "POST",
          headers,
          body: JSON.stringify(scriptData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create script: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.script) {
          setScripts((prev) => [data.script, ...prev]);
          return data.script;
        } else {
          throw new Error(data.error || "Failed to create script");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error creating script:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, getAuthHeaders],
  );

  const updateScript = useCallback(
    async (id: string, updateData: UpdateScriptRequest): Promise<Script | null> => {
      if (!user) {
        setError("User not authenticated");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/scripts/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error(`Failed to update script: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.script) {
          setScripts((prev) => prev.map((script) => (script.id === id ? data.script : script)));
          return data.script;
        } else {
          throw new Error(data.error || "Failed to update script");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error updating script:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, getAuthHeaders],
  );

  const deleteScript = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) {
        setError("User not authenticated");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/scripts/${id}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to delete script: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setScripts((prev) => prev.filter((script) => script.id !== id));
          return true;
        } else {
          throw new Error(data.error || "Failed to delete script");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error deleting script:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, getAuthHeaders],
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
