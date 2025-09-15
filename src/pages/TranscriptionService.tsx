import React, { useState, useRef } from 'react';
import { css } from '@emotion/react';

// Atlassian Design System Icons
import MicrophoneIcon from '@atlaskit/icon/core/microphone';
import VideoIcon from '@atlaskit/icon/glyph/video-filled';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import PersonIcon from '@atlaskit/icon/glyph/person';
import CrossIcon from '@atlaskit/icon/glyph/cross';

import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { TranscriptionService } from '../services/transcription-service';
import type { TranscriptionResult } from '../services/transcription-service';

const pageStyles = css`
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  p {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const formStyles = css`
  margin-bottom: var(--space-8);

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 250px;

    .handle-icon {
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  }
`;

const statusStyles = css`
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  border-radius: var(--radius-large);
  border: var(--border-default);

  &.status-idle {
    background: var(--color-neutral-50);
    border-color: var(--color-neutral-200);
  }

  &.status-downloading {
    background: var(--color-information-50);
    border-color: var(--color-information-200);
  }

  &.status-transcribing {
    background: var(--color-warning-50);
    border-color: var(--color-warning-200);
  }

  &.status-complete {
    background: var(--color-success-50);
    border-color: var(--color-success-200);
  }

  &.status-error {
    background: var(--color-danger-50);
    border-color: var(--color-danger-200);
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);

    .status-title {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .stop-button {
      background: var(--color-danger-500);
      color: white;
      border: none;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-medium);
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--space-2);

      &:hover {
        background: var(--color-danger-600);
      }

      &:disabled {
        background: var(--color-neutral-400);
        cursor: not-allowed;
      }
    }
  }

  .status-text {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: var(--font-size-body-small);
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: var(--color-neutral-200);
    border-radius: var(--radius-pill);
    overflow: hidden;
    margin-top: var(--space-3);

    .progress-fill {
      height: 100%;
      background: var(--color-primary-500);
      transition: width 0.3s ease;
      border-radius: var(--radius-pill);
    }
  }
`;

const transcriptionStyles = css`
  .transcription-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);

    h3 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  .transcript-content {
    background: var(--color-surface);
    border: var(--border-default);
    border-radius: var(--radius-large);
    padding: var(--space-6);
    white-space: pre-wrap;
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-body-small);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-primary);
    max-height: 400px;
    overflow-y: auto;
  }

  .transcription-metadata {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-neutral-200);
    font-size: var(--font-size-caption);
    color: var(--color-text-secondary);

    .metadata-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-1);
    }
  }
`;

type ProcessStatus = 'idle' | 'downloading' | 'transcribing' | 'complete' | 'error';

interface ProcessState {
  status: ProcessStatus;
  message: string;
  progress: number;
  videoCount?: number;
  currentVideo?: number;
}

export const TranscriptionServicePage: React.FC = () => {
  const [creatorHandle, setCreatorHandle] = useState('');
  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle',
    message: 'Enter a creator handle to begin',
    progress: 0
  });
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const transcriptionService = new TranscriptionService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorHandle.trim() || isProcessing) return;

    setIsProcessing(true);
    setTranscriptionResult(null);
    abortControllerRef.current = new AbortController();

    try {
      setProcessState({
        status: 'downloading',
        message: `Fetching creator info and videos from @${creatorHandle}...`,
        progress: 10
      });

      const followResponse = await fetch('/api/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creatorHandle.replace('@', ''),
          platform: 'instagram'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!followResponse.ok) {
        throw new Error('Failed to fetch creator information');
      }

      const followData = await followResponse.json();

      // Check if videos are already included in the response (simplified workflow)
      if (!followData.videos || followData.videos.length === 0) {
        throw new Error('No videos found for this creator');
      }

      console.log(`📹 Found ${followData.videos.length} videos directly from creator API`);

      setProcessState({
        status: 'transcribing',
        message: `Transcribing ${followData.videos.length} videos...`,
        progress: 50,
        videoCount: followData.videos.length,
        currentVideo: 0
      });

      // Process the first video for transcription
      // Convert from our API format to the format expected by transcription service
      const firstVideo = {
        videoUrl: followData.videos[0].url || followData.videos[0].videoUrl,
        title: followData.videos[0].title,
        id: followData.videos[0].id
      };

      setProcessState(prev => ({
        ...prev,
        currentVideo: 1,
        progress: 70
      }));

      const result = await transcriptionService.transcribeFromUrl(
        firstVideo.videoUrl,
        'instagram'
      );

      setProcessState({
        status: 'complete',
        message: 'Transcription completed successfully!',
        progress: 100
      });

      if (result) {
        setTranscriptionResult(result);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setProcessState({
          status: 'idle',
          message: 'Process stopped by user',
          progress: 0
        });
      } else {
        setProcessState({
          status: 'error',
          message: error.message || 'An error occurred during processing',
          progress: 0
        });
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const getStatusClass = () => `status-${processState.status}`;

  const getStatusIcon = () => {
    switch (processState.status) {
      case 'downloading': return <DownloadIcon label="Downloading" />;
      case 'transcribing': return <MicrophoneIcon label="Transcribing" />;
      case 'complete': return <VideoIcon label="Complete" />;
      default: return <PersonIcon label="Ready" />;
    }
  };

  return (
    <div css={pageStyles}>
      <header css={headerStyles}>
        <h1>
          <MicrophoneIcon label="Transcription Service" />
          Video Transcription Service
        </h1>
        <p>Enter a creator's handle to download and transcribe their recent videos</p>
      </header>

      <Card>
        <form css={formStyles} onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-actions">
              <div className="input-container">
                <PersonIcon className="handle-icon" label="Creator handle" />
                <Input
                  type="text"
                  placeholder="Enter creator handle (e.g., username)"
                  value={creatorHandle}
                  onChange={(e) => setCreatorHandle(e.target.value)}
                  disabled={isProcessing}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!creatorHandle.trim() || isProcessing}
                iconBefore={<VideoIcon label="" />}
              >
                {isProcessing ? 'Processing...' : 'Start Transcription'}
              </Button>
            </div>
          </div>
        </form>

        <div css={statusStyles} className={getStatusClass()}>
          <div className="status-header">
            <h3 className="status-title">
              {getStatusIcon()}
              Status: {processState.status.charAt(0).toUpperCase() + processState.status.slice(1)}
            </h3>
            {isProcessing && (
              <button
                className="stop-button"
                onClick={handleStop}
                type="button"
              >
                <CrossIcon label="" size="small" />
                Stop Process
              </button>
            )}
          </div>
          <p className="status-text">{processState.message}</p>
          {processState.videoCount && (
            <p className="status-text">
              Processing video {processState.currentVideo} of {processState.videoCount}
            </p>
          )}
          {processState.progress > 0 && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${processState.progress}%` }}
              />
            </div>
          )}
        </div>

        {transcriptionResult && (
          <div css={transcriptionStyles}>
            <div className="transcription-header">
              <MicrophoneIcon label="Transcript" />
              <h3>Transcription Result</h3>
            </div>

            <div className="transcript-content">
              {transcriptionResult.transcript}
            </div>

            <div className="transcription-metadata">
              <div className="metadata-row">
                <span>Platform:</span>
                <span>{transcriptionResult.platform}</span>
              </div>
              <div className="metadata-row">
                <span>Provider:</span>
                <span>{transcriptionResult.transcriptionMetadata.method}</span>
              </div>
              <div className="metadata-row">
                <span>Processed:</span>
                <span>{new Date(transcriptionResult.transcriptionMetadata.processedAt).toLocaleString()}</span>
              </div>
              {transcriptionResult.transcriptionMetadata.fileName && (
                <div className="metadata-row">
                  <span>File:</span>
                  <span>{transcriptionResult.transcriptionMetadata.fileName}</span>
                </div>
              )}
              {transcriptionResult.contentMetadata?.author && (
                <div className="metadata-row">
                  <span>Creator:</span>
                  <span>{transcriptionResult.contentMetadata.author}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};