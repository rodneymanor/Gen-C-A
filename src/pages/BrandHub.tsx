import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@emotion/react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { TextArea } from '../components/ui/TextArea'
import { Badge } from '../components/ui/Badge'
import BasicModal from '../components/ui/BasicModal'

import AddIcon from '@atlaskit/icon/glyph/add'
import DownloadIcon from '@atlaskit/icon/glyph/download'
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle'
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line'
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right'
import ArrowUpIcon from '@atlaskit/icon/glyph/arrow-up'
import ArrowDownIcon from '@atlaskit/icon/glyph/arrow-down'
import StopwatchIcon from '@atlaskit/icon/glyph/stopwatch'

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike | undefined
  length: number
  isFinal: boolean
}

interface SpeechRecognitionResultListLike {
  length: number
  item: (index: number) => SpeechRecognitionResultLike
  [index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

const pageContainerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`

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
`

const tabListStyles = css`
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-neutral-200);
  padding-bottom: var(--space-2);
  overflow-x: auto;
`

const tabTriggerStyles = (isActive: boolean) => css`
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-medium) var(--radius-medium) 0 0;
  cursor: pointer;
  position: relative;
  color: ${isActive ? 'var(--color-neutral-900)' : 'var(--color-neutral-600)'};
  font-size: var(--font-size-body);
  font-weight: ${isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)'};
  display: grid;
  gap: 4px;
  transition: var(--transition-all);

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .tab-hint {
    font-size: var(--font-size-caption);
    color: ${isActive ? 'var(--color-neutral-600)' : 'var(--color-neutral-500)'};
    white-space: nowrap;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -9px;
    height: 3px;
    width: 100%;
    background: ${isActive ? 'var(--color-primary-500)' : 'transparent'};
    border-radius: var(--radius-pill, 999px);
    transition: var(--transition-all);
  }
`

const voicesLayoutStyles = css`
  display: grid;
  gap: var(--space-6);

  @media (min-width: 1120px) {
    grid-template-columns: 1.7fr 1fr;
  }
`

const voiceLibraryStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  .voice-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
  }
`

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
`

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
`

const onboardingIntroCardStyles = css`
  display: grid;
  gap: var(--space-4);
  justify-items: center;
  text-align: center;
  padding: var(--space-6);
  border-radius: var(--radius-large);
  border: 1px dashed var(--color-neutral-300);
  background: var(--color-neutral-0);

  .intro-eyebrow {
    font-size: var(--font-size-caption);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-neutral-500);
  }

  h2 {
    margin: 0;
    font-size: var(--font-size-h4);
    color: var(--color-neutral-900);
  }

  p {
    margin: 0;
    color: var(--color-neutral-600);
    font-size: var(--font-size-body);
    line-height: var(--line-height-relaxed, 1.6);
  }

  .progress-hint {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .intro-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    justify-content: center;
  }
`

const onboardingCompletedCardStyles = css`
  display: grid;
  gap: var(--space-5);
  padding: var(--space-6);
  border-radius: var(--radius-large);
  border: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-0);

  .completed-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .completed-header h2 {
    margin: 0;
    font-size: var(--font-size-h4);
    color: var(--color-neutral-900);
  }

  .completed-header p {
    margin: var(--space-1) 0 0;
    color: var(--color-neutral-600);
    font-size: var(--font-size-body);
    max-width: 520px;
  }

  .intro-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .intent-picker {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    background: var(--color-neutral-0);
  }

  .intent-picker h3 {
    margin: 0;
    font-size: var(--font-size-body-large);
    color: var(--color-neutral-800);
  }

  .intent-picker span,
  .intent-picker p {
    color: var(--color-neutral-500);
    font-size: var(--font-size-caption);
    margin: 0;
  }

  .intent-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
`

const onboardingModalStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 560px;

  .modal-layout {
    display: flex;
    justify-content: center;
    min-height: 100%;
    width: 100%;
  }

  .question-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding: var(--space-7);
    border-radius: var(--radius-large);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-0);
    box-shadow: 0 32px 60px rgba(15, 23, 42, 0.08);
    width: min(960px, 100%);
    min-height: 560px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .question-prefix {
    font-size: var(--font-size-caption);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-neutral-500);
  }

  .prompt-text {
    margin: 0;
    color: var(--color-neutral-900);
    font-size: var(--font-size-body-large);
    line-height: var(--line-height-relaxed, 1.6);
  }

  .question-copy {
    display: grid;
    gap: var(--space-3);
  }

  .helper-text {
    margin: 0;
    color: var(--color-neutral-500);
    font-size: var(--font-size-caption);
  }

  .timer-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px 12px;
    border-radius: var(--radius-pill, 999px);
    background: var(--color-neutral-900);
    color: white;
    font-size: var(--font-size-body-small);
    white-space: nowrap;
  }

  .transcript-stream {
    display: grid;
    gap: var(--space-2);
    background: var(--color-neutral-50);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    padding: var(--space-3);
    min-height: 96px;
  }

  .stream-label {
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-600);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stream-output {
    font-size: var(--font-size-body);
    color: var(--color-neutral-800);
    line-height: var(--line-height-relaxed, 1.6);
    white-space: pre-wrap;
  }

  .response-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  .error-banner {
    background: var(--color-danger-50);
    border: 1px solid var(--color-danger-200);
    border-radius: var(--radius-medium);
    padding: var(--space-3);
    color: var(--color-danger-600);
    font-size: var(--font-size-body-small);
  }

  .panel-footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .progress-meta {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .nav-cluster {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    margin-left: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .arrow-stack {
    display: inline-flex;
    flex-direction: row;
    gap: var(--space-2);
    color: var(--color-primary-500);
  }

  .nav-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-neutral-300);
    background: var(--color-neutral-0);
    color: var(--color-neutral-700);
    transition: var(--transition-all);
    cursor: pointer;
  }

  .nav-button:hover:not(:disabled) {
    border-color: var(--color-primary-300);
    color: var(--color-primary-600);
  }

  .nav-button.primary {
    background: var(--color-primary-50);
    border-color: var(--color-primary-300);
    color: var(--color-primary-600);
  }

  .nav-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background: var(--color-neutral-100);
    color: var(--color-neutral-400);
  }

  .powered {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-2);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-600);
  }

  .keyboard-hint {
    text-align: center;
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
    margin-top: var(--space-2);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 720px) {
    .modal-layout {
      padding: 0 var(--space-2);
    }

    .question-panel {
      max-width: none;
    }

    .panel-footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .nav-cluster {
      align-self: flex-end;
      justify-content: flex-start;
    }
  }
`

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
`

const blueprintCardStyles = css`
  display: grid;
  gap: var(--space-5);

  .section {
    display: grid;
    gap: var(--space-3);
  }

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
  .intent-list,
  .transcript-list {
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
    display: grid;
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
`

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
`

type BrandVoice = {
  id: string
  name: string
  status: 'Live' | 'Draft' | 'Exploring'
  persona: string
  summary: string
  platform: string
  audience: string
  lastUpdated: string
  pillars: string[]
}

type CreatorVideo = {
  id: string
  title: string
  duration: string
  performance: string
  postedAt: string
}

type OnboardingFormState = {
  brandName: string
  primaryTopic: string
  audience: string
  voicePersonality: string
  promise: string
  originStory: string
}

type TabKey = 'voices' | 'onboarding' | 'blueprint'

type OnboardingPrompt = {
  id: keyof OnboardingFormState
  title: string
  prompt: string
  helper?: string
}

const mockBrandVoices: BrandVoice[] = [
  {
    id: 'voice-1',
    name: 'Magnetic Maker',
    status: 'Live',
    persona: 'Avery — The Enthusiastic Builder',
    summary:
      'Launch-ready scripts that blend transparent behind-the-scenes storytelling with clear calls to action for maker launches.',
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
    summary:
      'Grounded, research-backed guidance that makes complex marketing strategies feel actionable and approachable.',
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
    summary:
      'Fast-paced swipe file inspiration that surfaces trending hooks and cultural cues for daily short-form output.',
    platform: 'TikTok · Shorts',
    audience: 'Social media generalists and content teams',
    lastUpdated: 'Research in progress',
    pillars: ['Trend watch', 'Swipe file breakdowns', 'Hook remixes']
  }
]

const mockVideos: CreatorVideo[] = [
  {
    id: 'video-1',
    title: 'How I storyboard a 60-second launch video',
    duration: '1:12',
    performance: '54K views · 7.2% watch through',
    postedAt: '3 days ago'
  },
  {
    id: 'video-2',
    title: 'This hook consistently adds 15% more watch time',
    duration: '0:48',
    performance: '42K views · 6.4% watch through',
    postedAt: '5 days ago'
  },
  {
    id: 'video-3',
    title: 'What I look for in a creator partnership brief',
    duration: '1:26',
    performance: '37K views · 5.1% watch through',
    postedAt: '1 week ago'
  },
  {
    id: 'video-4',
    title: 'The 15-minute voice warm up before I hit record',
    duration: '0:52',
    performance: '39K views · 6.9% watch through',
    postedAt: '2 weeks ago'
  }
]

const onboardingPrompts: OnboardingPrompt[] = [
  {
    id: 'brandName',
    title: 'Brand or creator name',
    prompt:
      'State your brand or creator name and the kind of work you are best known for. Keep it conversational.',
    helper:
      'Example: “I’m Magnetic Maker — we build in public to help indie founders launch faster.”'
  },
  {
    id: 'primaryTopic',
    title: 'Primary topic or niche',
    prompt:
      'Describe the main transformation, topic, or problem space you create content around every week.',
    helper: 'Call out the frameworks, systems, or rituals you teach repeatedly.'
  },
  {
    id: 'audience',
    title: 'Audience snapshot',
    prompt:
      'Tell us about the people you want to reach. What do they care about, and what keeps them stuck?',
    helper: 'Include their role, ambition, and the tension they feel right now.'
  },
  {
    id: 'voicePersonality',
    title: 'Voice personality',
    prompt:
      'Explain how you want your content to feel. Mention pacing, tone, and the emotions you want to leave them with.',
    helper: 'Is your voice more like an encouraging coach, a hype curator, or a calm analyst?'
  },
  {
    id: 'promise',
    title: 'Core promise',
    prompt: 'Share the promise you want every viewer to remember after watching your clips.',
    helper: 'What do you help them do faster, braver, or with more clarity than anyone else?'
  },
  {
    id: 'originStory',
    title: 'Signature origin story',
    prompt:
      'Briefly retell the story that explains why you started this work or why it matters to you.',
    helper: 'Anchor it in a moment, a catalyst, or a lived experience that only you can claim.'
  }
]

const platformOptions = ['TikTok', 'Instagram', 'YouTube Shorts']
const intentOptions = ['Educate', 'Inspire', 'Convert', 'Build community']

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export const BrandHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('voices')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creatorInput, setCreatorInput] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState(platformOptions[0])
  const [selectedCreator, setSelectedCreator] = useState('')
  const [hasFetchedVideos, setHasFetchedVideos] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [selectedIntents, setSelectedIntents] = useState<string[]>(['Educate', 'Inspire'])
  const [questionResponses, setQuestionResponses] = useState<OnboardingFormState>({
    brandName: '',
    primaryTopic: '',
    audience: '',
    voicePersonality: '',
    promise: '',
    originStory: ''
  })
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [hasOnboardingCompleted, setHasOnboardingCompleted] = useState(false)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false)

  const fetchTimerRef = useRef<number | null>(null)
  const analyzeTimerRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerIntervalRef = useRef<number | null>(null)

  const currentQuestion = onboardingPrompts[activeQuestionIndex]

  const clearTimers = () => {
    if (fetchTimerRef.current) {
      window.clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = null
    }
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current)
      analyzeTimerRef.current = null
    }
  }

  useEffect(
    () => () => {
      clearTimers()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    },
    []
  )

  useEffect(() => {
    const existingResponse = questionResponses[currentQuestion.id] ?? ''
    setLiveTranscript(existingResponse)
    setElapsedSeconds(0)
    setRecordingError(null)
  }, [activeQuestionIndex, currentQuestion.id, questionResponses])

  const resetModalState = () => {
    clearTimers()
    setCreatorInput('')
    setSelectedPlatform(platformOptions[0])
    setSelectedCreator('')
    setHasFetchedVideos(false)
    setIsFetching(false)
    setIsAnalyzing(false)
    setAnalysisComplete(false)
  }

  const handleOpenModal = () => {
    resetModalState()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetModalState()
  }

  const handleFetchVideos = () => {
    if (!creatorInput.trim()) return
    if (fetchTimerRef.current) {
      window.clearTimeout(fetchTimerRef.current)
    }
    setIsFetching(true)
    setSelectedCreator(creatorInput.trim())
    setHasFetchedVideos(false)
    setAnalysisComplete(false)

    fetchTimerRef.current = window.setTimeout(() => {
      setIsFetching(false)
      setHasFetchedVideos(true)
    }, 700)
  }

  const handleAnalyzeVideos = () => {
    if (!hasFetchedVideos) return
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current)
    }
    setIsAnalyzing(true)
    setAnalysisComplete(false)

    analyzeTimerRef.current = window.setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 900)
  }

  const handleIntentToggle = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent) ? prev.filter((item) => item !== intent) : [...prev, intent]
    )
  }

  const handleOpenOnboardingModal = () => {
    const firstIncompleteIndex = onboardingPrompts.findIndex(
      (prompt) => (questionResponses[prompt.id] ?? '').trim().length === 0
    )

    if (firstIncompleteIndex >= 0) {
      setActiveQuestionIndex(firstIncompleteIndex)
    } else if (activeQuestionIndex !== 0) {
      setActiveQuestionIndex(0)
    }

    setIsOnboardingModalOpen(true)
  }

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    const speechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? undefined
    const questionId = currentQuestion.id

    setRecordingError(null)

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }
    } catch (error) {
      setRecordingError('Microphone permission is required to capture your answers.')
      return
    }

    if (!speechRecognitionClass) {
      setRecordingError(
        'Live transcription is not supported in this browser. You can type your answer below.'
      )
      return
    }

    const recognition = new speechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript?.trim?.() ?? '')
        .join(' ')
        .trim()

      setLiveTranscript(transcript)
      setQuestionResponses((prev) => ({ ...prev, [questionId]: transcript }))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setRecordingError('We could not detect audio. Try speaking closer to the microphone.')
      } else if (event.error === 'not-allowed') {
        setRecordingError(
          'Microphone access is blocked. Update your browser permissions to record.'
        )
      } else {
        setRecordingError(
          event.message ??
            'Something interrupted the recording. You can continue typing your response.'
        )
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      recognitionRef.current = null
      setIsRecording(false)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      setElapsedSeconds(0)
      const existingResponse = questionResponses[questionId] ?? ''
      if (existingResponse) {
        setLiveTranscript(existingResponse)
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
      }
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      setRecordingError(
        'We were unable to start recording. Try refreshing the page or typing your response.'
      )
      recognitionRef.current = null
      setIsRecording(false)
    }
  }, [currentQuestion.id, isRecording, questionResponses])

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch (error) {
        // Stopping an inactive recognition instance can throw; ignore.
      }
      recognitionRef.current = null
    }

    setIsRecording(false)
    setQuestionResponses((prev) => ({ ...prev, [currentQuestion.id]: liveTranscript.trim() }))
  }, [currentQuestion.id, liveTranscript])

  const handleCloseOnboardingModal = () => {
    stopRecording()
    setIsOnboardingModalOpen(false)
  }

  const handleTranscriptChange = (value: string) => {
    setLiveTranscript(value)
    setQuestionResponses((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNextQuestion = () => {
    stopRecording()
    const isLastQuestion = activeQuestionIndex === onboardingPrompts.length - 1

    if (isLastQuestion) {
      setHasOnboardingCompleted(true)
      setIsOnboardingModalOpen(false)
      setActiveTab('blueprint')
      return
    }

    setActiveQuestionIndex((prev) => Math.min(prev + 1, onboardingPrompts.length - 1))
  }

  const handlePreviousQuestion = () => {
    stopRecording()
    setActiveQuestionIndex((prev) => Math.max(prev - 1, 0))
  }

  const completedCount = useMemo(
    () =>
      onboardingPrompts.filter((prompt) => (questionResponses[prompt.id] ?? '').trim().length > 0)
        .length,
    [questionResponses]
  )

  const isQuestionnaireComplete = completedCount === onboardingPrompts.length

  const brandName = questionResponses.brandName || 'Your brand'
  const primaryTopic = questionResponses.primaryTopic || 'your core topic'
  const audience = questionResponses.audience || 'your audience'

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
  ]

  const qaPrompts = [
    {
      question: 'What belief are we evangelizing this week?',
      answer: `Remind viewers why ${brandName} refuses the "quick fix" trap and doubles down on consistent, generous teaching.`
    },
    {
      question: 'How do we lower the barrier to action?',
      answer: `Break your ${primaryTopic} framework into a 15-minute momentum builder that someone can try today.`
    }
  ]

  const intentPlaybook = selectedIntents.map((intent) => {
    switch (intent) {
      case 'Educate':
        return {
          intent,
          guidance:
            'Show them the process. Use stepwise tutorials and annotated screen recordings to demystify your method.'
        }
      case 'Inspire':
        return {
          intent,
          guidance:
            'Spotlight transformation stories and personal reflections that humanize the journey and spark ambition.'
        }
      case 'Convert':
        return {
          intent,
          guidance:
            'Pair social proof with a clear next step. Close with "here is how to work with us" clarity every time.'
        }
      case 'Build community':
        return {
          intent,
          guidance:
            'Invite dialogue. Pose a thoughtful question and feature responses in next week’s recap clip.'
        }
      default:
        return {
          intent,
          guidance: 'Document the behind-the-scenes process and narrate why it matters right now.'
        }
    }
  })

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
      <Button variant="creative" onClick={handleCloseModal} isDisabled={!analysisComplete}>
        Create voice draft
      </Button>
    </>
  )

  const tabConfig: Array<{ id: TabKey; label: string; hint: string }> = [
    { id: 'voices', label: 'Voice library', hint: 'Manage active brand voices' },
    {
      id: 'onboarding',
      label: 'Interactive onboarding',
      hint: 'Capture strategic context with audio'
    },
    { id: 'blueprint', label: 'Content blueprint', hint: 'Translate answers into pillars' }
  ]

  const canAdvance = (questionResponses[currentQuestion.id] ?? '').trim().length > 0
  const isLastQuestion = activeQuestionIndex === onboardingPrompts.length - 1

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

      <nav css={tabListStyles} aria-label="Brand hub sections">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            css={tabTriggerStyles(activeTab === tab.id)}
            onClick={() => {
              if (tab.id === 'blueprint' && !isQuestionnaireComplete) {
                setActiveTab('onboarding')
                return
              }
              setActiveTab(tab.id)
            }}
          >
            <span>{tab.label}</span>
            <span className="tab-hint">{tab.hint}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'voices' && (
        <div css={voicesLayoutStyles}>
          <section>
            <Card css={voiceLibraryStyles} appearance="raised">
              <CardHeader>
                <div
                  className="section-heading"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-h4)',
                        color: 'var(--color-neutral-800)'
                      }}
                    >
                      Brand voices
                    </h2>
                    <p
                      style={{
                        margin: 'var(--space-1) 0 0',
                        color: 'var(--color-neutral-600)',
                        fontSize: 'var(--font-size-body-small)'
                      }}
                    >
                      Activate the voice that matches today&apos;s campaign. Each workspace stores
                      scripts, hooks, and tone notes.
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
                          variant={
                            voice.status === 'Live'
                              ? 'success'
                              : voice.status === 'Draft'
                                ? 'neutral'
                                : 'warning'
                          }
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
                      <CardFooter
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)'
                        }}
                      >
                        <Button variant="secondary" size="small">
                          Open voice workspace
                        </Button>
                        <Button
                          variant="tertiary"
                          size="small"
                          iconAfter={<ArrowRightIcon label="Set active" />}
                        >
                          Set active
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <aside>
            <Card css={workflowCardStyles} appearance="raised">
              <CardHeader>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-h4)',
                      color: 'var(--color-neutral-800)'
                    }}
                  >
                    How voice creation works
                  </h2>
                  <Badge variant="primary" size="small">
                    Preview workflow
                  </Badge>
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
                        Paste a handle and we&apos;ll fetch the latest clips, transcripts, and
                        engagement metrics ready for review in the modal.
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
                        We identify recurring hooks, narrative beats, and tonal cues before turning
                        them into reusable brand voice ingredients.
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
                        Approve the analysis, add onboarding inputs, and your writers immediately
                        get playbooks, prompts, and tone sliders.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      {activeTab === 'onboarding' && (
        <>
          {!hasOnboardingCompleted ? (
            <Card css={onboardingIntroCardStyles} appearance="raised" spacing="comfortable">
              <span className="intro-eyebrow">Interactive onboarding</span>
              <h2>Capture your voice in minutes</h2>
              <p>
                Launch a guided interview that feels like Typeform. Speak through each question,
                watch the transcript appear instantly, and build your onboarding in one flow.
              </p>
              <div className="intro-actions">
                <Button variant="primary" onClick={handleOpenOnboardingModal}>
                  Start interactive onboarding
                </Button>
              </div>
              <p className="progress-hint">
                {completedCount}/{onboardingPrompts.length} questions answered so far
              </p>
            </Card>
          ) : (
            <Card css={onboardingCompletedCardStyles} appearance="raised" spacing="comfortable">
              <div className="completed-header">
                <div>
                  <h2>Onboarding captured</h2>
                  <p>
                    Review your interview responses or refine your content intents before generating
                    new blueprints.
                  </p>
                </div>
                <Badge variant="success" size="small">
                  Complete
                </Badge>
              </div>
              <div className="intro-actions">
                <Button variant="primary" onClick={handleOpenOnboardingModal}>
                  Review answers
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('blueprint')}>
                  View content blueprint
                </Button>
              </div>
              <div className="intent-picker">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)'
                  }}
                >
                  <h3>Content intent focus</h3>
                  <span>Choose the outcomes you want each clip to drive.</span>
                </div>
                <div className="intent-options">
                  {intentOptions.map((intent) => {
                    const isActive = selectedIntents.includes(intent)
                    return (
                      <button
                        key={intent}
                        type="button"
                        css={intentChipStyles(isActive)}
                        onClick={() => handleIntentToggle(intent)}
                      >
                        {intent}
                      </button>
                    )
                  })}
                </div>
                <p>
                  We recommend selecting two to three intents so your blueprint balances education,
                  inspiration, and conversion moments.
                </p>
              </div>
            </Card>
          )}

          <BasicModal
            open={isOnboardingModalOpen}
            title="Interactive onboarding interview"
            onClose={handleCloseOnboardingModal}
            size="large"
          >
            <div css={onboardingModalStyles}>
              <div className="modal-layout">
                <div className="question-panel">
                  <div className="panel-header">
                    <Badge variant="primary" size="small">
                      Question {activeQuestionIndex + 1} of {onboardingPrompts.length}
                    </Badge>
                    <div className="timer-pill">
                      <StopwatchIcon label="Timer" /> {formatTime(elapsedSeconds)}
                      {isRecording ? ' · Recording' : ' · Ready'}
                    </div>
                  </div>
                  <div className="question-copy">
                    <span className="question-prefix">Voice interview</span>
                    <h3 className="prompt-text">{currentQuestion.prompt}</h3>
                    {currentQuestion.helper && (
                      <p className="helper-text">{currentQuestion.helper}</p>
                    )}
                  </div>
                  <div className="transcript-stream">
                    <span className="stream-label">Live transcript</span>
                    <div className="stream-output">
                      {liveTranscript || 'Your words will appear here as you speak.'}
                    </div>
                  </div>
                  <TextArea
                    label="Refine or add notes"
                    placeholder="Type to expand on your spoken answer."
                    value={questionResponses[currentQuestion.id] ?? ''}
                    onChange={(event) => handleTranscriptChange(event.target.value)}
                    size="small"
                  />
                  {recordingError && <div className="error-banner">{recordingError}</div>}
                  <div className="response-controls">
                    <Button
                      variant={isRecording ? 'secondary' : 'primary'}
                      iconBefore={
                        <VidPlayIcon label={isRecording ? 'Stop recording' : 'Start recording'} />
                      }
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? 'Stop recording' : 'Start recording'}
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={() => handleTranscriptChange('')}
                      isDisabled={isRecording}
                    >
                      Clear response
                    </Button>
                  </div>
                  <div className="panel-footer">
                    <div className="progress-meta">
                      {completedCount}/{onboardingPrompts.length} answered
                    </div>
                    <div className="nav-cluster">
                      <div className="arrow-stack">
                        <button
                          type="button"
                          className="nav-button"
                          onClick={handlePreviousQuestion}
                          disabled={activeQuestionIndex === 0}
                          aria-label="Previous question"
                        >
                          <ArrowUpIcon label="" />
                          <span className="visually-hidden">Previous</span>
                        </button>
                        <button
                          type="button"
                          className={`nav-button${canAdvance ? ' primary' : ''}`}
                          onClick={handleNextQuestion}
                          disabled={!canAdvance}
                          aria-label={isLastQuestion ? 'Finish onboarding' : 'Next question'}
                        >
                          <ArrowDownIcon label="" />
                          <span className="visually-hidden">
                            {isLastQuestion ? 'Finish onboarding' : 'Next question'}
                          </span>
                        </button>
                      </div>
                      <span className="powered">Powered by Gen.C</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="keyboard-hint">
                Tip: Speak naturally — you can always refine the text before moving on.
              </div>
            </div>
          </BasicModal>
        </>
      )}

      {activeTab === 'blueprint' && (
        <Card css={blueprintCardStyles} appearance="raised">
          <CardHeader>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-3)'
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-h4)',
                    color: 'var(--color-neutral-800)'
                  }}
                >
                  Content blueprint
                </h2>
                <p
                  style={{
                    margin: 'var(--space-1) 0 0',
                    color: 'var(--color-neutral-600)',
                    fontSize: 'var(--font-size-body-small)'
                  }}
                >
                  Your spoken answers and intent selections craft a strategy-ready outline for
                  writers and creative partners.
                </p>
              </div>
              {isQuestionnaireComplete && <Badge variant="success">Ready to deploy</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {!isQuestionnaireComplete ? (
              <div className="empty-state">
                <p>
                  Complete the interactive onboarding to unlock tailored content pillars, tone
                  guidance, and Q&amp;A prompts.
                </p>
                <Button variant="primary" onClick={() => setActiveTab('onboarding')}>
                  Return to onboarding interview
                </Button>
              </div>
            ) : (
              <div className="section">
                <div className="pillars">
                  {contentPillars.map((pillar) => (
                    <div key={pillar.title} className="pillar-tag">
                      <span>{pillar.title}</span>
                      <p>{pillar.description}</p>
                    </div>
                  ))}
                </div>

                <div className="transcript-list">
                  {onboardingPrompts.map((prompt) => (
                    <div key={prompt.id} className="qa-item">
                      <h4>{prompt.title}</h4>
                      <p>{questionResponses[prompt.id]}</p>
                    </div>
                  ))}
                </div>

                <div className="qa-list">
                  {qaPrompts.map((qa) => (
                    <div key={qa.question} className="qa-item">
                      <h4>{qa.question}</h4>
                      <p>{qa.answer}</p>
                    </div>
                  ))}
                </div>

                <div className="intent-list">
                  {intentPlaybook.map((item) => (
                    <div key={item.intent} className="intent-item">
                      <h4>{item.intent}</h4>
                      <p>{item.guidance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            <span className="helper">
              We&apos;ll grab the most recent 12 videos, transcripts, and top comments.
            </span>
          </div>

          <div className="field-group">
            <span className="field-label">Primary platform</span>
            <div className="platform-options">
              {platformOptions.map((platform) => {
                const isActive = selectedPlatform === platform
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setSelectedPlatform(platform)}
                    css={intentChipStyles(isActive)}
                  >
                    {platform}
                  </button>
                )
              })}
            </div>
          </div>

          {!hasFetchedVideos && (
            <div className="empty-state">
              <p>
                Paste a creator link or @handle, choose the platform, and load their latest videos
                for analysis.
              </p>
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
              <div
                className="field-group"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-3)'
                }}
              >
                <div>
                  <span className="field-label">Loaded creator</span>
                  <p
                    style={{
                      margin: 'var(--space-1) 0 0',
                      color: 'var(--color-neutral-600)',
                      fontSize: 'var(--font-size-body-small)'
                    }}
                  >
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
                      <p>
                        We&apos;ll analyze the hook, pacing, call to action, and transcript
                        sentiment.
                      </p>
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
                <li>
                  Top hooks revolve around social proof and transparent build-in-public lessons.
                </li>
                <li>Tone scores balance optimistic coaching with tactical specificity.</li>
                <li>Audience questions lean toward launch sequencing and content consistency.</li>
              </ul>
            </div>
          )}
        </div>
      </BasicModal>
    </div>
  )
}

export default BrandHub
