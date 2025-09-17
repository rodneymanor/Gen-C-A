import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { Badge } from '../components/ui/Badge';
import BasicModal from '../components/ui/BasicModal';

import AddIcon from '@atlaskit/icon/glyph/add';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';

const pageContainerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const headerStyles = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;

  .header-text {
    flex: 1;
    min-width: 260px;

    h1 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    p {
      margin: 0;
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      line-height: var(--line-height-relaxed, 1.6);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
`;

const layoutStyles = css`
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: var(--space-6);

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }

  .voice-column,
  .strategy-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
`;

const voiceLibraryStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  .voice-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
  }
`;

const voiceCardStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  .voice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);

    h3 {
      margin: 0;
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
    }
  }

  .voice-summary {
    margin: 0;
    color: var(--color-neutral-600);
    font-size: var(--font-size-body-small);
    line-height: var(--line-height-normal, 1.55);
  }

  .voice-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .pillars {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .persona {
    margin: 0;
    font-size: var(--font-size-body-small);
    color: var(--color-neutral-600);
    font-weight: var(--font-weight-medium);
  }
`;

const workflowCardStyles = css`
  display: grid;
  gap: var(--space-4);

  .workflow-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .workflow-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px dashed var(--color-neutral-200);
    background: var(--color-neutral-50);

    .icon {
      color: var(--color-primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .details {
      flex: 1;

      h4 {
        margin: 0 0 var(--space-1);
        font-size: var(--font-size-body);
        color: var(--color-neutral-800);
      }

      p {
        margin: 0;
        color: var(--color-neutral-600);
        font-size: var(--font-size-body-small);
        line-height: var(--line-height-normal, 1.55);
      }
    }
  }
`;

const onboardingCardStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  form {
    display: grid;
    gap: var(--space-4);
  }

  .form-grid {
    display: grid;
    gap: var(--space-4);

    @media (min-width: 720px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .form-field {
    display: grid;
    gap: var(--space-2);
  }

  .intent-section {
    display: grid;
    gap: var(--space-3);

    .intent-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  }
`;

const intentChipStyles = (isActive: boolean) => css`
  padding: 6px 12px;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid ${isActive ? 'var(--color-primary-500)' : 'var(--color-neutral-200)'};
  background: ${isActive ? 'var(--color-primary-50)' : 'var(--color-neutral-0)'};
  color: ${isActive ? 'var(--color-primary-700)' : 'var(--color-neutral-600)'};
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-all);

  &:hover {
    border-color: var(--color-primary-400);
  }
`;

const blueprintCardStyles = css`
  display: grid;
  gap: var(--space-4);

  .empty-state {
    padding: var(--space-5);
    border: 1px dashed var(--color-neutral-300);
    border-radius: var(--radius-medium);
    text-align: center;
    color: var(--color-neutral-500);
    font-size: var(--font-size-body);
  }

  .pillars,
  .qa-list,
  .intent-list {
    display: grid;
    gap: var(--space-3);
  }

  .pillar-tag {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-0);

    span {
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-700);
    }

    p {
      margin: 0;
      color: var(--color-neutral-500);
      font-size: var(--font-size-caption);
    }
  }

  .qa-item {
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-50);

    h4 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-size-body);
      color: var(--color-neutral-800);
    }

    p {
      margin: 0;
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      line-height: var(--line-height-normal, 1.55);
    }
  }

  .intent-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);

    h4 {
      margin: 0;
      font-size: var(--font-size-body);
      color: var(--color-neutral-800);
    }

    p {
      margin: 0;
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
      line-height: var(--line-height-normal, 1.55);
    }
  }
`;

const modalBodyStyles = css`
  display: grid;
  gap: var(--space-4);

  .field-group {
    display: grid;
    gap: var(--space-2);
  }

  .field-label {
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
  }

  .platform-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .helper {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .video-list {
    display: grid;
    gap: var(--space-3);
    max-height: 260px;
    overflow-y: auto;
    padding-right: var(--space-1);
  }

  .video-item {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-0);

    .thumbnail {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-medium);
      background: var(--color-neutral-100);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-neutral-500);
    }

    .details {
      flex: 1;
      display: grid;
      gap: 4px;

      h4 {
        margin: 0;
        font-size: var(--font-size-body);
        color: var(--color-neutral-800);
      }

      p {
        margin: 0;
        color: var(--color-neutral-600);
        font-size: var(--font-size-body-small);
        line-height: var(--line-height-normal, 1.55);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        font-size: var(--font-size-caption);
        color: var(--color-neutral-500);
      }
    }
  }

  .empty-state {
    padding: var(--space-6);
    border: 1px dashed var(--color-neutral-300);
    border-radius: var(--radius-medium);
    text-align: center;
    display: grid;
    gap: var(--space-3);
    background: var(--color-neutral-50);

    p {
      margin: 0;
      color: var(--color-neutral-600);
      line-height: var(--line-height-relaxed, 1.6);
    }
  }

  .analysis-summary {
    padding: var(--space-4);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-success-200);
    background: var(--color-success-50);
    display: grid;
    gap: var(--space-2);

    h4 {
      margin: 0;
      font-size: var(--font-size-body);
      color: var(--color-success-700);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    ul {
      margin: 0;
      padding-left: var(--space-4);
      color: var(--color-neutral-600);
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-normal, 1.55);
    }
  }
`;

const platformChipStyles = (isActive: boolean) => css`
  padding: 6px 14px;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid ${isActive ? 'var(--color-primary-500)' : 'var(--color-neutral-200)'};
  background: ${isActive ? 'var(--color-primary-50)' : 'var(--color-neutral-0)'};
  color: ${isActive ? 'var(--color-primary-700)' : 'var(--color-neutral-600)'};
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-all);

  &:hover {
    border-color: var(--color-primary-400);
  }
`;

type BrandVoice = {
  id: string;
  name: string;
  status: 'Live' | 'Draft' | 'Exploring';
  persona: string;
  summary: string;
  platform: string;
  audience: string;
  lastUpdated: string;
  pillars: string[];
};

type CreatorVideo = {
  id: string;
  title: string;
  duration: string;
  performance: string;
  postedAt: string;
};

type OnboardingFormState = {
  brandName: string;
  primaryTopic: string;
  audience: string;
  voicePersonality: string;
  promise: string;
  originStory: string;
};

const mockBrandVoices: BrandVoice[] = [
  {
    id: 'voice-1',
    name: 'Magnetic Maker',
    status: 'Live',
    persona: 'Avery — The Enthusiastic Builder',
    summary: 'Launch-ready scripts that blend transparent behind-the-scenes storytelling with clear calls to action for maker launches.',
    platform: 'Instagram Reels · TikTok',
    audience: 'Ambitious DIY and indie brand founders',
    lastUpdated: 'Updated 2 days ago',
    pillars: ['Build in public wins', 'Launch diaries', 'Process deep-dives']
  },
  {
    id: 'voice-2',
    name: 'Calm Authority',
    status: 'Draft',
    persona: 'Maya — The Mindful Strategist',
    summary: 'Grounded, research-backed guidance that makes complex marketing strategies feel actionable and approachable.',
    platform: 'YouTube Shorts · LinkedIn video',
    audience: 'Marketing leads at consumer startups',
    lastUpdated: 'Updated 6 days ago',
    pillars: ['Framework explainers', 'Case study breakdowns', 'Live teardowns']
  },
  {
    id: 'voice-3',
    name: 'Spark Notes',
    status: 'Exploring',
    persona: 'Jonah — The Hype Curator',
    summary: 'Fast-paced swipe file inspiration that surfaces trending hooks and cultural cues for daily short-form output.',
    platform: 'TikTok · Shorts',
    audience: 'Social media generalists and content teams',
    lastUpdated: 'Research in progress',
    pillars: ['Trend watch', 'Swipe file breakdowns', 'Hook remixes']
  }
];

const mockVideos: CreatorVideo[] = [
  {
    id: 'clip-1',
    title: 'I tried launching in 48 hours — here is what happened',
    duration: '0:59',
    performance: '142K views · 8.1% watch through',
    postedAt: '3 days ago'
  },
  {
    id: 'clip-2',
    title: '3 storytelling beats that doubled our signups',
    duration: '1:11',
    performance: '98K views · 12% watch through',
    postedAt: '5 days ago'
  },
  {
    id: 'clip-3',
    title: 'Turning audience objections into hooks (live teardown)',
    duration: '1:02',
    performance: '76K views · 9.5% watch through',
    postedAt: '1 week ago'
  },
  {
    id: 'clip-4',
    title: 'This is how I map weekly content pillars',
    duration: '0:47',
    performance: '54K views · 7.8% watch through',
    postedAt: '1 week ago'
  },
  {
    id: 'clip-5',
    title: 'Narrative template for sharing uncomfortable lessons',
    duration: '1:04',
    performance: '62K views · 10.4% watch through',
    postedAt: '2 weeks ago'
  },
  {
    id: 'clip-6',
    title: 'The 15-minute voice warm up before I hit record',
    duration: '0:52',
    performance: '39K views · 6.9% watch through',
    postedAt: '2 weeks ago'
  }
];

const platformOptions = ['TikTok', 'Instagram', 'YouTube Shorts'];
const intentOptions = ['Educate', 'Inspire', 'Convert', 'Build community'];

export const BrandHub: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creatorInput, setCreatorInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(platformOptions[0]);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [hasFetchedVideos, setHasFetchedVideos] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedIntents, setSelectedIntents] = useState<string[]>(['Educate', 'Inspire']);
  const [hasGeneratedStrategy, setHasGeneratedStrategy] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<OnboardingFormState>({
    brandName: '',
    primaryTopic: '',
    audience: '',
    voicePersonality: '',
    promise: '',
    originStory: ''
  });

  const fetchTimerRef = useRef<number | null>(null);
  const analyzeTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (fetchTimerRef.current) {
      window.clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = null;
    }
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current);
      analyzeTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  const resetModalState = () => {
    clearTimers();
    setCreatorInput('');
    setSelectedPlatform(platformOptions[0]);
    setSelectedCreator('');
    setHasFetchedVideos(false);
    setIsFetching(false);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
  };

  const handleOpenModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetModalState();
  };

  const handleFetchVideos = () => {
    if (!creatorInput.trim()) return;
    if (fetchTimerRef.current) {
      window.clearTimeout(fetchTimerRef.current);
    }
    setIsFetching(true);
    setSelectedCreator(creatorInput.trim());
    setHasFetchedVideos(false);
    setAnalysisComplete(false);

    fetchTimerRef.current = window.setTimeout(() => {
      setIsFetching(false);
      setHasFetchedVideos(true);
    }, 700);
  };

  const handleAnalyzeVideos = () => {
    if (!hasFetchedVideos) return;
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current);
    }
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    analyzeTimerRef.current = window.setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 900);
  };

  const handleIntentToggle = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent)
        ? prev.filter((item) => item !== intent)
        : [...prev, intent]
    );
  };

  const handleFormChange = (field: keyof OnboardingFormState, value: string) => {
    setOnboardingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOnboardingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasGeneratedStrategy(true);
  };

  const brandName = onboardingForm.brandName || 'Your brand';
  const primaryTopic = onboardingForm.primaryTopic || 'your core topic';
  const audience = onboardingForm.audience || 'your audience';

  const contentPillars = [
    {
      title: 'Flagship Teachings',
      description: `Anchor episodes that walk ${audience} through the ${primaryTopic} playbook step-by-step.`
    },
    {
      title: 'Momentum Moments',
      description: `Fast story snapshots celebrating experiments, lessons, or breakthroughs from ${brandName}.`
    },
    {
      title: 'Community Signal Boost',
      description: `Weekly spotlights that highlight questions, wins, and objections sourced directly from your people.`
    }
  ];

  const qaPrompts = [
    {
      question: 'What belief are we evangelizing this week?',
      answer: `Remind viewers why ${brandName} refuses the "quick fix" trap and doubles down on consistent, generous teaching.`
    },
    {
      question: 'How do we lower the barrier to action?',
      answer: `Break your ${primaryTopic} framework into a 15-minute momentum builder that someone can try today.`
    }
  ];

  const intentPlaybook = selectedIntents.map((intent) => {
    switch (intent) {
      case 'Educate':
        return {
          intent,
          guidance: 'Show them the process. Use stepwise tutorials and annotated screen recordings to demystify your method.'
        };
      case 'Inspire':
        return {
          intent,
          guidance: 'Spotlight transformation stories and personal reflections that humanize the journey and spark ambition.'
        };
      case 'Convert':
        return {
          intent,
          guidance: 'Pair social proof with a clear next step. Close with "here is how to work with us" clarity every time.'
        };
      case 'Build community':
        return {
          intent,
          guidance: 'Invite dialogue. Pose a thoughtful question and feature responses in next week’s recap clip.'
        };
      default:
        return {
          intent,
          guidance: 'Document the behind-the-scenes process and narrate why it matters right now.'
        };
    }
  });

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={handleCloseModal}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleAnalyzeVideos}
        isDisabled={!hasFetchedVideos}
        isLoading={isAnalyzing}
      >
        {analysisComplete ? 'Re-run analysis' : 'Analyze videos'}
      </Button>
      <Button
        variant="creative"
        onClick={handleCloseModal}
        isDisabled={!analysisComplete}
      >
        Create voice draft
      </Button>
    </>
  );

  return (
    <div css={pageContainerStyles}>
      <header css={headerStyles}>
        <div className="header-text">
          <h1>Brand Hub</h1>
          <p>
            Choose the voice you want to write in, spin up new voices from your favorite creators,
            and shape onboarding inputs that unlock strategy-ready content pillars.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="secondary">Review brand guidelines</Button>
          <Button variant="primary" iconBefore={<AddIcon label="New" />} onClick={handleOpenModal}>
            New brand voice
          </Button>
        </div>
      </header>

      <div css={layoutStyles}>
        <section className="voice-column">
          <Card css={voiceLibraryStyles} appearance="raised">
            <CardHeader>
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', color: 'var(--color-neutral-800)' }}>Brand voices</h2>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-body-small)' }}>
                    Activate the voice that matches today&apos;s campaign. Each workspace stores scripts, hooks, and tone notes.
                  </p>
                </div>
                <Badge variant="primary">{mockBrandVoices.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="voice-grid">
                {mockBrandVoices.map((voice) => (
                  <Card key={voice.id} css={voiceCardStyles} appearance="subtle" isHoverable>
                    <div className="voice-header">
                      <h3>{voice.name}</h3>
                      <Badge
                        variant={voice.status === 'Live' ? 'success' : voice.status === 'Draft' ? 'neutral' : 'warning'}
                      >
                        {voice.status}
                      </Badge>
                    </div>
                    <p className="voice-summary">{voice.summary}</p>
                    <p className="persona">{voice.persona}</p>
                    <div className="pillars">
                      {voice.pillars.map((pillar) => (
                        <Badge key={pillar} variant="default" size="small">
                          {pillar}
                        </Badge>
                      ))}
                    </div>
                    <div className="voice-meta">
                      <span>{voice.platform}</span>
                      <span>·</span>
                      <span>{voice.audience}</span>
                      <span>·</span>
                      <span>{voice.lastUpdated}</span>
                    </div>
                    <CardFooter style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                      <Button variant="secondary" size="small">
                        Open voice workspace
                      </Button>
                      <Button variant="tertiary" size="small" iconAfter={<ArrowRightIcon label="Set active" />}>Set active</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card css={workflowCardStyles} appearance="raised">
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', color: 'var(--color-neutral-800)' }}>How voice creation works</h2>
                <Badge variant="primary" size="small">Preview workflow</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="workflow-list">
                <div className="workflow-item">
                  <div className="icon" aria-hidden="true">
                    <VidPlayIcon label="" />
                  </div>
                  <div className="details">
                    <h4>Pull creator library</h4>
                    <p>
                      Paste a handle and we&apos;ll fetch the latest clips, transcripts, and engagement metrics ready for review in the modal.
                    </p>
                  </div>
                </div>
                <div className="workflow-item">
                  <div className="icon" aria-hidden="true">
                    <DownloadIcon label="" />
                  </div>
                  <div className="details">
                    <h4>Cluster the voice DNA</h4>
                    <p>
                      We identify recurring hooks, narrative beats, and tonal cues before turning them into reusable brand voice ingredients.
                    </p>
                  </div>
                </div>
                <div className="workflow-item">
                  <div className="icon" aria-hidden="true">
                    <GraphLineIcon label="" />
                  </div>
                  <div className="details">
                    <h4>Publish your workspace</h4>
                    <p>
                      Approve the analysis, add onboarding inputs, and your writers immediately get playbooks, prompts, and tone sliders.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="strategy-column">
          <Card css={onboardingCardStyles} appearance="raised">
            <CardHeader>
              <div>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', color: 'var(--color-neutral-800)' }}>Onboarding questions</h2>
                <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-body-small)' }}>
                  Capture the strategic inputs once. Every writer, prompt, and campaign will use the same guardrails.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOnboardingSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <Input
                      label="Brand or creator name"
                      placeholder="Ex: Magnetic Maker"
                      value={onboardingForm.brandName}
                      onChange={(event) => handleFormChange('brandName', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Primary topic or niche"
                      placeholder="Launch storytelling, newsletter growth, etc."
                      value={onboardingForm.primaryTopic}
                      onChange={(event) => handleFormChange('primaryTopic', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <TextArea
                      label="Who are you speaking to?"
                      placeholder="Describe their role, motivation, and pain points."
                      value={onboardingForm.audience}
                      onChange={(event) => handleFormChange('audience', event.target.value)}
                      size="small"
                    />
                  </div>
                  <div className="form-field">
                    <Input
                      label="Signature promise"
                      placeholder="What consistent outcome do you deliver?"
                      value={onboardingForm.promise}
                      onChange={(event) => handleFormChange('promise', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <TextArea
                      label="Voice & personality cues"
                      placeholder="List tone words, cadence notes, do/do not guidance."
                      value={onboardingForm.voicePersonality}
                      onChange={(event) => handleFormChange('voicePersonality', event.target.value)}
                      size="small"
                    />
                  </div>
                  <div className="form-field">
                    <TextArea
                      label="Founding story or why now"
                      placeholder="Share the origin, differentiators, or mission moments we should reference."
                      value={onboardingForm.originStory}
                      onChange={(event) => handleFormChange('originStory', event.target.value)}
                      size="small"
                    />
                  </div>
                </div>

                <div className="intent-section">
                  <span className="field-label" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-neutral-700)' }}>
                    What&apos;s the intent behind most content?
                  </span>
                  <div className="intent-grid">
                    {intentOptions.map((intent) => {
                      const isActive = selectedIntents.includes(intent);
                      return (
                        <button
                          key={intent}
                          type="button"
                          onClick={() => handleIntentToggle(intent)}
                          css={intentChipStyles(isActive)}
                        >
                          {intent}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <CardFooter style={{ padding: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" type="submit">
                    Generate strategy preview
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>

          <Card css={blueprintCardStyles} appearance="raised">
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', color: 'var(--color-neutral-800)' }}>Content blueprint</h2>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-body-small)' }}>
                    Preview the pillars, conversation starters, and intent cues we&apos;ll generate once onboarding is saved.
                  </p>
                </div>
                <Badge variant={hasGeneratedStrategy ? 'success' : 'neutral'} size="small">
                  {hasGeneratedStrategy ? 'Ready to review' : 'Waiting for inputs'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {hasGeneratedStrategy ? (
                <div className="blueprint-body" style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <section className="pillars">
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-h5)', color: 'var(--color-neutral-800)' }}>Content pillars</h3>
                    {contentPillars.map((pillar) => (
                      <div key={pillar.title} className="pillar-tag">
                        <span>{pillar.title}</span>
                        <p>{pillar.description}</p>
                      </div>
                    ))}
                  </section>

                  <section className="qa-list">
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-h5)', color: 'var(--color-neutral-800)' }}>Conversation starters</h3>
                    {qaPrompts.map((prompt) => (
                      <div key={prompt.question} className="qa-item">
                        <h4>{prompt.question}</h4>
                        <p>{prompt.answer}</p>
                      </div>
                    ))}
                  </section>

                  <section className="intent-list">
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-h5)', color: 'var(--color-neutral-800)' }}>Intent playbook</h3>
                    {intentPlaybook.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--color-neutral-500)', fontSize: 'var(--font-size-body-small)' }}>
                        Select at least one intent to tailor the strategy guidance.
                      </p>
                    ) : (
                      intentPlaybook.map((item) => (
                        <div key={item.intent} className="intent-item">
                          <h4>{item.intent}</h4>
                          <p>{item.guidance}</p>
                        </div>
                      ))
                    )}
                  </section>
                </div>
              ) : (
                <div className="empty-state">
                  <p>
                    Answer the onboarding prompts to preview content pillars, audience Q&A, and intent-specific guardrails.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <BasicModal
        open={isModalOpen}
        title="Create a new brand voice"
        onClose={handleCloseModal}
        footer={modalFooter}
      >
        <div css={modalBodyStyles}>
          <div className="field-group">
            <span className="field-label">Creator URL or username</span>
            <Input
              placeholder="https://www.tiktok.com/@creator-handle"
              value={creatorInput}
              onChange={(event) => setCreatorInput(event.target.value)}
            />
            <span className="helper">We&apos;ll grab the most recent 12 videos, transcripts, and top comments.</span>
          </div>

          <div className="field-group">
            <span className="field-label">Primary platform</span>
            <div className="platform-options">
              {platformOptions.map((platform) => {
                const isActive = selectedPlatform === platform;
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setSelectedPlatform(platform)}
                    css={platformChipStyles(isActive)}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          {!hasFetchedVideos && (
            <div className="empty-state">
              <p>Paste a creator link or @handle, choose the platform, and load their latest videos for analysis.</p>
              <Button
                variant="primary"
                iconBefore={<DownloadIcon label="" />}
                onClick={handleFetchVideos}
                isDisabled={!creatorInput}
                isLoading={isFetching}
              >
                Fetch latest videos
              </Button>
            </div>
          )}

          {hasFetchedVideos && (
            <>
              <div className="field-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="field-label">Loaded creator</span>
                  <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-body-small)' }}>
                    @{selectedCreator} · {selectedPlatform}
                  </p>
                </div>
                <Button
                  variant="subtle"
                  size="small"
                  onClick={handleFetchVideos}
                  isLoading={isFetching}
                >
                  Refresh pull
                </Button>
              </div>

              <div className="video-list">
                {mockVideos.map((video) => (
                  <div key={video.id} className="video-item">
                    <div className="thumbnail" aria-hidden="true">
                      <VidPlayIcon label="" />
                    </div>
                    <div className="details">
                      <h4>{video.title}</h4>
                      <div className="meta">
                        <span>{video.duration}</span>
                        <span>·</span>
                        <span>{video.performance}</span>
                        <span>·</span>
                        <span>{video.postedAt}</span>
                      </div>
                      <p>We&apos;ll analyze the hook, pacing, call to action, and transcript sentiment.</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {analysisComplete && (
            <div className="analysis-summary">
              <h4>
                <CheckCircleIcon label="Complete" /> Analysis ready
              </h4>
              <ul>
                <li>Top hooks revolve around social proof and transparent build-in-public lessons.</li>
                <li>Tone scores balance optimistic coaching with tactical specificity.</li>
                <li>Audience questions lean toward launch sequencing and content consistency.</li>
              </ul>
            </div>
          )}
        </div>
      </BasicModal>
    </div>
  );
};

export default BrandHub;
