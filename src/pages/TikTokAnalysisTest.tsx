import React, { useState } from 'react';
import { css } from '@emotion/react';

// Atlassian Design System Icons
import PersonIcon from '@atlaskit/icon/glyph/person';
import VideoIcon from '@atlaskit/icon/glyph/video-filled';
import SearchIcon from '@atlaskit/icon/glyph/search';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line';
import DocumentIcon from '@atlaskit/icon/glyph/document';

import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const pageStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  p {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const formStyles = css`
  margin-bottom: var(--space-6);

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 250px;

    .handle-icon {
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  }
`;

const stepsContainerStyles = css`
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const stepCardStyles = css`
  .step-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: var(--border-default);

    h3 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .step-status {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);

      &.pending {
        color: var(--color-text-secondary);
      }

      &.running {
        color: var(--color-information-500);
      }

      &.success {
        color: var(--color-success-500);
      }

      &.error {
        color: var(--color-danger-500);
      }
    }
  }

  .step-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-body-small);
    margin-bottom: var(--space-3);
  }

  .step-content {
    background: var(--color-surface);
    border: var(--border-default);
    border-radius: var(--radius-large);
    padding: var(--space-3);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-body-small);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-primary);
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .step-action {
    margin-top: var(--space-3);
  }
`;

const errorStyles = css`
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-large);
  padding: var(--space-4);
  color: var(--color-danger-500);
  font-size: var(--font-size-body);
  margin-bottom: var(--space-6);
`;

interface StepStatus {
  status: 'pending' | 'running' | 'success' | 'error';
  data?: any;
  error?: string;
}

// Inline Template Tester component
const TemplateTester: React.FC<{ templates: any }> = ({ templates }) => {
  const [type, setType] = React.useState<'hooks' | 'bridges' | 'ctas' | 'nuggets'>('hooks');
  const list: Array<any> = templates?.[type] || [];
  const [index, setIndex] = React.useState(0);

  const pattern: string = list[index]?.pattern || '';
  const placeholderVars: string[] = (list[index]?.variables && Array.isArray(list[index].variables))
    ? list[index].variables
    : Array.from(pattern.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);

  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Reset when selection changes
    setValues({});
  }, [type, index]);

  const render = () => {
    let out = pattern || '';
    for (const v of placeholderVars) {
      const re = new RegExp(`\\[${v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]`, 'g');
      out = out.replace(re, values[v] ?? `[${v}]`);
    }
    return out;
  };

  if (!list.length) return <div style={{ marginTop: 12 }}>No templates available for testing.</div>;

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Test Template</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={type} onChange={(e) => { setType(e.target.value as any); setIndex(0); }}>
          <option value="hooks">Hook</option>
          <option value="bridges">Bridge</option>
          <option value="ctas">CTA</option>
          <option value="nuggets">Golden Nugget</option>
        </select>

        <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {list.map((_: any, i: number) => (
            <option key={i} value={i}>#{i + 1}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ marginBottom: 4, color: 'var(--color-text-secondary)' }}>Pattern</div>
        <div style={{ fontFamily: 'var(--font-family-monospace)' }}>{pattern || '—'}</div>
      </div>

      {placeholderVars.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginBottom: 8 }}>
          {placeholderVars.map((v) => (
            <input
              key={v}
              placeholder={v}
              value={values[v] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontFamily: 'var(--font-family-monospace)'
              }}
            />
          ))}
        </div>
      )}

      <div>
        <div style={{ marginBottom: 4, color: 'var(--color-text-secondary)' }}>Rendered</div>
        <div style={{
          padding: 12,
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 8,
          background: 'var(--color-surface)'
        }}>{render()}</div>
      </div>
    </div>
  );
};

export const TikTokAnalysisTest: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Return concise JSON with keys tone, style, hooks, transitions based on the transcripts. Keep it brief.'
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are an expert short-form video script analyst. Focus on hooks, bridges, golden nuggets, transitions, CTAs, and tone/style fingerprints. Be precise. When asked for JSON, return valid, minimal JSON only.'
  );
  // Advanced controls for Step 3
  const [advOpen, setAdvOpen] = useState<boolean>(false);
  const [analysisModel, setAnalysisModel] = useState<string>('gemini-1.5-flash');
  const [analysisMaxTokens, setAnalysisMaxTokens] = useState<number>(6000);
  const [analysisTemperature, setAnalysisTemperature] = useState<number>(0.2);

  // Step states
  const [step1, setStep1] = useState<StepStatus>({ status: 'pending' });
  const [step2, setStep2] = useState<StepStatus>({ status: 'pending' });
  const [step3, setStep3] = useState<StepStatus>({ status: 'pending' });
  const [step4, setStep4] = useState<StepStatus>({ status: 'pending' });
  const [step5, setStep5] = useState<StepStatus>({ status: 'pending' });
  const [stepRunPrompt, setStepRunPrompt] = useState<StepStatus>({ status: 'pending' });
  const [stepSave, setStepSave] = useState<StepStatus>({ status: 'pending' });

  const resetSteps = () => {
    setStep1({ status: 'pending' });
    setStep2({ status: 'pending' });
    setStep3({ status: 'pending' });
    setStep4({ status: 'pending' });
    setStep5({ status: 'pending' });
  };

  const handleStep1 = async () => {
    if (!username.trim()) return;

    setStep1({ status: 'running' });

    try {
      console.log('🚀 Step 1: Fetching TikTok user videos for:', username.trim());

      const response = await fetch('/api/tiktok/user-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), count: 10 })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch videos');
      }

      setStep1({ status: 'success', data: result });
      console.log('✅ Step 1 completed:', result.videos?.length, 'videos found');

    } catch (error: any) {
      console.error('❌ Step 1 failed:', error);
      setStep1({ status: 'error', error: error.message });
    }
  };

  const handleStep2 = async () => {
    if (step1.status !== 'success' || !step1.data?.videos) {
      alert('Step 1 must be completed first');
      return;
    }

    setStep2({ status: 'running' });

    try {
      console.log('🚀 Step 2: Transcribing videos...');
      const videos = step1.data.videos.slice(0, 5); // Limit to 5 videos for testing
      const transcripts: string[] = [];
      const videoMeta: Array<{ id: string; url?: string; title?: string }> = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        console.log(`🎬 Transcribing video ${i + 1}/${videos.length}: ${video.id}`);

        const response = await fetch('/api/video/transcribe-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: video.downloadUrl })
        });

        const result = await response.json();

        if (response.ok && result.success && result.transcript) {
          transcripts.push(result.transcript);
          videoMeta.push({ id: String(video.id), url: video.downloadUrl, title: video.title });
          console.log(`✅ Video ${i + 1} transcribed successfully`);
        } else {
          console.warn(`⚠️ Video ${i + 1} transcription failed:`, result.error);
        }
      }

      if (transcripts.length === 0) {
        throw new Error('No videos could be transcribed successfully');
      }

      setStep2({ status: 'success', data: { transcripts, videoMeta } });
      console.log('✅ Step 2 completed:', transcripts.length, 'transcripts created');

    } catch (error: any) {
      console.error('❌ Step 2 failed:', error);
      setStep2({ status: 'error', error: error.message });
    }
  };

  const handleStep3 = async () => {
    if (step2.status !== 'success' || !step2.data?.transcripts) {
      alert('Step 2 must be completed first');
      return;
    }

    setStep3({ status: 'running' });

    try {
      console.log('🚀 Step 3: Analyzing voice patterns...');
      // Build the specific analysis prompt with transcripts in-place
      const t: string[] = step2.data.transcripts.slice(0, 5);
      const analysisInstruction = `Analyze these 5 video transcripts and create reusable templates. For each transcript:

1. EXTRACT THE SECTIONS:
- Hook (first 3-5 seconds that grabs attention)
- Bridge (transition that sets up the main content)
- Golden Nugget (the main value/lesson/information)
- CTA (call to action at the end)

2. CREATE TEMPLATES from the hooks by replacing specific details with [VARIABLES]:
Example: "I made $5000 in 2 days" → "I [achievement] in [timeframe]"

3. DOCUMENT THE CREATOR'S STYLE:
- Common words/phrases they repeat
- Sentence length (short/long/mixed)
- Transition words between sections
- Speaking pace indicators (pauses, emphasis)

[INSERT TRANSCRIPT 1]
[INSERT TRANSCRIPT 2]
[INSERT TRANSCRIPT 3]
[INSERT TRANSCRIPT 4]
[INSERT TRANSCRIPT 5]

OUTPUT FORMAT:

## HOOK TEMPLATES
1. [Template with variables]
2. [Template with variables]
3. [Template with variables]

## BRIDGE TEMPLATES
1. [Template with variables]
2. [Template with variables]

## GOLDEN NUGGET STRUCTURE
- How they present main points
- Common frameworks used

## CTA TEMPLATES
1. [Template with variables]
2. [Template with variables]

## STYLE SIGNATURE
- Power words: [list]
- Filler phrases: [list]
- Transition phrases: [list]
- Average words per sentence: [number]
- Tone: [description]
Simple Storage Structure
Create a spreadsheet or JSON file with these columns:
Templates Sheet
Template TypePatternVariablesExampleSuccess ScoreHook"Did you know that [fact] can [benefit]?"fact, benefit"Did you know that waking up at 5am can double your productivity?"8/10Bridge"Let me show you [method]"method"Let me show you the exact steps"7/10Golden Nugget"First, [step1]. Then, [step2]. Finally, [step3]"step1, step2, step3"First, identify the problem. Then, research solutions. Finally, test the best option"9/10CTA"Comment [action] if you [condition]"action, condition"Comment YES if you want more tips"6/10`;

      const transcriptsBlock = [
        `\n[INSERT TRANSCRIPT 1]\n${t[0] ?? ''}`,
        `\n[INSERT TRANSCRIPT 2]\n${t[1] ?? ''}`,
        `\n[INSERT TRANSCRIPT 3]\n${t[2] ?? ''}`,
        `\n[INSERT TRANSCRIPT 4]\n${t[3] ?? ''}`,
        `\n[INSERT TRANSCRIPT 5]\n${t[4] ?? ''}`,
      ].join('\n');

      // Enforce JSON output with an explicit schema and no extra text
      const jsonHeader = `Return ONLY valid JSON with this schema and no markdown/code fences.\n\n{
  "templates": {
    "hooks": [{ "pattern": "string", "variables": ["string"] }],
    "bridges": [{ "pattern": "string", "variables": ["string"] }],
    "ctas": [{ "pattern": "string", "variables": ["string"] }],
    "nuggets": [{ "pattern": "string", "structure": "string", "variables": ["string"] }]
  },
  "styleSignature": {
    "powerWords": ["string"],
    "fillerPhrases": ["string"],
    "transitionPhrases": ["string"],
    "avgWordsPerSentence": 0,
    "tone": "string"
  },
  "transcripts": [{
    "index": 1,
    "hook": {"text": "string", "duration": 0, "type": "string", "emotionalTrigger": "string", "template": "string", "variables": {}},
    "bridge": {"text": "string", "transitionType": "string", "duration": 0, "template": "string", "variables": {}},
    "goldenNugget": {"text": "string", "valueType": "string", "deliveryMethod": "string", "duration": 0, "structure": "string", "keyPoints": ["string"], "template": "string", "variables": {}},
    "cta": {"text": "string", "type": "string", "placement": "string", "urgency": "string", "template": "string", "variables": {}},
    "microHooks": [{"text": "string", "position": 0, "purpose": "string", "template": "string", "variables": {}}]
  }]
}`;

      const composedPrompt = `${jsonHeader}\n\n${analysisInstruction}\n${transcriptsBlock}`;

      const response = await fetch('/api/voice/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // We embed transcripts in the composed prompt to match the requested format
          prompt: composedPrompt,
          responseType: 'json',
          temperature: analysisTemperature,
          maxTokens: analysisMaxTokens,
          model: analysisModel,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      // Parse JSON content
      let parsed: any = null;
      try {
        parsed = result?.content ? JSON.parse(result.content) : null;
      } catch (e) {
        console.warn('Failed to parse JSON content; returning raw text');
      }

      setStep3({ status: 'success', data: { raw: result?.content, json: parsed } });
      console.log('✅ Step 3 completed: Voice patterns analyzed');

    } catch (error: any) {
      console.error('❌ Step 3 failed:', error);
      setStep3({ status: 'error', error: error.message });
    }
  };

  // New: Run Prompt directly using current systemPrompt + customPrompt (+ transcripts if available)
  const handleRunPrompt = async () => {
    if (!customPrompt.trim() && !systemPrompt.trim()) {
      alert('Provide a system prompt and/or a prompt first');
      return;
    }

    setStepRunPrompt({ status: 'running' });

    try {
      console.log('🚀 Run Prompt: Executing current prompts...');

      const response = await fetch('/api/voice/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt?.trim() ? customPrompt : undefined,
          systemPrompt: systemPrompt?.trim() ? systemPrompt : undefined,
          // If transcripts exist from Step 2, include them; otherwise the prompt can still run
          transcripts: step2.status === 'success' ? step2.data?.transcripts : undefined,
          temperature: 0.2,
          maxTokens: 2048,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStepRunPrompt({ status: 'success', data: result });
      console.log('✅ Run Prompt completed');

    } catch (error: any) {
      console.error('❌ Run Prompt failed:', error);
      setStepRunPrompt({ status: 'error', error: error.message });
    }
  };

  // Step: Save templates & voice to database
  const handleSaveToDatabase = async () => {
    if (step3.status !== 'success' || !step3.data) {
      alert('Please run Step 3 analysis first');
      return;
    }
    const analysisJson = step3.data.json;
    const analysisText = step3.data.raw || JSON.stringify(step3.data.json || {});
    if (!analysisJson && !analysisText) {
      alert('No analysis result to save');
      return;
    }

    setStepSave({ status: 'running' });
    try {
      const payload = {
        creator: { name: username.replace(/^@/, ''), handle: username },
        analysisJson,
        analysisText,
        transcriptsCount: step2.status === 'success' ? (step2.data?.transcripts?.length || 0) : 0,
        videoMeta: step2.status === 'success' ? (step2.data?.videoMeta || []) : [],
      };

      const response = await fetch('/api/creator/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let result: any = null;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error('Server returned an invalid response');
      }
      if (!response.ok || !result?.success) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStepSave({ status: 'success', data: result });
      console.log('✅ Save completed:', result);
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      setStepSave({ status: 'error', error: error.message });
    }
  };

  const handleStep4 = async () => {
    if (step3.status !== 'success' || !step3.data) {
      alert('Step 3 must be completed first');
      return;
    }

    setStep4({ status: 'running' });

    try {
      console.log('🚀 Step 4: Generating persona metadata...');

      const response = await fetch('/api/personas/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceAnalysis: step3.data })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStep4({ status: 'success', data: result });
      console.log('✅ Step 4 completed: Persona metadata generated');

    } catch (error: any) {
      console.error('❌ Step 4 failed:', error);
      setStep4({ status: 'error', error: error.message });
    }
  };

  const handleStep5 = async () => {
    if (step4.status !== 'success' || !step4.data) {
      alert('Step 4 must be completed first');
      return;
    }

    setStep5({ status: 'running' });

    try {
      console.log('🚀 Step 5: Creating final persona...');

      // Get auth token (assuming it exists in localStorage like other pages)
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/personas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: step4.data.title || `${username} Persona`,
          description: step4.data.description,
          platform: 'tiktok',
          username: username,
          analysis: step3.data,
          tags: step4.data.suggestedTags || [],
          creationStatus: 'created'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStep5({ status: 'success', data: result });
      console.log('✅ Step 5 completed: Persona created with ID:', result.personaId);

    } catch (error: any) {
      console.error('❌ Step 5 failed:', error);
      setStep5({ status: 'error', error: error.message });
    }
  };

  const getStatusIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'running':
        return <RefreshIcon label="Running" />;
      case 'success':
        return <CheckCircleIcon label="Success" />;
      case 'error':
        return <ErrorIcon label="Error" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: StepStatus['status']) => {
    switch (status) {
      case 'running':
        return 'Running...';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  const formatStepData = (data: any) => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div css={pageStyles}>
      <header css={headerStyles}>
        <h1>
          <SearchIcon label="TikTok Analysis" />
          TikTok Analysis Test
        </h1>
        <p>Step-by-step TikTok username analysis: Fetch videos → Transcribe → Analyze → Generate persona</p>
        <p style={{ marginTop: '8px' }}>
          <a href="#voice-analysis">Jump to Voice Analysis</a>
        </p>
      </header>

      <Card>
        <form css={formStyles} onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <div className="form-actions">
              <div className="input-container">
                <PersonIcon className="handle-icon" label="Username" />
                <Input
                  type="text"
                  placeholder="Enter TikTok username (e.g., @username)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isRunning}
                  required
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!username.trim() || isRunning}
                onClick={resetSteps}
              >
                Reset
              </Button>
            </div>
          </div>
        </form>

        <div css={stepsContainerStyles}>
          {/* Step 1: Fetch Videos */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <VideoIcon label="Videos" />
                Step 1: Fetch Videos
              </h3>
              <div className={`step-status ${step1.status}`}>
                {getStatusIcon(step1.status)}
                {getStatusText(step1.status)}
              </div>
            </div>
            <div className="step-description">
              Fetch user videos from TikTok using the username
            </div>
            {step1.data && (
              <div className="step-content">
                Found {step1.data.videos?.length || 0} videos for @{username}
                {step1.data.userInfo && (
                  <div>
                    User: {step1.data.userInfo.nickname} ({step1.data.userInfo.username})
                    Followers: {step1.data.userInfo.stats?.followerCount || 0}
                  </div>
                )}
              </div>
            )}
            {step1.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step1.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={!username.trim() || step1.status === 'running'}
                onClick={handleStep1}
                iconBefore={<SearchIcon label="" />}
              >
                {step1.status === 'running' ? 'Fetching...' : 'Fetch Videos'}
              </Button>
            </div>
          </Card>

          {/* Step 2: Transcribe Videos */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Transcripts" />
                Step 2: Transcribe Videos
              </h3>
              <div className={`step-status ${step2.status}`}>
                {getStatusIcon(step2.status)}
                {getStatusText(step2.status)}
              </div>
            </div>
            <div className="step-description">
              Transcribe individual videos to extract speech content
            </div>
            {step2.data && (
              <div className="step-content">
                Transcribed {step2.data.transcripts?.length || 0} videos
                {step2.data.transcripts?.map((transcript: string, i: number) => (
                  <div key={i} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <strong>Video {i + 1}:</strong> {transcript.substring(0, 100)}...
                  </div>
                ))}
              </div>
            )}
            {step2.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step2.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step1.status !== 'success' || step2.status === 'running'}
                onClick={handleStep2}
                iconBefore={<DownloadIcon label="" />}
              >
                {step2.status === 'running' ? 'Transcribing...' : 'Transcribe Videos'}
              </Button>
            </div>
          </Card>

          {/* Step 3: Analyze Voice Patterns */}
          <Card css={stepCardStyles} id="voice-analysis">
            <div className="step-header">
              <h3>
                <GraphLineIcon label="Analysis" />
                Step 3: Analyze Voice
              </h3>
              <div className={`step-status ${step3.status}`}>
                {getStatusIcon(step3.status)}
                {getStatusText(step3.status)}
              </div>
            </div>
            <div className="step-description">
              Analyze transcripts using the predefined analysis prompt. No prompt editing here.
            </div>
            {/* Advanced controls */}
            <div style={{ marginBottom: '12px' }}>
              <button type="button" onClick={() => setAdvOpen(v => !v)} style={{ marginBottom: 8 }}>
                {advOpen ? 'Hide Advanced' : 'Show Advanced'}
              </button>
              {advOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Model</label>
                    <select value={analysisModel} onChange={(e) => setAnalysisModel(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Max tokens</label>
                    <input type="number" min={1000} max={32000} step={100}
                      value={analysisMaxTokens}
                      onChange={(e) => setAnalysisMaxTokens(Number(e.target.value) || 6000)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Temperature</label>
                    <input type="number" min={0} max={1} step={0.1}
                      value={analysisTemperature}
                      onChange={(e) => setAnalysisTemperature(Math.min(1, Math.max(0, Number(e.target.value))))}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    />
                  </div>
                </div>
              )}
            </div>
            {step3.data && (
              <div className="step-content">
                {/* JSON-first output with copy helpers */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(step3.data.json ?? step3.data.raw ?? {}, null, 2))}>Copy JSON</button>
                  <button onClick={() => step3.data.raw && navigator.clipboard.writeText(step3.data.raw)}>Copy Raw</button>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {step3.data.json ? JSON.stringify(step3.data.json, null, 2) : (step3.data.raw || '')}
                </div>

                {/* Template tester */}
                {step3.data.json?.templates && (
                  <TemplateTester templates={step3.data.json.templates} />
                )}
              </div>
            )}
            {step3.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step3.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step2.status !== 'success' || step3.status === 'running'}
                onClick={handleStep3}
                iconBefore={<GraphLineIcon label="" />}
              >
                {step3.status === 'running' ? 'Analyzing...' : 'Analyze Voice'}
              </Button>
            </div>
          </Card>

          {/* Step 4: Run Prompt (re-run current prompt/system with transcripts) */}
          <Card css={stepCardStyles} id="run-prompt">
            <div className="step-header">
              <h3>
                <GraphLineIcon label="Run Prompt" />
                Step 4: Run Prompt
              </h3>
              <div className={`step-status ${stepRunPrompt.status}`}>
                {getStatusIcon(stepRunPrompt.status)}
                {getStatusText(stepRunPrompt.status)}
              </div>
            </div>
            <div className="step-description">
              Execute the current System Prompt + Prompt. Includes transcripts from Step 2 if available.
            </div>
            {stepRunPrompt.data && (
              <div className="step-content">
                {stepRunPrompt.data.systemPrompt && (
                  <>
                    <div><strong>System Prompt:</strong></div>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{stepRunPrompt.data.systemPrompt}</div>
                  </>
                )}
                <div><strong>Final Prompt:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{stepRunPrompt.data.prompt}</div>
                <div><strong>Model Response:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{stepRunPrompt.data.content || JSON.stringify(stepRunPrompt.data, null, 2)}</div>
              </div>
            )}
            {stepRunPrompt.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {stepRunPrompt.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={stepRunPrompt.status === 'running'}
                onClick={handleRunPrompt}
                iconBefore={<GraphLineIcon label="" />}
              >
                {stepRunPrompt.status === 'running' ? 'Running...' : 'Run Prompt'}
              </Button>
            </div>
          </Card>

          {/* Step 5: Save Templates & Voice */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Save" />
                Step 5: Save Templates & Voice
              </h3>
              <div className={`step-status ${stepSave.status}`}>
                {getStatusIcon(stepSave.status)}
                {getStatusText(stepSave.status)}
              </div>
            </div>
            <div className="step-description">
              Save extracted templates and speaking style to your database for this creator.
            </div>
            {stepSave.data && (
              <div className="step-content">
                ✅ Saved for @{stepSave.data.creator?.handle} (ID: {stepSave.data.creator?.id})
                <div style={{ marginTop: 8 }}>
                  Hooks: {stepSave.data.saved?.hooks || 0}, Bridges: {stepSave.data.saved?.bridges || 0}, CTAs: {stepSave.data.saved?.ctas || 0}, Nuggets: {stepSave.data.saved?.nuggets || 0}
                </div>
                <div style={{ marginTop: 12 }}>
                  <a href="/write" target="_self">Go to Write → Brand Voice</a>
                </div>
              </div>
            )}
            {stepSave.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {stepSave.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step3.status !== 'success' || stepSave.status === 'running'}
                onClick={handleSaveToDatabase}
                iconBefore={<DocumentIcon label="" />}
              >
                {stepSave.status === 'running' ? 'Saving...' : 'Save to Database'}
              </Button>
            </div>
          </Card>

          {/* Step 6: Generate Metadata (placeholder) */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Metadata" />
                Step 6: Generate Metadata
              </h3>
              <div className={`step-status ${step4.status}`}>
                {getStatusIcon(step4.status)}
                {getStatusText(step4.status)}
              </div>
            </div>
            <div className="step-description">
              Generate persona title and description from voice analysis
            </div>
            {step4.data && (
              <div className="step-content">
                Title: {step4.data.title}
                {step4.data.description && (
                  <div style={{ marginTop: '12px' }}>
                    Description: {step4.data.description.substring(0, 200)}...
                  </div>
                )}
                {step4.data.suggestedTags && (
                  <div style={{ marginTop: '12px' }}>
                    Tags: {step4.data.suggestedTags.join(', ')}
                  </div>
                )}
              </div>
            )}
            {step4.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step4.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step3.status !== 'success' || step4.status === 'running'}
                onClick={handleStep4}
                iconBefore={<DocumentIcon label="" />}
              >
                {step4.status === 'running' ? 'Generating...' : 'Generate Metadata'}
              </Button>
            </div>
          </Card>

          {/* Step 7: Create Persona */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <PersonIcon label="Persona" />
                Step 7: Create Persona
              </h3>
              <div className={`step-status ${step5.status}`}>
                {getStatusIcon(step5.status)}
                {getStatusText(step5.status)}
              </div>
            </div>
            <div className="step-description">
              Create the final persona in the database
            </div>
            {step5.data && (
              <div className="step-content">
                ✅ Persona created successfully!
                Persona ID: {step5.data.personaId}
                Name: {step5.data.persona?.name}
                Status: {step5.data.persona?.status}
              </div>
            )}
            {step5.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step5.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step4.status !== 'success' || step5.status === 'running'}
                onClick={handleStep5}
                iconBefore={<PersonIcon label="" />}
              >
                {step5.status === 'running' ? 'Creating...' : 'Create Persona'}
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
