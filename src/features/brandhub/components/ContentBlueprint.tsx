import React from 'react'
import { css } from '@emotion/react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../../components/ui/Card'
import { onboardingPrompts } from '../constants/onboarding'
import { buildContentPillars, buildIntentPlaybook, buildQaPrompts } from '../utils/blueprint'
import { OnboardingFormState, BrandProfile, BrandProfileResult } from '../types/brandHub'

const blueprintCardStyles = css`
  display: grid;
  gap: var(--space-5);

  .section {
    display: grid;
    gap: var(--space-3);
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
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

  .brand-profile-section {
    display: grid;
    gap: var(--space-3);
  }

  .brand-profile-meta {
    font-size: var(--font-size-caption);
    color: var(--color-neutral-500);
  }

  .brand-profile-grid {
    display: grid;
    gap: var(--space-4);
  }

  .keyword-grid {
    display: grid;
    gap: var(--space-3);
  }

  @media (min-width: 720px) {
    .keyword-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .keyword-group {
    display: grid;
    gap: var(--space-2);
  }

  .keyword-group h3 {
    margin: 0;
    font-size: var(--font-size-body);
    color: var(--color-neutral-800);
  }

  .keyword-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .keyword-pill {
    padding: 6px 12px;
    border-radius: var(--radius-pill, 999px);
    background: var(--color-primary-50);
    border: 1px solid var(--color-primary-200);
    color: var(--color-primary-700);
    font-size: var(--font-size-caption);
  }

  .pillar-card {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-0);

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

    ul {
      margin: 0;
      padding-left: var(--space-4);
      color: var(--color-neutral-600);
      font-size: var(--font-size-body-small);
      line-height: var(--line-height-normal, 1.55);
    }
  }

  .hashtags-grid {
    display: grid;
    gap: var(--space-3);
  }

  @media (min-width: 900px) {
    .pillar-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .pillar-grid {
    display: grid;
    gap: var(--space-3);
  }
`

type BrandProfileMeta = Pick<BrandProfileResult, 'tokensUsed' | 'responseTime'> | null

type ContentBlueprintProps = {
  isComplete: boolean
  responses: OnboardingFormState
  selectedIntents: string[]
  onReturnToOnboarding: () => void
  brandProfile: BrandProfile | null
  brandProfileMeta: BrandProfileMeta
  brandProfileError: string | null
  isGeneratingBrandProfile: boolean
  onGenerateBrandProfile: () => void
}

export const ContentBlueprint: React.FC<ContentBlueprintProps> = ({
  isComplete,
  responses,
  selectedIntents,
  onReturnToOnboarding,
  brandProfile,
  brandProfileMeta,
  brandProfileError,
  isGeneratingBrandProfile,
  onGenerateBrandProfile
}) => {
  const contentPillars = buildContentPillars(responses)
  const qaPrompts = buildQaPrompts(responses)
  const intentPlaybook = buildIntentPlaybook(selectedIntents)
  const aiContentPillars = brandProfile?.content_pillars ?? []

  const renderKeywordGroup = (title: string, keywords: string[], keyPrefix: string) => (
    <div className="keyword-group" key={keyPrefix}>
      <h3>{title}</h3>
      {keywords.length > 0 ? (
        <ul className="keyword-list">
          {keywords.map((keyword) => (
            <li key={`${keyPrefix}-${keyword}`} className="keyword-pill">
              {keyword}
            </li>
          ))}
        </ul>
      ) : (
        <span className="brand-profile-meta">No entries yet.</span>
      )}
    </div>
  )

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
            <section className="brand-profile-section" aria-label="Brand strategy profile">
              <div className="section-header">
                <div>
                  <h3>Brand strategy profile</h3>
                  <p className="brand-profile-meta">
                    Gemini converts your onboarding answers into keywords, pillars, and hashtags.
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                  }}
                >
                  {brandProfileMeta && (brandProfileMeta.tokensUsed || brandProfileMeta.responseTime) && (
                    <span className="brand-profile-meta">
                      {brandProfileMeta.tokensUsed ? `${brandProfileMeta.tokensUsed} tokens` : null}
                      {brandProfileMeta.tokensUsed && brandProfileMeta.responseTime ? ' • ' : ''}
                      {brandProfileMeta.responseTime ? `${brandProfileMeta.responseTime}ms` : null}
                    </span>
                  )}
                  <Button
                    variant={brandProfile ? 'secondary' : 'primary'}
                    onClick={onGenerateBrandProfile}
                    disabled={isGeneratingBrandProfile}
                  >
                    {isGeneratingBrandProfile
                      ? brandProfile
                        ? 'Refreshing…'
                        : 'Generating…'
                      : brandProfile
                        ? 'Regenerate profile'
                        : 'Generate profile'}
                  </Button>
                </div>
              </div>
              {brandProfileError && <div className="error-banner">{brandProfileError}</div>}
              {brandProfile ? (
                <div className="brand-profile-grid">
                  {isGeneratingBrandProfile && (
                    <span className="brand-profile-meta">Refreshing profile…</span>
                  )}
                  <div className="keyword-grid">
                    {renderKeywordGroup('Core keywords', brandProfile.core_keywords, 'core')}
                    {renderKeywordGroup('Audience keywords', brandProfile.audience_keywords, 'audience')}
                    {renderKeywordGroup(
                      'Problem-aware keywords',
                      brandProfile.problem_aware_keywords,
                      'problem'
                    )}
                    {renderKeywordGroup(
                      'Solution-aware keywords',
                      brandProfile.solution_aware_keywords,
                      'solution'
                    )}
                  </div>
                  <div className="pillar-grid">
                    {(aiContentPillars.length > 0 ? aiContentPillars : brandProfile.content_pillars).map(
                      (pillar) => (
                        <div key={pillar.pillar_name} className="pillar-card">
                          <h4>{pillar.pillar_name}</h4>
                          <p>{pillar.description}</p>
                          <ul>
                            {pillar.suggested_themes.map((theme) => (
                              <li key={`${pillar.pillar_name}-${theme}`}>{theme}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                  <div className="hashtags-grid">
                    {renderKeywordGroup(
                      'Suggested hashtags (broad)',
                      brandProfile.suggested_hashtags?.broad ?? [],
                      'hashtag-broad'
                    )}
                    {renderKeywordGroup(
                      'Suggested hashtags (niche)',
                      brandProfile.suggested_hashtags?.niche ?? [],
                      'hashtag-niche'
                    )}
                    {renderKeywordGroup(
                      'Suggested hashtags (community)',
                      brandProfile.suggested_hashtags?.community ?? [],
                      'hashtag-community'
                    )}
                  </div>
                </div>
              ) : isGeneratingBrandProfile ? (
                <span className="brand-profile-meta">Generating brand profile…</span>
              ) : (
                <div className="empty-state">
                  <p>
                    Generate your brand strategy profile to translate onboarding insights into
                    actionable themes.
                  </p>
                  <Button variant="primary" onClick={onGenerateBrandProfile}>
                    Generate brand profile
                  </Button>
                </div>
              )}
            </section>

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
