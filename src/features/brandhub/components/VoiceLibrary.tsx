import React from 'react'
import { css } from '@emotion/react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/ui/Card'
import { BrandVoice } from '../types/brandHub'

const voiceLibraryStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);

  .voice-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-4);
  }

  .loading-state,
  .error-state {
    padding: var(--space-5);
    border-radius: var(--radius-medium);
    border: 1px dashed var(--color-neutral-200);
    background: var(--color-neutral-50);
    text-align: center;
    color: var(--color-neutral-600);
  }

  .loading-state {
    display: grid;
    gap: var(--space-2);
    justify-items: center;
  }

  .error-state {
    border-color: var(--color-danger-200);
    background: var(--color-danger-50);
    color: var(--color-danger-600);
    display: grid;
    gap: var(--space-3);
    justify-items: center;
  }

  .empty-voices {
    padding: var(--space-5);
    border-radius: var(--radius-medium);
    border: 1px dashed var(--color-neutral-200);
    background: var(--color-neutral-50);
    display: grid;
    gap: var(--space-3);
    justify-items: center;
    text-align: center;

    h3 {
      margin: 0;
      font-size: var(--font-size-h5);
      color: var(--color-neutral-800);
    }

    p {
      margin: 0;
      color: var(--color-neutral-600);
      font-size: var(--font-size-body);
      max-width: 420px;
    }
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

type VoiceLibraryProps = {
  brandVoices: BrandVoice[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onCreateVoice: () => void
  onOpenVoice?: (voiceId: string) => void
  onSetActive?: (voiceId: string) => void
}

export const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  brandVoices,
  isLoading,
  error,
  onRefresh,
  onCreateVoice,
  onOpenVoice,
  onSetActive
}) => (
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
            Activate the voice that matches today&apos;s campaign. Each workspace stores scripts, hooks,
            and tone notes.
          </p>
        </div>
        <Badge variant="primary">{brandVoices.length} total</Badge>
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="loading-state">
          <span aria-hidden="true">🔄</span>
          <p>Loading brand voice workspaces…</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <Button variant="secondary" size="small" onClick={onRefresh}>
            Try again
          </Button>
        </div>
      ) : brandVoices.length === 0 ? (
        <div className="empty-voices">
          <h3>Create your first brand voice</h3>
          <p>
            Run a creator analysis to capture templates, tonal cues, and publishing guidance in a
            dedicated workspace.
          </p>
          <Button variant="primary" onClick={onCreateVoice}>
            Create brand voice
          </Button>
        </div>
      ) : (
        <div className="voice-grid">
          {brandVoices.map((voice) => (
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
                <Button variant="secondary" size="small" onClick={() => onOpenVoice?.(voice.id)}>
                  Open voice workspace
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => onSetActive?.(voice.id)}
                >
                  Set active
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)
