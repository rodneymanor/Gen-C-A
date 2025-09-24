import React from 'react'
import { css } from '@emotion/react'
import DownloadIcon from '@atlaskit/icon/glyph/download'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

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

type OnboardingSectionProps = {
  hasCompleted: boolean
  completedCount: number
  totalQuestions: number
  onStartInterview: () => void
  onViewBlueprint: () => void
  selectedIntents: string[]
  onToggleIntent: (intent: string) => void
  intentOptions: readonly string[]
  onDownloadResponses: () => void
}

export const OnboardingSection: React.FC<OnboardingSectionProps> = ({
  hasCompleted,
  completedCount,
  totalQuestions,
  onStartInterview,
  onViewBlueprint,
  selectedIntents,
  onToggleIntent,
  intentOptions,
  onDownloadResponses
}) => {
  if (!hasCompleted) {
    return (
      <Card css={onboardingIntroCardStyles} appearance="raised" spacing="comfortable">
        <span className="intro-eyebrow">Interactive onboarding</span>
        <h2>Capture your voice in minutes</h2>
        <p>
          Launch a guided interview that feels like Typeform. Speak through each question, watch the
          transcript appear instantly, and build your onboarding in one flow.
        </p>
        <div className="intro-actions">
          <Button variant="primary" onClick={onStartInterview}>
            Start interactive onboarding
          </Button>
        </div>
        <p className="progress-hint">
          {completedCount}/{totalQuestions} questions answered so far
        </p>
      </Card>
    )
  }

  return (
    <Card css={onboardingCompletedCardStyles} appearance="raised" spacing="comfortable">
      <div className="completed-header">
        <div>
          <h2>Onboarding captured</h2>
          <p>
            Review your interview responses or refine your content intents before generating new
            blueprints.
          </p>
        </div>
        <Badge variant="success" size="small">
          Complete
        </Badge>
      </div>
      <div className="intro-actions">
        <Button variant="primary" onClick={onStartInterview}>
          Review answers
        </Button>
        <Button variant="secondary" onClick={onViewBlueprint}>
          View content blueprint
        </Button>
        <Button variant="tertiary" onClick={onDownloadResponses} iconBefore={<DownloadIcon label="" />}>
          Download answers
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
                onClick={() => onToggleIntent(intent)}
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
  )
}
