import React, { useEffect, useMemo, useState } from 'react';
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

const ideaCapsules = [
  {
    id: 'ai-onboarding',
    title: 'AI onboarding wins',
    summary: 'Show how Claude Workspace cut onboarding from weeks to 30 days.'
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

const brandVoiceOptions: GcDashDropdownOption[] = [
  { value: 'workspace-default', label: 'Workspace default' },
  { value: 'founder-story', label: 'Founder storytelling' },
  { value: 'educator', label: 'Educator · explain simply' },
  { value: 'creator-collab', label: 'Creator collab voice' },
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

type Phase = 'input' | 'generating' | 'result';

type EntryMode = 'notes' | 'inspiration' | 'transcribe' | 'suggestions';

const entryOptions: Array<{
  id: EntryMode;
  title: string;
  description: string;
  meta?: string;
}> = [
  {
    id: 'notes',
    title: 'Use notes',
    description: 'Share your thoughts about a topic and Claude will shape the script around them.',
    meta: '3–5 bullets recommended',
  },
  {
    id: 'inspiration',
    title: 'Get inspiration',
    description: 'Rewrite a short-form video script—drop a link to extract the key beats and craft your own take.',
    meta: 'Supports TikTok, Reels, Shorts',
  },
  {
    id: 'transcribe',
    title: 'Transcribe a video',
    description: 'Paste a video link to pull the talking points before you remix them into your voice.',
  },
  {
    id: 'suggestions',
    title: 'Suggested ideas',
    description: 'Pick from Claude-curated ideas based on your onboarding goals and generate in one click.',
  },
];

export interface WritingRedesignShowcaseProps {
  onNavigateNext?: () => void;
}

export const WritingRedesignShowcase: React.FC<WritingRedesignShowcaseProps> = ({ onNavigateNext }) => {
  const [entryMode, setEntryMode] = useState<EntryMode | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [activeTab, setActiveTab] = useState(scriptTabs[0]!.id);
  const [voice, setVoice] = useState(brandVoiceOptions[0]!.value);
  const [length, setLength] = useState(lengthOptions[1]!.value);
  const [selectedIdea, setSelectedIdea] = useState(ideaCapsules[0]!);
  const [progress, setProgress] = useState(0);
  const [notesInput, setNotesInput] = useState('');
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [transcribeUrl, setTranscribeUrl] = useState('');

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

  const outlineGuidance = useMemo(() => {
    switch (voice) {
      case 'founder-story':
        return 'Open with a milestone → reveal the customer outcome → close with an invitation to co-build the next chapter.';
      case 'educator':
        return 'Frame the problem → teach three actionable steps → recap with proof → extend a helpful CTA.';
      case 'creator-collab':
        return 'Hook with a challenge → duet-style proof → playful CTA inviting creators to remix the story.';
      default:
        return 'Anchor in customer proof → show the Claude workflow → end with a crisp next step for the viewer.';
    }
  }, [voice]);

  const voiceLabel = useMemo<string>(() => {
    return brandVoiceOptions.find((option) => option.value === voice)?.label ?? brandVoiceOptions[0]!.label;
  }, [voice]);

  const voiceLabelLower = useMemo(() => voiceLabel.toLowerCase(), [voiceLabel]);

  const handleGenerate = () => {
    setPhase('generating');
  };

  const handleOpenEditor = () => {
    alert('Navigate to Hemingway editor with generated script payload.');
  };

  const handleSubmitNotes = () => {
    if (!notesInput.trim()) {
      alert('Add a few notes so Claude knows where to begin.');
      return;
    }
    alert(`Kick off notes flow with: ${notesInput.slice(0, 120)}${notesInput.length > 120 ? '…' : ''}`);
  };

  const handleSubmitVideo = (url: string, mode: 'inspiration' | 'transcribe') => {
    if (!url.trim()) {
      alert('Paste a video URL to continue.');
      return;
    }
    alert(`Start ${mode === 'inspiration' ? 'inspiration' : 'transcription'} flow with ${url}`);
  };

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

  const generatingSection = (
    <section css={cardStyles}>
      <h3 css={css`margin: 0; font-size: 18px; letter-spacing: -0.2px;`}>
        Claude is shaping your story…
      </h3>
      <span css={css`font-size: 13px; color: rgba(9, 30, 66, 0.6);`}>
        {length} second video in the {voiceLabelLower} voice about “{selectedIdea.title}”.
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
            {length} second story in the {voiceLabelLower} voice.
          </span>
        </div>
        <div css={css`display: inline-flex; gap: 8px;`}>
          <GcDashButton variant="ghost">Share preview</GcDashButton>
          <GcDashButton onClick={handleOpenEditor}>Open in Hemingway</GcDashButton>
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
          description="Remember when onboarding meant juggling five tools? Here’s how we fixed it in one sprint."
        />
        <GcDashFeatureCard
          title="Proof"
          description="Automation captures now prep exec briefings in minutes, powering a 30-day rollout."
        />
        <GcDashFeatureCard
          title="CTA"
          description="Invite leaders to co-build a pilot in Claude Workspace this month."
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
        {`[Intro]
Onboarding used to mean juggling five tools. In September we moved the entire workflow into Claude Workspace and shipped in under 30 days.

[Proof]
Automated captures now prep every exec briefing, revenue ops runs their checklist in a single view, and GTM teams launch playbooks in minutes.

[CTA]
DM me to see the workspace live and grab the prompts we use every Monday.`}
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
              Choose a prompt sourced from your onboarding answers. Claude will use it as the brief for your script.
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
            <GcDashButton onClick={handleGenerate}>Draft with Claude</GcDashButton>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="Claude tip"
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
          <GcDashCardTitle>Use notes to brief Claude</GcDashCardTitle>
          <GcDashCardSubtitle>
            Share quick bullets about your idea, launch, or announcement. Claude will turn them into a script with hook, proof, and CTA moments.
          </GcDashCardSubtitle>
          <GcDashTextArea
            placeholder={`• Launching the onboarding workspace next Tuesday\n• Highlight 30-day rollout + exec alignment\n• CTA: DM for pilot access`}
            rows={6}
            value={notesInput}
            onChange={(event) => setNotesInput(event.target.value)}
          />
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
              <GcDashButton onClick={handleSubmitNotes}>Draft with Claude</GcDashButton>
            </div>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="What happens next"
        description="Claude maps your notes into a clear storyline and keeps brand voice guardrails in place before handing off to the editor."
        highlight
      />
    </div>
  );

  const inspirationView = (
    <div css={singleColumnStyles}>
      <GcDashCard>
        <GcDashCardBody>
          <GcDashCardTitle>Get inspiration from an existing video</GcDashCardTitle>
          <GcDashCardSubtitle>
            Paste a TikTok, Reels, or Shorts link. Claude will extract the structure so you can remix the idea in your brand voice.
          </GcDashCardSubtitle>
          <GcDashInput
            type="url"
            inputMode="url"
            placeholder="https://www.tiktok.com/@creator/video/123"
            value={inspirationUrl}
            onChange={(event) => setInspirationUrl(event.target.value)}
          />
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
              <GcDashButton variant="ghost" onClick={() => setInspirationUrl('')}>
                Clear
              </GcDashButton>
              <GcDashButton onClick={() => handleSubmitVideo(inspirationUrl, 'inspiration')}>
                Analyze clip
              </GcDashButton>
            </div>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="Claude will"
        description="Break the clip into hook, story beats, and CTA, then suggest fresh angles and talking points aligned to your audience."
      />
    </div>
  );

  const transcribeView = (
    <div css={singleColumnStyles}>
      <GcDashCard>
        <GcDashCardBody>
          <GcDashCardTitle>Transcribe a video</GcDashCardTitle>
          <GcDashCardSubtitle>
            Drop a link to pull the transcript from an Instagram Reel, TikTok, or YouTube video. Use it as source material for your next draft.
          </GcDashCardSubtitle>
          <GcDashInput
            type="url"
            inputMode="url"
            placeholder="https://youtu.be/abc123"
            value={transcribeUrl}
            onChange={(event) => setTranscribeUrl(event.target.value)}
          />
          <div
            css={css`
              display: flex;
              justify-content: flex-end;
              gap: 12px;
            `}
          >
            <GcDashButton variant="ghost" onClick={() => setTranscribeUrl('')}>
              Clear
            </GcDashButton>
            <GcDashButton onClick={() => handleSubmitVideo(transcribeUrl, 'transcribe')}>
              Transcribe video
            </GcDashButton>
          </div>
        </GcDashCardBody>
      </GcDashCard>

      <GcDashFeatureCard
        title="Pro tip"
        description="Keep the transcript handy—you can highlight the strongest lines and feed them into the notes flow to remix in your voice."
      />
    </div>
  );

  const renderEntryModeContent = () => {
    switch (entryMode) {
      case 'notes':
        return notesView;
      case 'inspiration':
        return inspirationView;
      case 'transcribe':
        return transcribeView;
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
