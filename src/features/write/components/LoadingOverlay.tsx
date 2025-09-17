import { css } from '@emotion/react'

interface LoadingOverlayProps {
  isOpen: boolean
  stage?: string
  progress?: number
  estimatedTime?: number
}

const overlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .loading-content {
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-large);
    padding: var(--space-8);
    text-align: center;
    max-width: 400px;
    margin: var(--space-4);

    .loading-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
      animation: pulse 2s infinite;
    }

    .loading-title {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }

    .loading-stage {
      font-size: var(--font-size-body);
      color: var(--color-neutral-600);
      margin: 0 0 var(--space-4) 0;
    }

    .loading-progress {
      width: 100%;
      height: 8px;
      background: var(--color-neutral-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--space-2);

      .progress-bar {
        height: 100%;
        background: var(--color-primary-500);
        transition: width 0.3s ease;
      }
    }

    .loading-eta {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-500);
      margin: 0;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`

export const LoadingOverlay = ({ isOpen, stage, progress, estimatedTime }: LoadingOverlayProps) => {
  if (!isOpen) return null

  return (
    <div css={overlayStyles}>
      <div className="loading-content">
        <div className="loading-icon" aria-hidden="true">
          ✨
        </div>
        <h2 className="loading-title">Generating Your Script</h2>
        <p className="loading-stage">{stage ?? 'AI is crafting your perfect script...'}</p>

        <div className="loading-progress">
          <div
            className="progress-bar"
            style={{ width: `${Math.max(10, Math.min(progress ?? 100, 100))}%` }}
          />
        </div>

        <p className="loading-eta">
          {typeof estimatedTime === 'number'
            ? `Approximately ${Math.max(0, Math.round(estimatedTime))} seconds remaining`
            : 'This usually takes a few seconds'}
        </p>
      </div>
    </div>
  )
}
