import React, { useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { Button } from '../components/ui/Button';

interface TranscriptChunk {
  text: string;
  start?: number;
  end?: number;
}

interface TranscriptResponse {
  url: string;
  language: string;
  text: string;
  availableLanguages?: string[];
  chunks: TranscriptChunk[];
}

interface IdeaProof {
  type: 'stat' | 'example' | 'quote' | 'demo';
  text: string;
  numbers?: string;
}

interface IdeaCta {
  type: 'comment' | 'watch_full' | 'subscribe' | 'download' | 'signup' | 'follow' | 'buy';
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
  angle: 'question' | 'contrarian' | 'stat_shock' | 'mistake' | 'myth' | 'story';
  painPoint?: string;
  reasonToBelieve?: string;
  context?: string;
  promise?: string;
  cta: IdeaCta;
  entities?: string[];
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  provenance: { startSec: number; endSec: number };
  scores: IdeaScores;
}

interface GenerationMeta {
  model: string;
  durationMs: number;
  maxIdeas: number;
  minOverall: number;
  audienceLevel: string;
  transcriptChars: number;
}

interface ValidationIssue {
  message: string;
  path: string;
}

const pageStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-7);
  color: var(--color-neutral-800);
`;

const sectionStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const cardStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
`;

const actionsRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
`;

const statusStyles = (tone: 'info' | 'error' | 'success') => css`
  border-radius: var(--radius-medium);
  padding: var(--space-3) var(--space-4);
  background: ${tone === 'error'
    ? 'var(--color-error-50)'
    : tone === 'success'
      ? 'var(--color-success-50)'
      : 'var(--color-neutral-100)'};
  color: ${tone === 'error'
    ? 'var(--color-error-600)'
    : tone === 'success'
      ? 'var(--color-success-600)'
      : 'var(--color-neutral-700)'};
  font-size: var(--font-size-body-small);
`;

const gridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
`;

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return id;
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.includes('shorts')) {
        const index = segments.indexOf('shorts');
        return segments[index + 1] || null;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function validateIdeasClient(ideas: IdeaSeed[]): ValidationIssue[] {
  if (!Array.isArray(ideas)) {
    return [{ message: 'Expected an array of ideas', path: 'ideas' }];
  }
  const issues: ValidationIssue[] = [];
  ideas.forEach((idea, index) => {
    const base = `ideas[${index}]`;
    if (!idea || typeof idea !== 'object') {
      issues.push({ path: base, message: 'Idea must be an object' });
      return;
    }
    if (!idea.coreClaim?.trim()) {
      issues.push({ path: `${base}.coreClaim`, message: 'Missing coreClaim' });
    }
    if (!idea.payoff?.trim()) {
      issues.push({ path: `${base}.payoff`, message: 'Missing payoff' });
    }
    if (!idea.proof || !idea.proof.text?.trim()) {
      issues.push({ path: `${base}.proof.text`, message: 'Proof text is required' });
    }
    if (!idea.cta || !idea.cta.prompt?.trim()) {
      issues.push({ path: `${base}.cta.prompt`, message: 'CTA prompt is required' });
    }
    if (!idea.provenance || !Number.isFinite(idea.provenance.startSec) || !Number.isFinite(idea.provenance.endSec)) {
      issues.push({ path: `${base}.provenance`, message: 'Provenance start/end seconds required' });
    }
  });
  return issues;
}

export const YouTubeIdeaSeeds: React.FC = () => {
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=qVufzX_8bqE');
  const [lang, setLang] = useState('en');
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [maxIdeas, setMaxIdeas] = useState(8);
  const [minOverall, setMinOverall] = useState(75);
  const [audienceLevel, setAudienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [ideas, setIdeas] = useState<IdeaSeed[]>([]);
  const [meta, setMeta] = useState<GenerationMeta | null>(null);
  const [rawJson, setRawJson] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const derivedVideoId = useMemo(() => {
    return transcript?.url ? extractYouTubeId(transcript.url) : extractYouTubeId(url);
  }, [transcript, url]);

  const ideaValidation = useMemo(() => {
    if (!ideas.length) return null;
    const issues = validateIdeasClient(ideas);
    return {
      valid: issues.length === 0,
      issues,
    };
  }, [ideas]);

  async function handleFetchTranscript() {
    if (!url.trim()) {
      setFetchError('Enter a YouTube URL first.');
      return;
    }

    setFetchingTranscript(true);
    setFetchError(null);
    setTranscript(null);
    setIdeas([]);
    setMeta(null);
    setRawJson('');

    try {
      const params = new URLSearchParams({ url: url.trim(), lang: lang.trim() || 'en' });
      const response = await fetch(`/api/video/youtube-transcript?${params.toString()}`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to fetch transcript (status ${response.status})`);
      }
      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Transcript API returned an error');
      }
      setTranscript(data.transcript);
    } catch (error) {
      console.error('[YouTubeIdeaSeeds] Transcript error:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch transcript');
    } finally {
      setFetchingTranscript(false);
    }
  }

  async function handleGenerateIdeas() {
    if (!transcript) {
      setGenerationError('Fetch a transcript first.');
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setIdeas([]);
    setMeta(null);
    setRawJson('');

    try {
      const payload = {
        url: transcript.url || url,
        lang: transcript.language || lang,
        videoId: derivedVideoId || undefined,
        transcript: transcript.text,
        chunks: transcript.chunks,
        maxIdeas,
        minOverall,
        audienceLevel,
      };

      const response = await fetch('/api/scripts/youtube-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        const message = (() => {
          try {
            const parsed = JSON.parse(text);
            return parsed.error || text || 'Failed to generate idea seeds';
          } catch (error) {
            return text || 'Failed to generate idea seeds';
          }
        })();
        throw new Error(message);
      }

      try {
        const parsed = JSON.parse(text);
        if (!parsed.success) {
          throw new Error(parsed.error || 'Generation unsuccessful');
        }
        setIdeas(parsed.ideas || []);
        setMeta(parsed.meta || null);
        setRawJson(JSON.stringify(parsed.ideas, null, 2));
      } catch (parseError) {
        console.error('[YouTubeIdeaSeeds] Failed to parse generation response', parseError);
        throw new Error('Failed to parse idea seeds JSON');
      }
    } catch (error) {
      console.error('[YouTubeIdeaSeeds] Generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate idea seeds');
    } finally {
      setGenerating(false);
    }
  }

  const transcriptPreview = useMemo(() => {
    if (!transcript?.text) return '';
    return transcript.text.slice(0, 1200);
  }, [transcript]);

  return (
    <div css={pageStyles}>
      <div>
        <h1>📹 YouTube Transcript → Idea Seeds</h1>
        <p>
          Fetch a YouTube transcript via the RapidAPI-powered endpoint, then generate structured short-form video idea seeds
          using the provided Gemini prompt instructions. All outputs are validated for JSON structure before display.
        </p>
      </div>

      <Card css={cardStyles}>
        <h2>1. Transcript Source</h2>
        <div css={sectionStyles}>
          <Input
            label="YouTube URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            size="medium"
            fullWidth
          />
          <div css={actionsRowStyles}>
            <Input
              label="Transcript language"
              value={lang}
              onChange={(event) => setLang(event.target.value)}
              size="small"
              style={{ width: 160 }}
            />
            <Button
              variant="primary"
              size="medium"
              onClick={handleFetchTranscript}
              isDisabled={fetchingTranscript}
              isLoading={fetchingTranscript}
            >
              {fetchingTranscript ? 'Fetching…' : 'Fetch Transcript'}
            </Button>
          </div>
          {fetchError && <div css={statusStyles('error')}>{fetchError}</div>}
          {transcript && (
            <div css={statusStyles('info')}>
              <strong>Transcript ready:</strong> {transcript.chunks.length} chunks · {transcript.text.length.toLocaleString()} characters ·
              Video ID: {derivedVideoId ?? 'n/a'}
            </div>
          )}
        </div>
      </Card>

      <Card css={cardStyles}>
        <h2>2. Idea Seed Generation</h2>
        <div css={sectionStyles}>
          <div css={actionsRowStyles}>
            <Input
              label="Max ideas"
              type="number"
              min={1}
              max={25}
              value={maxIdeas}
              onChange={(event) => setMaxIdeas(Number(event.target.value))}
              size="small"
              style={{ width: 160 }}
            />
            <Input
              label="Min overall score"
              type="number"
              min={0}
              max={100}
              value={minOverall}
              onChange={(event) => setMinOverall(Number(event.target.value))}
              size="small"
              style={{ width: 200 }}
            />
            <label>
              Audience Level
              <select
                value={audienceLevel}
                onChange={(event) => setAudienceLevel(event.target.value as typeof audienceLevel)}
                style={{ marginLeft: 'var(--space-2)', minHeight: 40, borderRadius: 8, padding: '0 var(--space-3)' }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <Button
              variant="ai-powered"
              size="medium"
              onClick={handleGenerateIdeas}
              isDisabled={generating || !transcript}
              isLoading={generating}
            >
              {generating ? 'Generating…' : 'Generate Idea Seeds'}
            </Button>
          </div>
          {generationError && <div css={statusStyles('error')}>{generationError}</div>}
          {meta && (
            <div css={statusStyles('success')}>
              ✅ Generated {ideas.length} ideas with {meta.model} in {(meta.durationMs / 1000).toFixed(1)}s · Threshold ≥ {meta.minOverall} ·
              Max ideas requested: {meta.maxIdeas}
            </div>
          )}
        </div>
      </Card>

      {transcript && (
        <Card css={cardStyles}>
          <h2>Transcript Preview</h2>
          <TextArea
            label="Transcript snippet"
            value={transcriptPreview}
            onChange={() => {}}
            readOnly
            fullWidth
            style={{ maxHeight: 240, minHeight: 160 }}
          />
          <small>
            Showing first {transcriptPreview.length.toLocaleString()} characters. Full transcript ({transcript.text.length.toLocaleString()} chars)
            is sent to the generator with chunk-level timestamps.
          </small>
        </Card>
      )}

      {ideas.length > 0 && (
        <Card css={cardStyles}>
          <h2>Idea Seeds ({ideas.length})</h2>
          {ideaValidation && (
            <div css={statusStyles(ideaValidation.valid ? 'success' : 'error')}>
              {ideaValidation.valid ? 'JSON validation passed.' : 'Validation issues detected.'}
              {!ideaValidation.valid && (
                <ul>
                  {ideaValidation.issues.map((issue) => (
                    <li key={issue.path}>
                      <strong>{issue.path}:</strong> {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div css={gridStyles}>
            {ideas.map((idea, index) => (
              <Card key={`${idea.coreClaim}-${index}`}>
                <div css={sectionStyles}>
                  <div>
                    <strong>Core Claim:</strong>
                    <p>{idea.coreClaim}</p>
                  </div>
                  <div>
                    <strong>Payoff:</strong>
                    <p>{idea.payoff}</p>
                  </div>
                  <div>
                    <strong>Proof ({idea.proof.type}):</strong>
                    <p>{idea.proof.text}</p>
                    {idea.proof.numbers && <small>Numbers: {idea.proof.numbers}</small>}
                  </div>
                  {idea.mechanismOrSteps && idea.mechanismOrSteps.length > 0 && (
                    <div>
                      <strong>Mechanism / Steps:</strong>
                      <ol>
                        {idea.mechanismOrSteps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <div>
                    <strong>Angle:</strong> {idea.angle}
                  </div>
                  {idea.painPoint && (
                    <div>
                      <strong>Pain Point:</strong> {idea.painPoint}
                    </div>
                  )}
                  {idea.reasonToBelieve && (
                    <div>
                      <strong>Reason to Believe:</strong> {idea.reasonToBelieve}
                    </div>
                  )}
                  <div>
                    <strong>CTA:</strong> {idea.cta.type} — {idea.cta.prompt}
                    {idea.cta.target && typeof idea.cta.target === 'object' && (
                      <span> (ts: {idea.cta.target.videoTs}s)</span>
                    )}
                  </div>
                  <div>
                    <strong>Provenance:</strong> {idea.provenance.startSec}s → {idea.provenance.endSec}s
                  </div>
                  <div>
                    <strong>Scores:</strong>
                    <ul>
                      <li>Hook: {idea.scores.hookPotential.toFixed(2)}</li>
                      <li>Specificity: {idea.scores.specificity.toFixed(2)}</li>
                      <li>Actionability: {idea.scores.actionability.toFixed(2)}</li>
                      <li>Novelty: {idea.scores.novelty.toFixed(2)}</li>
                      <li>Overall: {idea.scores.overall}</li>
                    </ul>
                  </div>
                  {idea.entities && idea.entities.length > 0 && (
                    <div>
                      <strong>Entities:</strong> {idea.entities.join(', ')}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {rawJson && (
        <Card css={cardStyles}>
          <h2>Raw JSON</h2>
          <TextArea
            label="Idea seeds JSON"
            value={rawJson}
            onChange={() => {}}
            readOnly
            fullWidth
            style={{ maxHeight: 320, minHeight: 200 }}
          />
        </Card>
      )}
    </div>
  );
};

export default YouTubeIdeaSeeds;
