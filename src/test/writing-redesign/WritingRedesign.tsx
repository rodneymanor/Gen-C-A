import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import {
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashCardSubtitle,
  GcDashCardTitle,
  GcDashBlankSlate,
  GcDashDropdown,
  type GcDashDropdownOption,
  GcDashFeatureCard,
  GcDashInput,
  GcDashNavButtons,
  GcDashPlanChip,
  GcDashSearchBar,
  GcDashTabs,
  GcDashTextArea,
  type GcDashTabItem,
} from '../../components/gc-dash';
import { useScriptGeneration } from '@/hooks/use-script-generation';
import type { AIGenerationRequest, BrandVoice } from '@/types';
import { dedupeBrandVoices } from '@/utils/brand-voice';
import { DEFAULT_BRAND_VOICE_ID, DEFAULT_BRAND_VOICE_NAME, resolveDefaultBrandVoiceId } from '@/constants/brand-voices';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ideaCapsules = [
  {
    id: 'ai-onboarding',
    title: 'AI onboarding wins',
    summary: 'Show how your workspace cut onboarding from weeks to 30 days.'
  },
  {
    id: 'ops-automation',
    title: 'Ops automation in action',
    summary: 'Highlight new automations that keep revenue ops aligned.'
  },
  {
    id: 'exec-briefing',
    title: 'Exec briefing workflow',
    summary: 'Share the weekly cadence your leaders rely on.'
  },
  {
    id: 'customer-spotlight',
    title: 'Customer success spotlight',
    summary: 'Tell the story of a pilot customer unlocking speed.'
  },
];

const lengthOptions: GcDashDropdownOption[] = [
  { value: '20', label: '20 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '60 seconds' },
];

const scriptTabs: GcDashTabItem[] = [
  { id: 'script', label: 'Script', content: null },
  { id: 'outline', label: 'Outline', content: null },
  { id: 'cta', label: 'CTA', content: null },
];

type ScriptComponents = {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
};

const uiLengthToRequestLength = (value: string): 'short' | 'medium' | 'long' => {
  switch (value) {
    case '20':
      return 'short';
    case '60':
      return 'long';
    default:
      return 'medium';
  }
};

const uiLengthToDuration = (value: string): '15' | '20' | '30' | '45' | '60' | '90' => {
  switch (value) {
    case '20':
      return '20';
    case '60':
      return '60';
    case '15':
      return '15';
    case '45':
      return '45';
    case '90':
      return '90';
    default:
      return '30';
  }
};

const formatScriptForEditor = (components: ScriptComponents): string => {
  return `[HOOK]\n${components.hook}\n\n[BRIDGE]\n${components.bridge}\n\n[VALUE]\n${components.goldenNugget}\n\n[CTA]\n${components.wta}`;
};

const deriveScriptTitle = (prompt: string): string => {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'AI Script Draft';
  }

  if (normalized.length <= 60) {
    return normalized;
  }

  return `${normalized.slice(0, 57).trim()}…`;
};

type AnalyzePlatform = 'youtube' | 'tiktok' | 'instagram';

interface TranscriptChunk {
  text: string;
  start?: number;
  end?: number;
}

interface TranscriptResponse {
  url: string;
  language?: string;
  text: string;
  availableLanguages?: string[];
  chunks: TranscriptChunk[];
}

interface IdeaProof {
  type: 'stat' | 'example' | 'quote' | 'demo' | 'trend';
  text: string;
  numbers?: string;
}

interface IdeaCta {
  type: 'comment' | 'watch_full' | 'subscribe' | 'download' | 'signup' | 'follow' | 'buy' | 'share';
  prompt: string;
  target?: string | { videoTs: number };
}

interface IdeaScores {
  hookPotential: number;
  specificity: number;
  actionability: number;
  novelty: number;
  overall: number;
}

interface IdeaSeed {
  coreClaim: string;
  payoff: string;
  proof: IdeaProof;
  mechanismOrSteps?: string[];
  angle?: string;
  painPoint?: string;
  reasonToBelieve?: string;
  context?: string;
  promise?: string;
  cta: IdeaCta;
  entities?: string[];
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  provenance?: { startSec: number; endSec: number };
  scores?: IdeaScores;
}

interface GenerationMeta {
  model?: string;
  durationMs?: number;
  maxIdeas?: number;
  minOverall?: number;
  audienceLevel?: string;
  transcriptChars?: number;
}

interface AnalyzeResult {
  platform: AnalyzePlatform;
  sourceUrl: string;
  transcript: string;
  transcriptLanguage?: string;
  transcriptChunks?: TranscriptChunk[];
  ideaCount?: number;
}

const detectVideoPlatform = (input: string): AnalyzePlatform | 'unknown' => {
  if (!input) return 'unknown';
  let url: URL | null = null;
  try {
    url = new URL(input.trim());
  } catch {
    return 'unknown';
  }

  const host = url.hostname.toLowerCase();
  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    return 'youtube';
  }
  if (host.includes('tiktok.com') || host.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  if (host.includes('instagram.com') || host.includes('cdninstagram.com') || host.includes('instagr.am')) {
    return 'instagram';
  }
  return 'unknown';
};

const extractYouTubeId = (value: string): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.includes('shorts')) {
        const index = segments.indexOf('shorts');
        return segments[index + 1] || null;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const describePlatform = (platform: AnalyzePlatform) => {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'tiktok':
      return 'TikTok';
    case 'instagram':
      return 'Instagram';
    default:
      return 'Video';
  }
};

const formatScore = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const buildIdeaPrompt = (
  idea: IdeaSeed,
  transcript: string | undefined,
  platform: AnalyzePlatform,
): string => {
  const parts: string[] = [];
  parts.push(`Platform: ${describePlatform(platform)}`);
  parts.push(`Core claim: ${idea.coreClaim}`);
  if (idea.payoff) parts.push(`Payoff: ${idea.payoff}`);
  if (idea.proof?.text) parts.push(`Proof: ${idea.proof.text}`);
  if (idea.mechanismOrSteps?.length) {
    parts.push('Steps:');
    idea.mechanismOrSteps.slice(0, 4).forEach((step, index) => {
      parts.push(`  ${index + 1}. ${step}`);
    });
  }
  if (idea.cta?.prompt) parts.push(`Call to action: ${idea.cta.prompt}`);
  if (idea.painPoint) parts.push(`Pain point: ${idea.painPoint}`);
  if (idea.reasonToBelieve) parts.push(`Reason to believe: ${idea.reasonToBelieve}`);
  if (idea.angle) parts.push(`Angle: ${idea.angle}`);
  if (idea.entities?.length) parts.push(`Entities: ${idea.entities.join(', ')}`);

  if (transcript?.trim()) {
    const snippet = transcript.trim().slice(0, 900);
    parts.push('Transcript snippet (for extra context, do not quote verbatim):');
    parts.push(snippet);
  }

  parts.push('Generate a short-form video script that follows the structure: hook, bridge, golden nugget, CTA.');
  return parts.join('\n');
};

type Phase = 'input' | 'generating' | 'result';

type EntryMode = 'notes' | 'inspiration' | 'suggestions';

const entryOptions: Array<{
  id: EntryMode;
  title: string;
  description: string;
  meta?: string;
}> = [
  {
    id: 'notes',
    title: 'Use notes to brief the AI writer',
    description: 'Share your thoughts about a topic and the AI writer will shape the script around them.',
    meta: '3–5 bullets recommended',
  },
  {
    id: 'inspiration',
    title: 'Get inspiration',
    description: 'Rewrite a short-form video script—drop a link to extract the key beats and craft your own take.',
    meta: 'Supports TikTok, Reels, Shorts',
  },
  {
    id: 'suggestions',
    title: 'Suggested ideas',
    description: 'Pick from AI-curated ideas based on your onboarding goals and generate in one click.',
  },
];

export interface WritingRedesignShowcaseProps {
  onNavigateNext?: () => void;
}

export const WritingRedesignShowcase: React.FC<WritingRedesignShowcaseProps> = ({ onNavigateNext }) => {
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [activeTab, setActiveTab] = useState(scriptTabs[0]!.id);
  const { generateScript, isLoading: isGenerating, error: generationError } = useScriptGeneration();
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [defaultBrandVoiceId, setDefaultBrandVoiceId] = useState<string>(DEFAULT_BRAND_VOICE_ID);
  const [voice, setVoice] = useState<string>(DEFAULT_BRAND_VOICE_ID);
  const [length, setLength] = useState(lengthOptions[1]!.value);
  const [selectedIdea, setSelectedIdea] = useState(ideaCapsules[0]!);
  const [progress, setProgress] = useState(0);
  const [notesInput, setNotesInput] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [generatedComponents, setGeneratedComponents] = useState<ScriptComponents | null>(null);
  const [lastScriptContent, setLastScriptContent] = useState<string>('');
  const [lastRequest, setLastRequest] = useState<AIGenerationRequest | null>(null);
  const [lastMappedLength, setLastMappedLength] = useState<'15' | '20' | '30' | '45' | '60' | '90'>('30');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPersistingScript, setIsPersistingScript] = useState(false);
  const [currentNotesDraft, setCurrentNotesDraft] = useState<string>('');
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeIdeas, setAnalyzeIdeas] = useState<IdeaSeed[]>([]);
  const [analyzeMeta, setAnalyzeMeta] = useState<GenerationMeta | null>(null);
  const [analyzeRawIdeasJson, setAnalyzeRawIdeasJson] = useState('');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeIdeaError, setAnalyzeIdeaError] = useState<string | null>(null);
  const [isAnalyzingClip, setIsAnalyzingClip] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState('');
  const [selectedAnalyzeIdeaIndex, setSelectedAnalyzeIdeaIndex] = useState<number | null>(null);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch('/api/brand-voices/list');
        const data = await res.json().catch(() => null);

        if (!isMounted) {
          return;
        }

        if (res.ok && data?.success && Array.isArray(data.voices)) {
          const mapped: BrandVoice[] = data.voices.map((voiceData: any) => {
            const isDefault = voiceData.isDefault === true || voiceData.id === DEFAULT_BRAND_VOICE_ID;
            return {
              id: voiceData.id,
              creatorId: voiceData.creatorId || voiceData.id || '',
              name: isDefault ? DEFAULT_BRAND_VOICE_NAME : (voiceData.name || voiceData.id || DEFAULT_BRAND_VOICE_NAME),
              description: voiceData.description || '',
              tone: voiceData.tone || 'Varied',
              voice: voiceData.voice || 'Derived from analysis',
              targetAudience: voiceData.targetAudience || 'General',
              keywords: Array.isArray(voiceData.keywords) ? voiceData.keywords : [],
              platforms: Array.isArray(voiceData.platforms) && voiceData.platforms.length ? voiceData.platforms : ['tiktok'],
              created: voiceData.created ? new Date(voiceData.created._seconds ? voiceData.created._seconds * 1000 : voiceData.created) : new Date(),
              isDefault,
              isShared: voiceData.isShared ?? false,
            } satisfies BrandVoice;
          });

          const deduped = dedupeBrandVoices(mapped);
          setBrandVoices(deduped);

          const resolvedDefault = resolveDefaultBrandVoiceId(deduped);
          setDefaultBrandVoiceId(resolvedDefault);
          setVoice(resolvedDefault);
        } else {
          setBrandVoices([]);
          setDefaultBrandVoiceId(DEFAULT_BRAND_VOICE_ID);
          setVoice(DEFAULT_BRAND_VOICE_ID);
        }
      } catch (error) {
        if (isMounted) {
          console.warn('⚠️ [WritingRedesign] Failed to load brand voices', error);
          setBrandVoices([]);
          setDefaultBrandVoiceId(DEFAULT_BRAND_VOICE_ID);
          setVoice(DEFAULT_BRAND_VOICE_ID);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const brandVoiceOptions = useMemo<GcDashDropdownOption[]>(() => {
    if (!brandVoices.length) {
      return [{ value: DEFAULT_BRAND_VOICE_ID, label: DEFAULT_BRAND_VOICE_NAME }];
    }

    return brandVoices.map((brandVoice) => ({
      value: brandVoice.id,
      label: brandVoice.name || DEFAULT_BRAND_VOICE_NAME,
    }));
  }, [brandVoices]);

  const selectedBrandVoice = useMemo(() => {
    return brandVoices.find((item) => item.id === voice) ?? null;
  }, [brandVoices, voice]);

  useEffect(() => {
    if (!voice && defaultBrandVoiceId) {
      setVoice(defaultBrandVoiceId);
    }
  }, [defaultBrandVoiceId, voice]);

  useEffect(() => {
    if (phase !== 'generating') return;
    setProgress(12);
    const handle = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) {
          window.clearInterval(handle);
          setPhase('result');
          return 100;
        }
        return prev + 12;
      });
    }, 260);
    return () => window.clearInterval(handle);
  }, [phase]);

  useEffect(() => {
    if (entryMode !== 'suggestions' && phase !== 'input') {
      setPhase('input');
      setProgress(0);
    }
  }, [entryMode, phase]);

  useEffect(() => {
    setLocalError(null);
    if (entryMode !== 'notes') {
      setGeneratedComponents(null);
      setLastRequest(null);
      setLastScriptContent('');
      setCurrentNotesDraft('');
    }
    if (entryMode !== 'inspiration') {
      setAnalyzeResult(null);
      setAnalyzeIdeas([]);
      setAnalyzeMeta(null);
      setAnalyzeRawIdeasJson('');
      setAnalyzeError(null);
      setAnalyzeIdeaError(null);
      setAnalyzeStage('');
      setIsAnalyzingClip(false);
      setSelectedAnalyzeIdeaIndex(null);
      setIsGeneratingIdea(false);
    }
  }, [entryMode]);

  useEffect(() => {
    if (phase === 'result' && currentNotesDraft && notesInput.trim() !== currentNotesDraft.trim()) {
      setPhase('input');
      setGeneratedComponents(null);
      setLastRequest(null);
      setLastScriptContent('');
      setProgress(0);
      setCurrentNotesDraft('');
    }
  }, [currentNotesDraft, notesInput, phase]);

  const outlineGuidance = useMemo(() => {
    if (selectedBrandVoice) {
      return `Lean into the ${selectedBrandVoice.name.toLowerCase()} tone: hook fast, reinforce the proof, and close with a clear next step.`;
    }
    return 'Lead with a hook → reinforce proof → finish with a crisp CTA or next step.';
  }, [selectedBrandVoice]);

  const voiceLabel = selectedBrandVoice?.name ?? DEFAULT_BRAND_VOICE_NAME;

  const voiceLabelLower = useMemo(() => voiceLabel.toLowerCase(), [voiceLabel]);

  const notesPreview = useMemo(() => {
    if (!currentNotesDraft) return '';
    const firstNonEmptyLine = currentNotesDraft
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    const previewSource = firstNonEmptyLine || currentNotesDraft;
    if (previewSource.length <= 90) {
      return previewSource;
    }
    return `${previewSource.slice(0, 87)}…`;
  }, [currentNotesDraft]);

  const displayScriptContent = useMemo(() => {
    if (lastScriptContent) {
      return lastScriptContent;
    }

    if (generatedComponents) {
      return formatScriptForEditor(generatedComponents);
    }

    return '';
  }, [generatedComponents, lastScriptContent]);

  const handleGenerate = () => {
    setPhase('generating');
  };

  const persistGeneratedScript = useCallback(async (
    params: {
      request: AIGenerationRequest;
      scriptContent: string;
      mappedLength: '15' | '20' | '30' | '45' | '60' | '90';
      components: ScriptComponents;
      title: string;
    }
  ) => {
    const { request, scriptContent, mappedLength, components, title } = params;
    const brandVoiceDetails = request.brandVoiceId ? brandVoices.find((item) => item.id === request.brandVoiceId) : undefined;

    const payload = {
      title,
      content: scriptContent,
      summary: scriptContent.slice(0, 200),
      approach: 'speed-write' as const,
      voice: brandVoiceDetails
        ? {
            id: brandVoiceDetails.id,
            name: brandVoiceDetails.name,
            badges: Array.isArray(brandVoiceDetails.keywords)
              ? brandVoiceDetails.keywords.slice(0, 3)
              : [],
          }
        : undefined,
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

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client': 'writing-redesign',
      };

      const resolveAuthToken = async (): Promise<string | null> => {
        if (!auth) return null;

        try {
          const maybeAuthStateReady = (auth as unknown as { authStateReady?: () => Promise<void> }).authStateReady;
          if (typeof maybeAuthStateReady === 'function') {
            try {
              await maybeAuthStateReady.call(auth);
            } catch (readyError) {
              console.warn('⚠️ [WritingRedesign] authStateReady check failed', readyError);
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
                console.warn('⚠️ [WritingRedesign] Auth listener error while resolving token', listenerError);
                finalize(null);
              },
            );
          });
        } catch (tokenError) {
          console.warn('⚠️ [WritingRedesign] Unexpected error resolving auth token', tokenError);
          return null;
        }
      };

      try {
        const token = await resolveAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          console.log('🔐 [WritingRedesign] Attached auth token for script persistence');
        } else {
          console.warn('⚠️ [WritingRedesign] No auth token available; script will be stored locally');
        }
      } catch (tokenError) {
        console.warn('⚠️ [WritingRedesign] Failed to retrieve auth token for script persistence', tokenError);
      }

      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        console.warn('⚠️ [WritingRedesign] Failed to persist generated script', {
          status: response.status,
          data,
        });
        return null;
      }

      console.log('💾 [WritingRedesign] Generated script saved', data.script?.id);
      return data.script ?? null;
    } catch (error) {
      console.error('❌ [WritingRedesign] Persisting script failed', error);
      return null;
    }
  }, [brandVoices]);

  const handleOpenEditor = useCallback(async () => {
    if (!lastRequest || !generatedComponents || !lastScriptContent) {
      setLocalError('Generate a script before opening the editor.');
      return;
    }

    setIsPersistingScript(true);
    setLocalError(null);

    try {
      const title = deriveScriptTitle(lastRequest.prompt);
      const savedScript = await persistGeneratedScript({
        request: lastRequest,
        scriptContent: lastScriptContent,
        mappedLength: lastMappedLength,
        components: generatedComponents,
        title,
      });

      const params = new URLSearchParams({
        content: lastScriptContent,
        title,
        platform: lastRequest.platform,
        length: lastRequest.length,
        style: lastRequest.style,
      });

      if (savedScript?.id) {
        params.set('scriptId', savedScript.id);
      }

      if (lastRequest.brandVoiceId) {
        params.set('brandVoiceId', lastRequest.brandVoiceId);
      }

      if (lastRequest.brandVoiceCreatorId) {
        params.set('brandVoiceCreatorId', lastRequest.brandVoiceCreatorId);
      }

      window.location.assign(`/editor?${params.toString()}`);
    } catch (error) {
      console.error('❌ [WritingRedesign] Failed to open editor', error);
      setLocalError('We saved the draft locally but could not open the editor. Please try again.');
    } finally {
      setIsPersistingScript(false);
    }
  }, [generatedComponents, lastMappedLength, lastRequest, lastScriptContent, persistGeneratedScript]);

  const handleSubmitNotes = useCallback(async () => {
    const trimmedNotes = notesInput.trim();
    if (!trimmedNotes) {
      setLocalError('Add a few notes so the AI writer knows where to begin.');
      return;
    }

    setLocalError(null);
    setGeneratedComponents(null);
    setLastRequest(null);
    setLastScriptContent('');
    setCurrentNotesDraft(trimmedNotes);
    setPhase('generating');
    setProgress(12);

    const mappedLength = uiLengthToDuration(length);
    const requestLength = uiLengthToRequestLength(length);

    const response = await generateScript({
      idea: trimmedNotes,
      length: mappedLength,
      brandVoiceId: selectedBrandVoice?.id,
      brandVoiceCreatorId: selectedBrandVoice?.creatorId,
    });

    if (response.success && response.script) {
      const components: ScriptComponents = {
        hook: response.script.hook,
        bridge: response.script.bridge,
        goldenNugget: response.script.goldenNugget,
        wta: response.script.wta,
      };

      const scriptContent = formatScriptForEditor(components);
      const request: AIGenerationRequest = {
        prompt: trimmedNotes,
        aiModel: 'creative',
        length: requestLength,
        style: 'engaging',
        platform: 'tiktok',
        brandVoiceId: selectedBrandVoice?.id,
        brandVoiceCreatorId: selectedBrandVoice?.creatorId,
        additionalSettings: { entryMode: 'notes' },
      };

      setGeneratedComponents(components);
      setLastScriptContent(scriptContent);
      setLastRequest(request);
      setLastMappedLength(mappedLength);
      setPhase('result');
      setProgress(100);
    } else {
      setPhase('input');
      setProgress(0);
      setLocalError(response.error ?? 'We could not generate a script this time. Please try again.');
    }
  }, [generateScript, length, notesInput, selectedBrandVoice]);

  const handleAnalyzeClip = useCallback(async () => {
    const trimmedUrl = inspirationUrl.trim();
    if (!trimmedUrl) {
      setAnalyzeError('Paste a video URL to continue.');
      return;
    }

    const platform = detectVideoPlatform(trimmedUrl);
    if (platform === 'unknown') {
      setAnalyzeError('Only YouTube, TikTok, or Instagram video URLs are supported for analysis.');
      return;
    }

    setAnalyzeError(null);
    setAnalyzeIdeaError(null);
    setAnalyzeStage('Preparing');
    setIsAnalyzingClip(true);
    setAnalyzeResult(null);
    setAnalyzeIdeas([]);
    setAnalyzeMeta(null);
    setAnalyzeRawIdeasJson('');
    setSelectedAnalyzeIdeaIndex(null);
    setIsGeneratingIdea(false);

    try {
      if (platform === 'youtube') {
        setAnalyzeStage('Fetching transcript');
        const transcriptResponse = await fetch('/api/video/youtube-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl, lang: 'en' }),
        });
        const transcriptPayload = await transcriptResponse.json().catch(() => null);
        if (!transcriptResponse.ok || !transcriptPayload?.success || !transcriptPayload?.transcript) {
          throw new Error(transcriptPayload?.error || 'Failed to fetch the YouTube transcript.');
        }

        const transcriptData: TranscriptResponse = transcriptPayload.transcript;
        const transcriptText = transcriptData.text ?? '';
        if (!transcriptText.trim()) {
          throw new Error('The transcript service returned no content.');
        }

        setAnalyzeResult({
          platform,
          sourceUrl: trimmedUrl,
          transcript: transcriptText,
          transcriptLanguage: transcriptData.language,
          transcriptChunks: transcriptData.chunks,
        });

        const videoId = extractYouTubeId(trimmedUrl) ?? undefined;

        try {
          setAnalyzeStage('Generating video ideas');
          const ideaResponse = await fetch('/api/scripts/youtube-ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: trimmedUrl,
              transcript: transcriptText,
              chunks: transcriptData.chunks ?? [],
              videoId,
              lang: transcriptData.language ?? 'en',
              maxIdeas: 8,
              minOverall: 70,
              audienceLevel: 'intermediate',
            }),
          });

          const ideasText = await ideaResponse.text();
          if (!ideaResponse.ok) {
            let message = ideasText || 'Failed to generate idea seeds.';
            try {
              const parsed = JSON.parse(ideasText);
              message = parsed.error || message;
            } catch (error) {
              // ignore JSON parse errors, keep raw message
            }
            throw new Error(message);
          }

          try {
            const parsed = JSON.parse(ideasText);
            if (!parsed?.success) {
              throw new Error(parsed?.error || 'Idea generation was unsuccessful.');
            }
            const ideas: IdeaSeed[] = Array.isArray(parsed.ideas) ? parsed.ideas : [];
            setAnalyzeIdeas(ideas);
            setAnalyzeMeta(parsed.meta ?? null);
            setAnalyzeRawIdeasJson(JSON.stringify(ideas, null, 2));
            setAnalyzeResult((prev) =>
              prev ? { ...prev, ideaCount: ideas.length } : prev,
            );
          } catch (parseError) {
            throw new Error('Failed to parse idea seed response.');
          }
        } catch (ideaError) {
          setAnalyzeIdeaError(ideaError instanceof Error ? ideaError.message : 'Idea generation failed.');
        }
      } else {
        setAnalyzeStage('Resolving media');
        const scrapeResponse = await fetch('/api/video/scrape-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });
        const scrapePayload = await scrapeResponse.json().catch(() => null);
        if (!scrapeResponse.ok || !scrapePayload?.success || !scrapePayload?.result) {
          throw new Error(scrapePayload?.error || 'Failed to resolve the video media URL.');
        }

        const downloadUrl = scrapePayload.result.audioUrl || scrapePayload.result.downloadUrl;
        if (!downloadUrl) {
          throw new Error('Unable to find a downloadable media URL for this video.');
        }

        setAnalyzeStage('Transcribing video');
        const transcribeResponse = await fetch('/api/video/transcribe-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: downloadUrl, platform }),
        });
        const transcribePayload = await transcribeResponse.json().catch(() => null);
        if (!transcribeResponse.ok || !transcribePayload?.success) {
          throw new Error(transcribePayload?.error || 'Failed to transcribe the video.');
        }

        const transcriptText: string = transcribePayload.transcript ?? '';
        if (!transcriptText.trim()) {
          throw new Error('Transcription completed but returned empty content.');
        }

        setAnalyzeResult({
          platform,
          sourceUrl: trimmedUrl,
          transcript: transcriptText,
        });

        try {
          setAnalyzeStage('Generating video ideas');
          const ideaResponse = await fetch('/api/scripts/youtube-ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: trimmedUrl,
              transcript: transcriptText,
              maxIdeas: 6,
              minOverall: 65,
              audienceLevel: 'intermediate',
              sourcePlatform: platform,
            }),
          });

          const ideasText = await ideaResponse.text();
          if (!ideaResponse.ok) {
            let message = ideasText || 'Failed to generate video ideas.';
            try {
              const parsed = JSON.parse(ideasText);
              message = parsed.error || message;
            } catch (error) {
              // ignore JSON parse errors
            }
            throw new Error(message);
          }

          try {
            const parsed = JSON.parse(ideasText);
            if (!parsed?.success) {
              throw new Error(parsed?.error || 'Idea generation was unsuccessful.');
            }
            const ideas: IdeaSeed[] = Array.isArray(parsed.ideas) ? parsed.ideas : [];
            setAnalyzeIdeas(ideas);
            setAnalyzeMeta(parsed.meta ?? null);
            setAnalyzeRawIdeasJson(JSON.stringify(ideas, null, 2));
            setAnalyzeResult((prev) =>
              prev ? { ...prev, ideaCount: ideas.length } : prev,
            );
          } catch (parseError) {
            throw new Error('Failed to parse idea seed response.');
          }
        } catch (ideaError) {
          setAnalyzeIdeaError(ideaError instanceof Error ? ideaError.message : 'Idea generation failed.');
        }
      }

      setAnalyzeStage('');
    } catch (error) {
      setAnalyzeStage('');
      setAnalyzeResult(null);
      setAnalyzeIdeas([]);
      setAnalyzeMeta(null);
      setAnalyzeRawIdeasJson('');
      setAnalyzeIdeaError(null);
      setAnalyzeError(error instanceof Error ? error.message : 'Failed to analyze the video.');
    } finally {
      setIsAnalyzingClip(false);
    }
  }, [inspirationUrl]);

  const handleGenerateIdeaScript = useCallback(async () => {
    if (selectedAnalyzeIdeaIndex == null || !analyzeIdeas[selectedAnalyzeIdeaIndex]) {
      setAnalyzeIdeaError('Select an idea to continue.');
      return;
    }

    const idea = analyzeIdeas[selectedAnalyzeIdeaIndex];
    const platform = analyzeResult?.platform ?? 'tiktok';
    const prompt = buildIdeaPrompt(idea, analyzeResult?.transcript, platform);
    const mappedLength = uiLengthToDuration(length);
    const requestLength = uiLengthToRequestLength(length);

    setAnalyzeIdeaError(null);
    setIsGeneratingIdea(true);

    try {
      const response = await generateScript({
        idea: prompt,
        length: mappedLength,
        brandVoiceId: selectedBrandVoice?.id,
        brandVoiceCreatorId: selectedBrandVoice?.creatorId,
      });

      if (!response.success || !response.script) {
        throw new Error(response.error || 'Failed to generate the script.');
      }

      const components: ScriptComponents = {
        hook: response.script.hook,
        bridge: response.script.bridge,
        goldenNugget: response.script.goldenNugget,
        wta: response.script.wta,
      };

      const scriptContent = formatScriptForEditor(components);
      const request: AIGenerationRequest = {
        prompt,
        aiModel: 'creative',
        length: requestLength,
        style: 'engaging',
        platform: platform === 'youtube' ? 'youtube' : 'tiktok',
        brandVoiceId: selectedBrandVoice?.id,
        brandVoiceCreatorId: selectedBrandVoice?.creatorId,
        additionalSettings: {
          entryMode: 'inspiration',
          ideaIndex: selectedAnalyzeIdeaIndex,
          ideaCoreClaim: idea.coreClaim,
          sourceUrl: analyzeResult?.sourceUrl,
        },
      };

      setGeneratedComponents(components);
      setLastScriptContent(scriptContent);
      setLastRequest(request);
      setLastMappedLength(mappedLength);
      setPhase('result');
      setProgress(100);

      const title = deriveScriptTitle(idea.coreClaim || prompt);
      const savedScript = await persistGeneratedScript({
        request,
        scriptContent,
        mappedLength,
        components,
        title,
      });

      const params = new URLSearchParams({
        content: scriptContent,
        title,
        platform: request.platform,
        length: request.length,
        style: request.style,
      });

      if (savedScript?.id) {
        params.set('scriptId', savedScript.id);
      }
      if (request.brandVoiceId) {
        params.set('brandVoiceId', request.brandVoiceId);
      }
      if (request.brandVoiceCreatorId) {
        params.set('brandVoiceCreatorId', request.brandVoiceCreatorId);
      }
      params.set('ideaIndex', String(selectedAnalyzeIdeaIndex));

      setIsGeneratingIdea(false);
      window.location.assign(`/editor?${params.toString()}`);
    } catch (error) {
      console.error('❌ [WritingRedesign] Failed to generate script from idea', error);
      setAnalyzeIdeaError(error instanceof Error ? error.message : 'Failed to generate the script.');
      setIsGeneratingIdea(false);
    }
  }, [
    analyzeIdeas,
    analyzeResult,
    generateScript,
    length,
    persistGeneratedScript,
    selectedAnalyzeIdeaIndex,
    selectedBrandVoice,
  ]);

  const containerStyles = css`
    min-height: 100vh;
    background: rgba(9, 30, 66, 0.02);
    padding: 48px 64px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  `;

  const shellStyles = css`
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 40px;
  `;

  const cardStyles = css`
    background: #fff;
    border: 1px solid rgba(9, 30, 66, 0.16);
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    display: grid;
    gap: 16px;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;

    &:hover {
      border-color: var(--color-primary-500, #0b5cff);
      background: rgba(11, 92, 255, 0.04);
      transform: scale(1.01);
    }
  `;

  const mainColumnStyles = css`
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
  `;

  const entryGridStyles = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  `;

  const singleColumnStyles = css`
    display: grid;
    gap: 24px;
    max-width: 960px;
  `;

  const analyzeStatusStyles = css`
    font-size: 13px;
    color: rgba(9, 30, 66, 0.65);
  `;

  const analyzeErrorStyles = css`
    font-size: 13px;
    color: #b42318;
  `;

  const analyzeWarningStyles = css`
    font-size: 13px;
    color: #a15c00;
  `;

  const ideaGridStyles = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  `;

  const generatingSection = (
    <section css={cardStyles}>
      <h3 css={css`margin: 0; font-size: 18px; letter-spacing: -0.2px;`}>
        The AI writer is shaping your story…
      </h3>
      <span css={css`font-size: 13px; color: rgba(9, 30, 66, 0.6);`}>
        {length} second script in the {voiceLabelLower} voice{notesPreview ? ` based on “${notesPreview}”` : ''}.
      </span>
      <div
        css={css`
          height: 8px;
          width: 100%;
          border-radius: 999px;
          background: rgba(9, 30, 66, 0.1);
          overflow: hidden;
        `}
      >
        <div
          css={css`
            height: 100%;
            width: ${progress}%;
            border-radius: inherit;
            background: var(--color-primary-500, #0b5cff);
            transition: width 0.3s ease;
          `}
        />
      </div>
      <div
        css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        `}
      >
        <GcDashFeatureCard
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2.1L9.2 5l2.7 1.1L9.2 7.3 8 10.2 6.8 7.3 4.1 6.1 6.8 5 8 2.1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>}
          title="Story beats"
          description="Expanding key talking points into hook, proof, CTA moments."
        />
        <GcDashFeatureCard
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="3.2" width="10" height="11.6" rx="1.2" stroke="currentColor" strokeWidth="1.1" /><path d="M6 6.2h6M6 9h6M6 11.8h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>}
          title="Voice alignment"
          description="Applying brand voice patterns and approved phrasing."
        />
        <GcDashFeatureCard
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="5.6" stroke="currentColor" strokeWidth="1.1" /><path d="M11.3 6.7l-1 3.7-3.7 1 1-3.7 3.7-1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg>}
          title="Runtime calibration"
          description="Balancing pacing for the selected length with high retention."
        />
      </div>
    </section>
  );

  const resultSection = (
    <section css={cardStyles}>
      <header
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        `}
      >
        <div css={css`display: flex; flex-direction: column; gap: 4px;`}>
          <h2 css={css`margin: 0; font-size: 22px; letter-spacing: -0.3px;`}>
            Script ready to review
          </h2>
          <span css={css`font-size: 13px; color: rgba(9, 30, 66, 0.6);`}>
            {length} second story in the {voiceLabelLower} voice{notesPreview ? ` · based on “${notesPreview}”` : ''}.
          </span>
        </div>
        <div css={css`display: inline-flex; gap: 8px;`}>
          <GcDashButton variant="ghost" disabled={!displayScriptContent}>
            Share preview
          </GcDashButton>
          <GcDashButton
            onClick={handleOpenEditor}
            disabled={!displayScriptContent}
            isLoading={isPersistingScript}
          >
            Open in editor
          </GcDashButton>
        </div>
      </header>

      <GcDashTabs tabs={scriptTabs} activeTabId={activeTab} onChange={setActiveTab} variant="underline" />

      <section
        css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        `}
      >
        <GcDashFeatureCard
          title="Hook"
          description={generatedComponents?.hook || 'Your hook will appear here after generation.'}
        />
        <GcDashFeatureCard
          title="Bridge"
          description={generatedComponents?.bridge || 'We will add the connective story beats once the script is ready.'}
        />
        <GcDashFeatureCard
          title="Golden nugget"
          description={generatedComponents?.goldenNugget || 'Your main proof point will land here once generation completes.'}
        />
        <GcDashFeatureCard
          title="Call to action"
          description={generatedComponents?.wta || 'Your closing CTA shows up here after generation.'}
        />
      </section>

      <article
        css={css`
          border: 1px dashed rgba(9, 30, 66, 0.18);
          border-radius: 12px;
          background: rgba(9, 30, 66, 0.02);
          padding: 20px;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(9, 30, 66, 0.82);
          white-space: pre-line;
        `}
      >
        {displayScriptContent || 'Add notes and generate a script to preview the draft here.'}
      </article>
    </section>
  );

  const suggestionsView = (
    <div css={singleColumnStyles}>
      <GcDashCard>
        <GcDashCardBody css={css`gap: 20px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 4px;`}>
            <GcDashCardTitle>Ideas tailored to your goals</GcDashCardTitle>
            <GcDashCardSubtitle>
              Choose a prompt sourced from your onboarding answers. Our AI writer will use it as the brief for your script.
            </GcDashCardSubtitle>
          </div>

          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              align-items: flex-end;
            `}
          >
            <label css={css`display: grid; gap: 6px; min-width: 200px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
              Brand voice
              <GcDashDropdown
                label="Brand voice"
                options={brandVoiceOptions}
                selectedValue={voice}
                onSelect={(value) => setVoice(value)}
              />
            </label>
            <label css={css`display: grid; gap: 6px; min-width: 200px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
              Video length
              <GcDashDropdown
                label="Video length"
                options={lengthOptions}
                selectedValue={length}
                onSelect={(value) => setLength(value)}
              />
            </label>
          </div>

          <div
            css={css`
              display: grid;
              gap: 12px;
            `}
          >
            {ideaCapsules.map((capsule) => {
              const isSelected = selectedIdea.id === capsule.id;
              return (
                <button
                  key={capsule.id}
                  type="button"
                  onClick={() => setSelectedIdea(capsule)}
                  css={css`
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                    text-align: left;
                    border-radius: 12px;
                    padding: 14px 16px;
                    border: 1px solid ${isSelected ? 'var(--color-primary-500, #0b5cff)' : 'rgba(9, 30, 66, 0.16)'};
                    background: ${isSelected ? 'rgba(11, 92, 255, 0.08)' : 'rgba(9, 30, 66, 0.02)'};
                    cursor: pointer;
                    transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;

                    &:hover {
                      border-color: var(--color-primary-500, #0b5cff);
                      transform: translateY(-1px);
                    }

                    span:nth-of-type(1) {
                      font-size: 15px;
                      font-weight: 600;
                      color: rgba(9, 30, 66, 0.9);
                    }

                    span:nth-of-type(2) {
                      font-size: 13px;
                      color: rgba(9, 30, 66, 0.68);
                    }
                  `}
                >
                  <span>{capsule.title}</span>
                  <span>{capsule.summary}</span>
                </button>
              );
            })}
          </div>

          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <span css={css`font-size: 13px; color: rgba(9, 30, 66, 0.65);`}>
              Selected idea: <strong>{selectedIdea.title}</strong>
            </span>
            <GcDashButton onClick={handleGenerate}>Generate script</GcDashButton>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="Workflow tip"
        description={outlineGuidance}
        highlight
      />

      {phase === 'generating' && generatingSection}
      {phase === 'result' && resultSection}
    </div>
  );

  const notesView = (
    <div css={singleColumnStyles}>
      <GcDashCard>
        <GcDashCardBody>
          <GcDashCardTitle>Use notes to brief the AI writer</GcDashCardTitle>
          <GcDashCardSubtitle>
            Share quick bullets about your idea, launch, or announcement. The AI writer will turn them into a script with hook, proof, and CTA moments.
          </GcDashCardSubtitle>
          <GcDashTextArea
            placeholder={`• Launching the onboarding workspace next Tuesday\n• Highlight 30-day rollout + exec alignment\n• CTA: DM for pilot access`}
            rows={6}
            value={notesInput}
            onChange={(event) => setNotesInput(event.target.value)}
          />
          {(localError || generationError) && (
            <span css={css`color: #b42318; font-size: 13px;`}>
              {localError ?? generationError}
            </span>
          )}
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              align-items: flex-end;
              justify-content: space-between;
            `}
          >
            <div
              css={css`
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
              `}
            >
              <label css={css`display: grid; gap: 6px; min-width: 200px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
                Brand voice
                <GcDashDropdown
                  label="Brand voice"
                  options={brandVoiceOptions}
                  selectedValue={voice}
                  onSelect={(value) => setVoice(value)}
                />
              </label>
              <label css={css`display: grid; gap: 6px; min-width: 200px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
                Video length
                <GcDashDropdown
                  label="Video length"
                  options={lengthOptions}
                  selectedValue={length}
                  onSelect={(value) => setLength(value)}
                />
              </label>
            </div>
            <div
              css={css`
                display: flex;
                gap: 12px;
              `}
            >
              <GcDashButton variant="ghost" onClick={() => setNotesInput('')}>
                Clear
              </GcDashButton>
              <GcDashButton onClick={handleSubmitNotes} isLoading={isGenerating}>
                Generate script
              </GcDashButton>
            </div>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="What happens next"
        description="We map your notes into a clear storyline and keep brand voice guardrails in place before handing off to the editor."
        highlight
      />

      {phase === 'generating' && generatingSection}
      {phase === 'result' && resultSection}
    </div>
  );

  const inspirationView = (
    <div css={singleColumnStyles}>
      <GcDashCard>
        <GcDashCardBody css={css`gap: 20px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 4px;`}>
            <GcDashCardTitle>Analyze a clip</GcDashCardTitle>
            <GcDashCardSubtitle>
              Drop a YouTube, TikTok, or Instagram video link. We’ll fetch the transcript and surface ready-to-use idea starters.
            </GcDashCardSubtitle>
          </div>
          <GcDashInput
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={inspirationUrl}
            onChange={(event) => setInspirationUrl(event.target.value)}
          />
          {analyzeError && (
            <span css={analyzeErrorStyles}>{analyzeError}</span>
          )}
          <div
            css={css`
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              align-items: center;
            `}
          >
            <GcDashButton variant="ghost" onClick={() => {
              setInspirationUrl('');
              setAnalyzeError(null);
              setAnalyzeIdeaError(null);
              setAnalyzeResult(null);
              setAnalyzeIdeas([]);
              setAnalyzeMeta(null);
              setAnalyzeRawIdeasJson('');
              setAnalyzeStage('');
              setIsAnalyzingClip(false);
              setSelectedAnalyzeIdeaIndex(null);
              setIsGeneratingIdea(false);
            }}>
              Clear
            </GcDashButton>
            <GcDashButton onClick={handleAnalyzeClip} isLoading={isAnalyzingClip}>
              Analyze clip
            </GcDashButton>
          </div>
          {(isAnalyzingClip || analyzeStage) && (
            <span css={analyzeStatusStyles}>
              {isAnalyzingClip ? (analyzeStage ? `${analyzeStage}…` : 'Analyzing video…') : analyzeStage}
            </span>
          )}
          {analyzeIdeaError && !isAnalyzingClip && (
            <span css={analyzeWarningStyles}>{analyzeIdeaError}</span>
          )}
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="What you get"
        description="Full transcript plus structured video ideas you can hand off to the writer."
      />

      {analyzeResult && (
        <GcDashCard>
          <GcDashCardBody css={css`gap: 16px;`}>
            <GcDashCardTitle>
              Transcript · {describePlatform(analyzeResult.platform)}
            </GcDashCardTitle>
            <GcDashCardSubtitle>
              We captured the complete narration so you can highlight, remix, or feed it into the notes flow.
            </GcDashCardSubtitle>
            <GcDashTextArea
              value={analyzeResult.transcript}
              onChange={() => undefined}
              readOnly
              rows={18}
              css={css`min-height: 260px;`}
            />
          </GcDashCardBody>
        </GcDashCard>
      )}

      {analyzeIdeas.length > 0 && (
        <GcDashCard>
          <GcDashCardBody css={css`gap: 20px;`}>
            <div css={css`display: flex; flex-direction: column; gap: 4px;`}>
              <GcDashCardTitle>Video ideas ({analyzeIdeas.length})</GcDashCardTitle>
              {analyzeMeta && (
                <GcDashCardSubtitle>
                  Generated with {analyzeMeta.model ?? 'Gemini'} · {analyzeMeta.maxIdeas ? `${analyzeMeta.maxIdeas} max ideas` : 'adaptive count'}
                </GcDashCardSubtitle>
              )}
            </div>
            <div css={ideaGridStyles}>
              {analyzeIdeas.map((idea, index) => (
                <GcDashCard
                  key={`${idea.coreClaim}-${index}`}
                  interactive
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedAnalyzeIdeaIndex(index);
                    setAnalyzeIdeaError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedAnalyzeIdeaIndex(index);
                      setAnalyzeIdeaError(null);
                    }
                  }}
                  css={css`
                    border-color: ${selectedAnalyzeIdeaIndex === index
                      ? 'var(--color-primary-500, #0b5cff)'
                      : 'rgba(9, 30, 66, 0.16)'};
                    background: ${selectedAnalyzeIdeaIndex === index
                      ? 'rgba(11, 92, 255, 0.08)'
                      : 'rgba(9, 30, 66, 0.02)'};
                    cursor: pointer;
                  `}
                >
                  <GcDashCardBody css={css`gap: 10px;`}>
                    <strong>Core claim</strong>
                    <span>{idea.coreClaim}</span>
                    <strong>Payoff</strong>
                    <span>{idea.payoff}</span>
                    {idea.proof?.text && (
                      <div>
                        <strong>Proof</strong>
                        <p css={css`margin: 0;`}>{idea.proof.text}</p>
                        {idea.proof.numbers && <small>Numbers: {idea.proof.numbers}</small>}
                      </div>
                    )}
                    {Array.isArray(idea.mechanismOrSteps) && idea.mechanismOrSteps.length > 0 && (
                      <div>
                        <strong>Steps</strong>
                        <ol css={css`margin: 0 0 0 16px; display: grid; gap: 4px;`}>
                          {idea.mechanismOrSteps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div>
                      <strong>CTA</strong>
                      <p css={css`margin: 0;`}>{idea.cta?.prompt}</p>
                    </div>
                    {idea.provenance && (
                      <small>
                        Provenance: {idea.provenance.startSec ?? 0}s → {idea.provenance.endSec ?? 0}s
                      </small>
                    )}
                    {idea.scores && (
                      <small>
                        Scores · Hook {formatScore(idea.scores.hookPotential)} · Specificity {formatScore(idea.scores.specificity)} · Actionability {formatScore(idea.scores.actionability)} · Novelty {formatScore(idea.scores.novelty)} · Overall {formatScore(idea.scores.overall)}
                      </small>
                    )}
                  </GcDashCardBody>
                </GcDashCard>
              ))}
            </div>
          </GcDashCardBody>
        </GcDashCard>
      )}

      {analyzeIdeas.length > 0 && (
        <GcDashCard>
          <GcDashCardBody css={css`gap: 16px;`}>
            <div
              css={css`
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
              `}
            >
              <label css={css`display: grid; gap: 6px; min-width: 220px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
                Brand voice
                <GcDashDropdown
                  label="Brand voice"
                  options={brandVoiceOptions}
                  selectedValue={voice}
                  onSelect={(value) => setVoice(value)}
                />
              </label>
              <label css={css`display: grid; gap: 6px; min-width: 220px; font-size: 13px; color: rgba(9, 30, 66, 0.75);`}>
                Target length
                <GcDashDropdown
                  label="Video length"
                  options={lengthOptions}
                  selectedValue={length}
                  onSelect={(value) => setLength(value)}
                />
              </label>
            </div>
            {analyzeIdeaError && (
              <span css={analyzeErrorStyles}>{analyzeIdeaError}</span>
            )}
            <GcDashButton
              onClick={handleGenerateIdeaScript}
              isLoading={isGeneratingIdea}
              disabled={selectedAnalyzeIdeaIndex == null || isGeneratingIdea}
            >
              Generate script
            </GcDashButton>
          </GcDashCardBody>
        </GcDashCard>
      )}
    </div>
  );

  const renderEntryModeContent = () => {
    switch (entryMode) {
      case 'notes':
        return notesView;
      case 'inspiration':
        return inspirationView;
      case 'suggestions':
        return suggestionsView;
      default:
        return null;
    }
  };

  return (
    <div css={containerStyles}>
      <div css={shellStyles}>
        <header
          css={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          `}
        >
          <div css={css`display: inline-flex; align-items: center; gap: 12px;`}>
            <GcDashPlanChip
              planName="Writing workspace"
              info={entryMode === 'suggestions' ? (phase === 'result' ? 'Draft ready' : 'Script builder') : 'Quick start'}
              highlighted
            />
            <GcDashNavButtons
              disablePrevious
              onNext={() => {
                if (onNavigateNext) {
                  onNavigateNext();
                } else {
                  alert('Smooth transition to Viral Video Library view.');
                }
              }}
            />
          </div>
          <GcDashSearchBar
            placeholder="Search ideas, drafts, @mentions"
            submitLabel="Search"
            onSubmitSearch={() => undefined}
            css={css`
              flex: 1;
              max-width: 640px;
              margin-left: auto;
            `}
          />
        </header>

        <main css={mainColumnStyles}>
          <section
            css={css`
              display: flex;
              flex-direction: column;
              gap: 12px;
            `}
          >
            <div
              css={css`
                display: flex;
                flex-direction: column;
                gap: 4px;
              `}
            >
              <h1
                css={css`
                  margin: 0;
                  font-size: 26px;
                  letter-spacing: -0.4px;
                `}
              >
                What would you like to do?
              </h1>
              <span css={css`font-size: 14px; color: rgba(9, 30, 66, 0.7);`}>
                Pick a starting point for today’s session. You can switch flows any time.
              </span>
            </div>

            <div css={entryGridStyles}>
              {entryOptions.map((option) => {
                const isActive = entryMode === option.id;
                return (
                  <GcDashCard
                    key={option.id}
                    interactive
                    role="button"
                    tabIndex={0}
                    onClick={() => setEntryMode(option.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setEntryMode(option.id);
                      }
                    }}
                    css={css`
                      border-color: ${isActive ? 'var(--color-primary-500)' : 'rgba(9, 30, 66, 0.12)'};
                      background: ${isActive ? 'rgba(11, 92, 255, 0.08)' : 'rgba(9, 30, 66, 0.02)'};
                      transform: ${isActive ? 'translateY(-2px)' : 'none'};
                    `}
                  >
                    <GcDashCardBody>
                      <GcDashCardTitle>{option.title}</GcDashCardTitle>
                      <GcDashCardSubtitle>{option.description}</GcDashCardSubtitle>
                      {option.meta && (
                        <span css={css`font-size: 12px; color: rgba(9, 30, 66, 0.6);`}>
                          {option.meta}
                        </span>
                      )}
                    </GcDashCardBody>
                  </GcDashCard>
                );
              })}
            </div>
          </section>

          {entryMode
            ? renderEntryModeContent()
            : (
              <GcDashBlankSlate
                description="Start by clicking a starting point for today’s session."
              />
            )}
        </main>
      </div>
    </div>
  );
};

export default WritingRedesignShowcase;
