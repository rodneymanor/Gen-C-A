import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { WritingRedesignShowcase, type WritingRedesignScriptLaunchPayload } from '../test/writing-redesign';
import { auth } from '../config/firebase';

const Write: React.FC = () => {
  const navigate = useNavigate();

  const resolveAuthToken = useCallback(async (): Promise<string | null> => {
    if (!auth) return null;

    try {
      const maybeAuthStateReady = (auth as unknown as { authStateReady?: () => Promise<void> }).authStateReady;
      if (typeof maybeAuthStateReady === 'function') {
        try {
          await maybeAuthStateReady.call(auth);
        } catch (readyError) {
          console.warn('⚠️ [Write] authStateReady check failed', readyError);
        }
      }

      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }

      return await new Promise<string | null>((resolve) => {
        let resolved = false;
        let unsubscribe: (() => void) | null = null;

        const finalize = (token: string | null) => {
          if (resolved) return;
          resolved = true;
          if (unsubscribe) unsubscribe();
          resolve(token);
        };

        const timeoutId = setTimeout(() => finalize(null), 5000);

        unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            clearTimeout(timeoutId);
            const token = user ? await user.getIdToken().catch(() => null) : null;
            finalize(token);
          },
          (listenerError) => {
            clearTimeout(timeoutId);
            console.warn('⚠️ [Write] Auth listener error while resolving token', listenerError);
            finalize(null);
          }
        );
      });
    } catch (tokenError) {
      console.warn('⚠️ [Write] Unexpected error resolving auth token', tokenError);
      return null;
    }
  }, []);

  const persistGeneratedScript = useCallback(async (
    payload: WritingRedesignScriptLaunchPayload
  ) => {
    const { request, scriptContent, mappedLength, components, title, brandVoice } = payload;

    const voiceDetails = brandVoice
      ? {
          id: brandVoice.id,
          name: brandVoice.name,
          badges: Array.isArray(brandVoice.keywords) ? brandVoice.keywords.slice(0, 3) : [],
        }
      : undefined;

    const body = {
      title,
      content: scriptContent,
      summary: scriptContent.slice(0, 200),
      approach: 'speed-write' as const,
      voice: voiceDetails,
      originalIdea: request.prompt,
      targetLength: mappedLength,
      source: 'scripting' as const,
      platform: request.platform,
      status: 'draft' as const,
      tags: ['ai-generated', request.platform].filter(Boolean),
      isThread: false,
      elements: {
        hook: components.hook,
        bridge: components.bridge,
        goldenNugget: components.goldenNugget,
        wta: components.wta,
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client': 'writing-redesign-page',
    };

    try {
      const token = await resolveAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔐 [Write] Attached auth token for script persistence');
      } else {
        console.warn('⚠️ [Write] No auth token available; script will be stored locally');
      }
    } catch (tokenError) {
      console.warn('⚠️ [Write] Failed to retrieve auth token for script persistence', tokenError);
    }

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        console.warn('⚠️ [Write] Failed to persist generated script', {
          status: response.status,
          data,
        });
        return null;
      }

      console.log('💾 [Write] Generated script saved', data.script?.id);
      return data.script ?? null;
    } catch (error) {
      console.error('❌ [Write] Persisting script failed', error);
      return null;
    }
  }, [resolveAuthToken]);

  const handleLaunchScriptFlow = useCallback(async (
    payload: WritingRedesignScriptLaunchPayload
  ) => {
    const savedScript = await persistGeneratedScript(payload);

    const params = new URLSearchParams({
      content: payload.scriptContent,
      title: payload.title,
      platform: payload.request.platform,
      length: payload.request.length,
      style: payload.request.style,
    });

    if (savedScript?.id) {
      params.set('scriptId', savedScript.id);
    }

    if (payload.request.brandVoiceId) {
      params.set('brandVoiceId', payload.request.brandVoiceId);
    }

    if (payload.request.brandVoiceCreatorId) {
      params.set('brandVoiceCreatorId', payload.request.brandVoiceCreatorId);
    }

    navigate(`/editor?${params.toString()}`);
  }, [navigate, persistGeneratedScript]);

  return (
    <WritingRedesignShowcase
      onNavigateNext={() => navigate('/collections')}
      onLaunchScriptFlow={handleLaunchScriptFlow}
    />
  );
};

export { Write };
export default Write;
