import React from 'react'
import { css } from '@emotion/react'
import { GcDashButton, GcDashCard, GcDashCardBody } from '@/components/gc-dash'
import MediaServicesPresentationIcon from '@atlaskit/icon/glyph/media-services/presentation'
import AddIcon from '@atlaskit/icon/glyph/add'
import PlayIcon from '@atlaskit/icon/glyph/vid-play'
import DetailViewIcon from '@atlaskit/icon/glyph/detail-view'
import LikeIcon from '@atlaskit/icon/glyph/like'
import CommentIcon from '@atlaskit/icon/glyph/comment'
import type { ViralVideo } from '../types'
import { PLATFORM_EMOJI, PLATFORM_LABELS } from '../constants/feed'

export interface ViralClipCardAction {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  isLoading?: boolean
  onClick?: (video: ViralVideo, event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface ViralClipCardProps {
  video: ViralVideo
  onOpen?: (video: ViralVideo) => void
  onViewInsights?: (video: ViralVideo) => void
  onAddToProject?: (video: ViralVideo) => void
  onPlay?: (video: ViralVideo) => void
  overlayActions?: ViralClipCardAction[]
}

const cardStyles = css`
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(9, 30, 66, 0.08);
  background: rgba(255, 255, 255, 0.96);
  transition:
    border-color 0.24s ease,
    background 0.24s ease,
    filter 0.24s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(120% 120% at 50% 0%, rgba(250, 252, 255, 0.9), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.28s ease;
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    border-color: rgba(11, 92, 255, 0.38);
    background: rgba(250, 253, 255, 0.98);
    filter: saturate(1.04);
  }

  &:hover::before,
  &:focus-visible::before {
    opacity: 1;
  }

  &:hover .viral-clip-actions,
  &:focus-visible .viral-clip-actions {
    opacity: 1;
    pointer-events: auto;
  }
`

const verticalThumbnailStyles = css`
  position: relative;
  aspect-ratio: 9 / 16;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(9, 30, 66, 0.06);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const horizontalThumbnailStyles = css`
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(9, 30, 66, 0.06);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const platformBadgeStyles = css`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 6px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(6px);
`

const transcriptionBadgeStyles = css`
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(11, 92, 255, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  box-shadow: 0 12px 24px rgba(11, 92, 255, 0.28);
`

const newBadgeStyles = css`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(11, 92, 255, 0.92);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 4px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  box-shadow: 0 10px 16px rgba(11, 92, 255, 0.28);
`

const overlayStyles = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(9, 30, 66, 0.05) 20%, rgba(9, 30, 66, 0.28) 90%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.24s ease;
`

const bodyStyles = css`
  display: grid;
  gap: 12px;
  padding: 16px 18px 20px;
`

const titleStyles = css`
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 700;
  color: rgba(9, 30, 66, 0.9);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const creatorStyles = css`
  font-size: 13px;
  color: rgba(9, 30, 66, 0.55);
  font-weight: 500;
`

const youtubeDescriptionStyles = css`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(9, 30, 66, 0.68);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const metricRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const metricPalette = (tone: string | undefined) => {
  const palette: Record<string, { bg: string; color: string }> = {
    primary: { bg: 'rgba(11, 92, 255, 0.12)', color: 'rgba(11, 92, 255, 1)' },
    success: { bg: 'rgba(0, 158, 115, 0.12)', color: 'rgba(0, 134, 83, 1)' },
    warning: { bg: 'rgba(255, 139, 0, 0.12)', color: 'rgba(191, 87, 0, 1)' },
    danger: { bg: 'rgba(225, 60, 60, 0.12)', color: 'rgba(191, 38, 0, 1)' },
    neutral: { bg: 'rgba(9, 30, 66, 0.08)', color: 'rgba(9, 30, 66, 0.7)' }
  }
  return palette[tone ?? 'neutral']
}

const metricChipStyles = (tone: string | undefined) => {
  const { bg, color } = metricPalette(tone)
  return css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${bg};
    color: ${color};
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    border-radius: 10px;
    padding: 4px 10px;
  `
}

const actionsButtonStyles = css`
  pointer-events: auto;
  min-width: 180px;
`

const metricIconComponents: Record<
  string,
  React.ComponentType<{ label: string; size?: 'small' | 'medium' | 'large'; primaryColor?: string }>
> = {
  views: DetailViewIcon,
  likes: LikeIcon,
  comments: CommentIcon
}

export const ViralClipCard: React.FC<ViralClipCardProps> = ({
  video,
  onOpen,
  onViewInsights,
  onAddToProject,
  onPlay,
  overlayActions
}) => {
  const isYoutube = video.platform === 'youtube'
  const thumbnailWrapperStyles = isYoutube ? horizontalThumbnailStyles : verticalThumbnailStyles
  const isTranscribing = video.transcriptionStatus === 'processing' || video.transcriptionStatus === 'pending'

  const handleOpen = () => {
    if (onViewInsights) {
      onViewInsights(video)
      return
    }
    if (onOpen) {
      onOpen(video)
    }
  }

  const handleViewInsights = () => {
    onViewInsights?.(video)
  }

  const handleAdd = () => {
    onAddToProject?.(video)
  }

  const handlePlay = () => {
    if (onPlay) {
      onPlay(video)
    } else if (onOpen) {
      onOpen(video)
    }
  }

  const defaultActions: ViralClipCardAction[] = []

  if (onViewInsights) {
    defaultActions.push({
      id: 'view-insights',
      label: 'View insights',
      icon: <MediaServicesPresentationIcon label="" />,
      variant: 'primary',
      onClick: () => handleViewInsights()
    })
  }

  if (onAddToProject) {
    defaultActions.push({
      id: 'add-to-project',
      label: 'Add to project',
      icon: <AddIcon label="" />,
      variant: 'secondary',
      onClick: () => handleAdd()
    })
  }

  if (onPlay || onOpen) {
    defaultActions.push({
      id: 'play-video',
      label: 'Play video',
      icon: <PlayIcon label="" />,
      variant: 'ghost',
      onClick: () => handlePlay()
    })
  }

  const actionsToRender = overlayActions && overlayActions.length > 0 ? overlayActions : defaultActions

  return (
    <GcDashCard interactive css={cardStyles} onClick={handleOpen}>
      <div css={thumbnailWrapperStyles}>
        {video.isNew ? <span css={newBadgeStyles}>New</span> : null}
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <span css={platformBadgeStyles}>
          {PLATFORM_EMOJI[video.platform]} {PLATFORM_LABELS[video.platform]}
        </span>
        {isTranscribing ? <span css={transcriptionBadgeStyles}>⏳ Transcribing…</span> : null}
        {actionsToRender.length > 0 && (
          <div css={overlayStyles} className="viral-clip-actions">
            {actionsToRender.map((action) => (
              <GcDashButton
                key={action.id}
                variant={action.variant ?? 'primary'}
                size="small"
                leadingIcon={action.icon}
                css={actionsButtonStyles}
                onClick={(event) => {
                  event.stopPropagation()
                  action.onClick?.(video, event)
                }}
                disabled={action.disabled ?? !action.onClick}
                isLoading={action.isLoading}
              >
                {action.label}
              </GcDashButton>
            ))}
          </div>
        )}
      </div>
      <GcDashCardBody css={bodyStyles}>
        <h3 css={titleStyles}>{video.title}</h3>
        <span css={creatorStyles}>{video.creator}</span>
        {video.platform === 'youtube' && video.description ? (
          <p css={youtubeDescriptionStyles}>{video.description}</p>
        ) : null}
        <div css={metricRowStyles}>
          {video.metrics.map((metricItem) => {
            const IconComponent = metricIconComponents[metricItem.id.toLowerCase()]
            const { color } = metricPalette(metricItem.tone)
            return (
              <span key={metricItem.id} css={metricChipStyles(metricItem.tone)}>
                {IconComponent ? (
                  <IconComponent label="" size="small" primaryColor={color} />
                ) : (
                  <span>{metricItem.label}</span>
                )}
                <span>{metricItem.value}</span>
              </span>
            )
          })}
        </div>
      </GcDashCardBody>
    </GcDashCard>
  )
}

export default ViralClipCard
