import React, { useEffect, useMemo, useRef, useState } from 'react'
import { css } from '@emotion/react'
import StopwatchIcon from '@atlaskit/icon/glyph/stopwatch'
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play'
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left'
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right'
import { Badge } from '../../../components/ui/Badge'
import { BasicModal } from '../../../components/ui/BasicModal'
import { Button } from '../../../components/ui/Button'
import { onboardingPrompts } from '../constants/onboarding'
import { useSpeechTranscription } from '../hooks/useSpeechTranscription'
import { formatTime } from '../utils/time'
import {
  OnboardingFormState,
  OnboardingPrompt,
  OnboardingSessionBoundary,
  OnboardingSessionStatus
} from '../types/brandHub'

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

  .milestone-banner {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 10px 14px;
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-success-200);
    background: var(--color-success-50);
    color: var(--color-success-700);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    width: fit-content;
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

type OnboardingModalProps = {
  open: boolean
  onClose: () => void
  activeQuestionIndex: number
  setActiveQuestionIndex: (index: number) => void
  responses: OnboardingFormState
  setResponse: (id: keyof OnboardingFormState, value: string) => void
  completedCount: number
  onComplete: () => void
  ensureSessionStarted: () => void
  registerBoundary: (boundary: OnboardingSessionBoundary) => void
  finalizeSession: (status: OnboardingSessionStatus) => void
  updateSessionTranscript: (transcript: string) => void
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onClose,
  activeQuestionIndex,
  setActiveQuestionIndex,
  responses,
  setResponse,
  completedCount,
  onComplete,
  ensureSessionStarted,
  registerBoundary,
  finalizeSession,
  updateSessionTranscript
}) => {
  const currentQuestion: OnboardingPrompt = onboardingPrompts[activeQuestionIndex]
  const totalQuestions = onboardingPrompts.length
  const isLastQuestion = activeQuestionIndex === totalQuestions - 1
  const showHalfwayMessage = completedCount >= 3
  const currentResponse = responses[currentQuestion.id] ?? ''

  const {
    liveTranscript,
    clearTranscript,
    isRecording,
    startRecording,
    stopRecording,
    elapsedSeconds,
    recordingError,
    sessionTranscript,
    setSegmentStartAtCurrentPosition
  } = useSpeechTranscription({
    transcript: currentResponse,
    onTranscriptChange: (value) => setResponse(currentQuestion.id, value)
  })

  const [hasRecordingStarted, setHasRecordingStarted] = useState(false)
  const lastStartedQuestionRef = useRef<keyof OnboardingFormState | null>(null)

  const handleClose = () => {
    if (hasRecordingStarted) {
      registerBoundary({
        questionId: currentQuestion.id,
        questionIndex: activeQuestionIndex,
        elapsedSeconds,
        timestamp: Date.now(),
        type: 'end'
      })
      finalizeSession('cancelled')
      setHasRecordingStarted(false)
    }
    stopRecording()
    onClose()
  }

  const handlePrevious = () => {
    if (hasRecordingStarted) {
      registerBoundary({
        questionId: currentQuestion.id,
        questionIndex: activeQuestionIndex,
        elapsedSeconds,
        timestamp: Date.now(),
        type: 'end'
      })
    }
    setActiveQuestionIndex(Math.max(activeQuestionIndex - 1, 0))
  }

  const handleNext = () => {
    if (isLastQuestion) {
      if (hasRecordingStarted) {
        registerBoundary({
          questionId: currentQuestion.id,
          questionIndex: activeQuestionIndex,
          elapsedSeconds,
          timestamp: Date.now(),
          type: 'end'
        })
        finalizeSession('completed')
        setHasRecordingStarted(false)
      }
      stopRecording()
      onComplete()
      return
    }

    if (hasRecordingStarted) {
      registerBoundary({
        questionId: currentQuestion.id,
        questionIndex: activeQuestionIndex,
        elapsedSeconds,
        timestamp: Date.now(),
        type: 'end'
      })
    }
    setActiveQuestionIndex(Math.min(activeQuestionIndex + 1, totalQuestions - 1))
  }

  useEffect(() => {
    if (!open) {
      setHasRecordingStarted(false)
      lastStartedQuestionRef.current = null
    }
  }, [open])

  useEffect(() => {
    updateSessionTranscript(sessionTranscript)
  }, [sessionTranscript, updateSessionTranscript])

  useEffect(() => {
    if (!open || !hasRecordingStarted) {
      return
    }

    const currentId = currentQuestion.id
    if (lastStartedQuestionRef.current === currentId) {
      return
    }

    registerBoundary({
      questionId: currentId,
      questionIndex: activeQuestionIndex,
      elapsedSeconds,
      timestamp: Date.now(),
      type: 'start'
    })
    setSegmentStartAtCurrentPosition({
      resetLiveTranscript: true,
      initialValue: responses[currentId] ?? ''
    })
    lastStartedQuestionRef.current = currentId
  }, [
    open,
    hasRecordingStarted,
    currentQuestion.id,
    activeQuestionIndex,
    elapsedSeconds,
    registerBoundary,
    responses,
    setSegmentStartAtCurrentPosition
  ])

  const handleStartRecording = async () => {
    if (isRecording) {
      return
    }
    ensureSessionStarted()
    setSegmentStartAtCurrentPosition({
      resetLiveTranscript: true,
      initialValue: responses[currentQuestion.id] ?? ''
    })
    setHasRecordingStarted(true)
    await startRecording()
  }

  const recordButtonLabel = useMemo(() => {
    if (isRecording) {
      return 'Recording in progress'
    }
    return hasRecordingStarted ? 'Resume recording' : 'Start recording'
  }, [hasRecordingStarted, isRecording])

  const canAdvance = useMemo(
    () => (responses[currentQuestion.id] ?? '').trim().length > 0,
    [currentQuestion.id, responses]
  )

  return (
    <BasicModal open={open} title="Interactive onboarding interview" onClose={handleClose} size="large">
      <div css={onboardingModalStyles}>
        <div className="modal-layout">
          <div className="question-panel">
            <div className="panel-header">
              <Badge variant="primary" size="small">
                Question {activeQuestionIndex + 1} of {totalQuestions}
              </Badge>
              <div className="timer-pill">
                <StopwatchIcon label="Timer" /> {formatTime(elapsedSeconds)}
                {isRecording ? ' · Recording' : hasRecordingStarted ? ' · Paused' : ' · Ready'}
              </div>
            </div>
            <div className="question-copy">
              <span className="question-prefix">Voice interview</span>
              <h3 className="prompt-text">{currentQuestion.prompt}</h3>
              {currentQuestion.helper && <p className="helper-text">{currentQuestion.helper}</p>}
              {showHalfwayMessage && <div className="milestone-banner">Great! You're halfway done!</div>}
              <div className="nav-cluster">
                <div className="arrow-stack">
                  <button
                    type="button"
                    className="nav-button"
                    onClick={handlePrevious}
                    disabled={activeQuestionIndex === 0}
                    aria-label="Previous question"
                  >
                    <ArrowLeftIcon label="" />
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    type="button"
                    className={`nav-button${canAdvance ? ' primary' : ''}`}
                    onClick={handleNext}
                    disabled={!canAdvance}
                    aria-label={isLastQuestion ? 'Finish onboarding' : 'Next question'}
                  >
                    <ArrowRightIcon label="" />
                    <span className="visually-hidden">
                      {isLastQuestion ? 'Finish onboarding' : 'Next question'}
                    </span>
                  </button>
                </div>
                <span className="powered">Powered by Gen.C</span>
              </div>
            </div>
            <div className="transcript-stream">
              <span className="stream-label">Live transcript</span>
              <div className="stream-output">
                {liveTranscript || 'Your words will appear here as you speak.'}
              </div>
            </div>
            {recordingError && <div className="error-banner">{recordingError}</div>}
            <div className="response-controls">
              <Button
                variant={isRecording ? 'secondary' : 'primary'}
                iconBefore={<VidPlayIcon label={recordButtonLabel} />}
                onClick={handleStartRecording}
                isDisabled={isRecording}
              >
                {recordButtonLabel}
              </Button>
              <Button variant="tertiary" onClick={clearTranscript} isDisabled={isRecording}>
                Clear response
              </Button>
            </div>
            <div className="panel-footer">
              <div className="progress-meta">
                {completedCount}/{totalQuestions} answered
              </div>
            </div>
          </div>
        </div>
        <div className="keyboard-hint">Tip: Speak naturally — you can always refine the text before moving on.</div>
      </div>
    </BasicModal>
  )
}
