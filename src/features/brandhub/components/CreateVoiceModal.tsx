import React, { useCallback, useEffect, useRef, useState } from 'react'
import { css } from '@emotion/react'
import DownloadIcon from '@atlaskit/icon/glyph/download'
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle'
import { BasicModal } from '../../../components/ui/BasicModal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { platformOptions, mockVideos } from '../constants/brandVoices'

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
  onCreateDraft?: () => void
}

const FETCH_DELAY = 700
const ANALYZE_DELAY = 900

export const CreateVoiceModal: React.FC<CreateVoiceModalProps> = ({ open, onClose, onCreateDraft }) => {
  const [creatorInput, setCreatorInput] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof platformOptions)[number]>(
    platformOptions[0]
  )
  const [selectedCreator, setSelectedCreator] = useState('')
  const [hasFetchedVideos, setHasFetchedVideos] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const fetchTimerRef = useRef<number | null>(null)
  const analyzeTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (fetchTimerRef.current && typeof window !== 'undefined') {
      window.clearTimeout(fetchTimerRef.current)
    }
    if (analyzeTimerRef.current && typeof window !== 'undefined') {
      window.clearTimeout(analyzeTimerRef.current)
    }
    fetchTimerRef.current = null
    analyzeTimerRef.current = null
  }, [])

  const resetState = useCallback(() => {
    setCreatorInput('')
    setSelectedPlatform(platformOptions[0])
    setSelectedCreator('')
    setHasFetchedVideos(false)
    setIsFetching(false)
    setIsAnalyzing(false)
    setAnalysisComplete(false)
  }, [])

  useEffect(() => {
    if (!open) {
      clearTimers()
      resetState()
    }
  }, [clearTimers, open, resetState])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handleFetchVideos = () => {
    if (!creatorInput.trim()) return
    clearTimers()
    setIsFetching(true)
    setSelectedCreator(creatorInput.trim().replace(/^@/, ''))
    setHasFetchedVideos(false)
    setAnalysisComplete(false)

    if (typeof window === 'undefined') {
      setIsFetching(false)
      setHasFetchedVideos(true)
      return
    }

    fetchTimerRef.current = window.setTimeout(() => {
      setIsFetching(false)
      setHasFetchedVideos(true)
    }, FETCH_DELAY)
  }

  const handleAnalyzeVideos = () => {
    if (!hasFetchedVideos) return
    clearTimers()
    setIsAnalyzing(true)
    setAnalysisComplete(false)

    if (typeof window === 'undefined') {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      return
    }

    analyzeTimerRef.current = window.setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, ANALYZE_DELAY)
  }

  const handleClose = () => {
    clearTimers()
    onClose()
  }

  const handleCreateDraft = () => {
    if (!analysisComplete) {
      return
    }
    onCreateDraft?.()
    handleClose()
  }

  const modalFooter = (
    <>
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        iconBefore={<DownloadIcon label="" />}
        onClick={handleAnalyzeVideos}
        isDisabled={!hasFetchedVideos}
        isLoading={isAnalyzing}
      >
        {analysisComplete ? 'Re-run analysis' : 'Analyze videos'}
      </Button>
      <Button variant="creative" onClick={handleCreateDraft} isDisabled={!analysisComplete}>
        Create voice draft
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
              Paste a creator link or @handle, choose the platform, and load their latest videos for
              analysis.
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
              <Button variant="subtle" size="small" onClick={handleFetchVideos} isLoading={isFetching}>
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
                      We&apos;ll analyze the hook, pacing, call to action, and transcript sentiment.
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
              <li>Top hooks revolve around social proof and transparent build-in-public lessons.</li>
              <li>Tone scores balance optimistic coaching with tactical specificity.</li>
              <li>Audience questions lean toward launch sequencing and content consistency.</li>
            </ul>
          </div>
        )}
      </div>
    </BasicModal>
  )
}
