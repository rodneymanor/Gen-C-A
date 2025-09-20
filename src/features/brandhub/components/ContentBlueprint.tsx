import React from 'react'
import { css } from '@emotion/react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../../components/ui/Card'
import { onboardingPrompts } from '../constants/onboarding'
import { buildContentPillars, buildIntentPlaybook, buildQaPrompts } from '../utils/blueprint'
import { OnboardingFormState } from '../types/brandHub'

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
    display: grid;
    gap: var(--space-3);
    background: var(--color-neutral-50);
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

type ContentBlueprintProps = {
  isComplete: boolean
  responses: OnboardingFormState
  selectedIntents: string[]
  onReturnToOnboarding: () => void
}

export const ContentBlueprint: React.FC<ContentBlueprintProps> = ({
  isComplete,
  responses,
  selectedIntents,
  onReturnToOnboarding
}) => {
  const contentPillars = buildContentPillars(responses)
  const qaPrompts = buildQaPrompts(responses)
  const intentPlaybook = buildIntentPlaybook(selectedIntents)

  return (
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
              Your spoken answers and intent selections craft a strategy-ready outline for writers
              and creative partners.
            </p>
          </div>
          {isComplete && <Badge variant="success">Ready to deploy</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {!isComplete ? (
          <div className="empty-state">
            <p>
              Complete the interactive onboarding to unlock tailored content pillars, tone guidance,
              and Q&amp;A prompts.
            </p>
            <Button variant="primary" onClick={onReturnToOnboarding}>
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
                  <p>{responses[prompt.id]}</p>
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
  )
}
