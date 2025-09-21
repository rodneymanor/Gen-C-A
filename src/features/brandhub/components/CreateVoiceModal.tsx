import React, { useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@emotion/react'
import DownloadIcon from '@atlaskit/icon/glyph/download'
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle'
import { BasicModal } from '../../../components/ui/BasicModal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { platformOptions } from '../constants/brandVoices'
import { PlatformType, VoiceWorkflowState, WorkflowStatus } from '../types/voiceWorkflow'

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

  .status-list {
    display: grid;
    gap: var(--space-2);
  }

  .status-item {
    display: grid;
    gap: 4px;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    background: var(--color-neutral-50);
    font-size: var(--font-size-body-small);
  }

  .status-item .status-label {
    color: var(--color-neutral-700);
    font-weight: var(--font-weight-medium);
  }

  .status-item .status-state {
    font-weight: var(--font-weight-semibold);
  }

  .status-item.pending .status-state {
    color: var(--color-neutral-500);
  }

  .status-item.running .status-state {
    color: var(--color-primary-500);
  }

  .status-item.success .status-state {
    color: var(--color-success-600);
  }

  .status-item.error {
    border-color: var(--color-danger-200);
    background: var(--color-danger-50);
  }

  .status-item.error .status-state {
    color: var(--color-danger-600);
  }

  .status-message {
    margin-top: var(--space-1);
    font-size: var(--font-size-caption);
    color: var(--color-danger-600);
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

  .error-banner {
    padding: var(--space-3);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-danger-200);
    background: var(--color-danger-50);
    color: var(--color-danger-600);
    font-size: var(--font-size-body-small);
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

type CreateVoiceModalProps = {
  open: boolean
  onClose: () => void
  workflow: VoiceWorkflowState
  videos: Array<{
    id: string
    title: string
    duration: string
    performance: string
    postedAt: string
  }>
  displayHandle: string
  onFetchVideos: (input: string, platform: PlatformType) => Promise<void>
  onAnalyzeVideos: () => Promise<void>
  onCreatePersona: () => Promise<void>
}

export const CreateVoiceModal: React.FC<CreateVoiceModalProps> = ({
  open,
  onClose,
  workflow,
  videos,
  displayHandle,
  onFetchVideos,
  onAnalyzeVideos,
  onCreatePersona
}) => {
  const [creatorInput, setCreatorInput] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof platformOptions)[number]>(
    platformOptions[0]
  )
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const creatorInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      setCreatorInput('')
      setSelectedPlatform(platformOptions[0])
      setStatusMessage(null)
      return
    }

    const node = creatorInputRef.current
    if (!node) {
      return
    }

    const removeForcedFocus = () => {
      node.classList.remove('force-focus-visible')
    }

    const timer = window.setTimeout(() => {
      node.classList.add('force-focus-visible')
      node.focus({ preventScroll: true })
      node.addEventListener('blur', removeForcedFocus, { once: true })
    }, 30)

    return () => {
      window.clearTimeout(timer)
      node.removeEventListener('blur', removeForcedFocus)
      node.classList.remove('force-focus-visible')
    }
  }, [open])

  const hasFetchedVideos = workflow.step1.status === 'success'
  const isFetching = workflow.step1.status === 'running'
  const isAnalyzing = workflow.step2.status === 'running' || workflow.step3.status === 'running'
  const analysisComplete = workflow.step3.status === 'success'
  const isSaving = workflow.step5.status === 'running'
  const saveSuccess = workflow.step5.status === 'success'

  const resolvePlatformType = (): 'tiktok' | 'instagram' => {
    if (selectedPlatform.toLowerCase().includes('instagram')) return 'instagram'
    if (selectedPlatform.toLowerCase().includes('tiktok')) return 'tiktok'
    throw new Error('Unsupported platform')
  }

  const handleFetchVideos = async () => {
    setStatusMessage(null)
    if (!creatorInput.trim()) {
      setStatusMessage('Enter a creator username or URL to continue.')
      return
    }

    let platformType: 'tiktok' | 'instagram'
    try {
      platformType = resolvePlatformType()
    } catch (platformError) {
      setStatusMessage('YouTube Shorts is not supported yet.')
      return
    }

    try {
      await onFetchVideos(creatorInput, platformType)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleAnalyzeVideos = async () => {
    setStatusMessage(null)
    try {
      await onAnalyzeVideos()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleCreatePersona = async () => {
    setStatusMessage(null)
    try {
      await onCreatePersona()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleClose = () => {
    if (isFetching || isAnalyzing || isSaving) {
      return
    }
    onClose()
  }

  const statusItems = useMemo(
    () => [
      {
        label: 'Step 1 · Fetch latest videos',
        state: workflow.step1,
        detail:
          workflow.step1.status === 'success' && workflow.step1.data?.videoCount
            ? `${workflow.step1.data.videoCount} videos`
            : undefined
      },
      {
        label: 'Step 2 · Transcribe videos',
        state: workflow.step2,
        detail:
          workflow.step2.status === 'success' && workflow.step2.data?.transcripts
            ? `${workflow.step2.data.transcripts} transcripts`
            : undefined
      },
      {
        label: 'Step 3 · Analyze voice patterns',
        state: workflow.step3,
        detail:
          workflow.step3.status === 'success' && workflow.step3.data
            ? `${workflow.step3.data.hooks ?? 0} hooks · ${workflow.step3.data.ctas ?? 0} CTAs`
            : undefined
      },
      {
        label: 'Step 4 · Save persona',
        state: workflow.step5,
        detail: workflow.step5.status === 'success' ? 'Saved to voice library' : undefined
      }
    ],
    [workflow]
  )

  const getStatusText = (status: WorkflowStatus) => {
    switch (status) {
      case 'running':
        return 'Running...'
      case 'success':
        return 'Complete'
      case 'error':
        return 'Error'
      default:
        return 'Ready'
    }
  }

  const modalFooter = (
    <>
      <Button
        variant="secondary"
        onClick={handleClose}
        isDisabled={isFetching || isAnalyzing || isSaving}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        iconBefore={<DownloadIcon label="" />}
        onClick={handleAnalyzeVideos}
        isDisabled={!hasFetchedVideos || isAnalyzing || isSaving}
        isLoading={isAnalyzing}
      >
        {analysisComplete ? 'Re-run analysis' : 'Analyze videos'}
      </Button>
      <Button
        variant="creative"
        onClick={handleCreatePersona}
        isDisabled={!analysisComplete || isSaving}
        isLoading={isSaving}
      >
        {saveSuccess ? 'Saved' : 'Create voice draft'}
      </Button>
    </>
  )

  return (
    <BasicModal open={open} title="Create a new brand voice" onClose={handleClose} footer={modalFooter}>
      <div css={modalBodyStyles}>
        <div className="field-group">
          <span className="field-label">Creator URL or username</span>
          <Input
            placeholder="https://www.tiktok.com/@creator-handle"
            value={creatorInput}
            onChange={(event) => setCreatorInput(event.target.value)}
            disabled={isFetching || isAnalyzing || isSaving}
            ref={creatorInputRef}
          />
          <span className="helper">
            We&apos;ll grab the most recent 12 videos, transcripts, and style signals ready for persona creation.
          </span>
        </div>

        <div className="field-group">
          <span className="field-label">Primary platform</span>
          <div className="platform-options">
            {platformOptions.map((platform) => {
              const isActive = selectedPlatform === platform
              const isUnsupported = platform.toLowerCase().includes('youtube')
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => !isUnsupported && setSelectedPlatform(platform)}
                  css={intentChipStyles(isActive)}
                  disabled={isUnsupported || isFetching || isAnalyzing || isSaving}
                  title={isUnsupported ? 'YouTube Shorts support coming soon' : undefined}
                >
                  {platform}
                </button>
              )
            })}
          </div>
        </div>

        {statusMessage && <div className="error-banner">{statusMessage}</div>}

        <div className="status-list">
          {statusItems.map(({ label, state, detail }) => (
            <div key={label} className={`status-item ${state.status}`}>
              <div className="status-label">{label}</div>
              <div className="status-state">
                {getStatusText(state.status)}
                {detail ? ` · ${detail}` : ''}
              </div>
              {state.status === 'error' && state.message && (
                <div className="status-message">{state.message}</div>
              )}
            </div>
          ))}
        </div>

        {!hasFetchedVideos ? (
          <div className="empty-state">
            <p>
              Paste a creator link or @handle, choose the platform, and load their latest videos for analysis.
            </p>
            <Button
              variant="primary"
              iconBefore={<DownloadIcon label="" />}
              onClick={handleFetchVideos}
              isDisabled={!creatorInput || isFetching || isAnalyzing || isSaving}
              isLoading={isFetching}
            >
              Fetch latest videos
            </Button>
          </div>
        ) : (
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
                  {displayHandle || creatorInput || '—'} · {selectedPlatform}
                </p>
              </div>
              <Button
                variant="subtle"
                size="small"
                onClick={handleFetchVideos}
                isLoading={isFetching}
                isDisabled={isFetching || isAnalyzing || isSaving}
              >
                Refresh pull
              </Button>
            </div>

            <div className="video-list">
              {videos.map((video) => (
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
                      We&apos;ll analyze the hook, pacing, and calls-to-action from each transcript.
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
              <li>{workflow.step3.data?.transcripts ?? videos.length} transcripts analyzed.</li>
              <li>{workflow.step3.data?.hooks ?? 0} hook templates mapped for reuse.</li>
              <li>{workflow.step3.data?.ctas ?? 0} call-to-action patterns captured.</li>
            </ul>
          </div>
        )}

        {saveSuccess && (
          <div className="analysis-summary">
            <h4>
              <CheckCircleIcon label="Persona saved" /> Persona saved
            </h4>
            <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
              Brand voice saved to your library. Refresh the voice list if it does not appear automatically.
            </p>
          </div>
        )}
      </div>
    </BasicModal>
  )
}
