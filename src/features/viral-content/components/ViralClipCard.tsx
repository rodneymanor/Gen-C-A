import React from 'react';
import { css } from '@emotion/react';
import {
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashCardSubtitle,
} from '@/components/gc-dash';
import MediaServicesPresentationIcon from '@atlaskit/icon/glyph/media-services/presentation';
import AddIcon from '@atlaskit/icon/glyph/add';
import PlayIcon from '@atlaskit/icon/glyph/vid-play';
import type { ViralMetric, ViralVideo } from '../types';
import { PLATFORM_EMOJI, PLATFORM_LABELS } from '../constants/feed';

export interface ViralClipCardProps {
  video: ViralVideo;
  onOpen?: (video: ViralVideo) => void;
  onFindSimilar?: (video: ViralVideo) => void;
  onAddToProject?: (video: ViralVideo) => void;
  onPlay?: (video: ViralVideo) => void;
}

const cardStyles = css`
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  border: 1px solid rgba(9, 30, 66, 0.08);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(11, 92, 255, 0.35);
    box-shadow: 0 24px 48px rgba(9, 30, 66, 0.18);
  }

  &:hover .viral-clip-actions {
    opacity: 1;
    pointer-events: auto;
  }
`;

const thumbnailWrapperStyles = css`
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(9, 30, 66, 0.06);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.24s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
`;

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
`;

const overlayStyles = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(9, 30, 66, 0) 32%, rgba(9, 30, 66, 0.66));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
`;

const bodyStyles = css`
  display: grid;
  gap: 12px;
  padding: 16px 18px 20px;
`;

const captionStyles = css`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(9, 30, 66, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const creatorStyles = css`
  font-size: 13px;
  color: rgba(9, 30, 66, 0.55);
  font-weight: 500;
`;

const metricRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const metricChipStyles = (tone: string | undefined) => {
  const palette: Record<string, { bg: string; color: string }> = {
    primary: { bg: 'rgba(11, 92, 255, 0.12)', color: 'rgba(11, 92, 255, 1)' },
    success: { bg: 'rgba(0, 158, 115, 0.12)', color: 'rgba(0, 134, 83, 1)' },
    warning: { bg: 'rgba(255, 139, 0, 0.12)', color: 'rgba(191, 87, 0, 1)' },
    danger: { bg: 'rgba(225, 60, 60, 0.12)', color: 'rgba(191, 38, 0, 1)' },
    neutral: { bg: 'rgba(9, 30, 66, 0.08)', color: 'rgba(9, 30, 66, 0.7)' },
  };
  const { bg, color } = palette[tone ?? 'neutral'];

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
  `;
};

const actionsButtonStyles = css`
  pointer-events: auto;
  min-width: 180px;
`;

export const ViralClipCard: React.FC<ViralClipCardProps> = ({
  video,
  onOpen,
  onFindSimilar,
  onAddToProject,
  onPlay,
}) => {
  const handleOpen = () => {
    if (onOpen) {
      onOpen(video);
    }
  };

  const handleFindSimilar = (event: React.MouseEvent) => {
    event.stopPropagation();
    onFindSimilar?.(video);
  };

  const handleAdd = (event: React.MouseEvent) => {
    event.stopPropagation();
    onAddToProject?.(video);
  };

  const handlePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onPlay) {
      onPlay(video);
    } else if (onOpen) {
      onOpen(video);
    }
  };

  return (
    <GcDashCard interactive css={cardStyles} onClick={handleOpen}>
      <div css={thumbnailWrapperStyles}>
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <span css={platformBadgeStyles}>
          {PLATFORM_EMOJI[video.platform]} {PLATFORM_LABELS[video.platform]}
        </span>
        <div css={overlayStyles} className="viral-clip-actions">
          <GcDashButton
            variant="primary"
            size="sm"
            leadingIcon={<MediaServicesPresentationIcon label="" />}
            css={actionsButtonStyles}
            onClick={handleFindSimilar}
          >
            More like this
          </GcDashButton>
          <GcDashButton
            variant="secondary"
            size="sm"
            leadingIcon={<AddIcon label="" />}
            css={actionsButtonStyles}
            onClick={handleAdd}
          >
            Add to project
          </GcDashButton>
          <GcDashButton
            variant="ghost"
            size="sm"
            leadingIcon={<PlayIcon label="" />}
            css={actionsButtonStyles}
            onClick={handlePlay}
          >
            Play video
          </GcDashButton>
        </div>
      </div>
      <GcDashCardBody css={bodyStyles}>
        <GcDashCardSubtitle css={captionStyles}>{video.description}</GcDashCardSubtitle>
        <span css={creatorStyles}>{video.creator}</span>
        <div css={metricRowStyles}>
          {video.metrics.map((metricItem) => (
            <span key={metricItem.id} css={metricChipStyles(metricItem.tone)}>
              {metricItem.label}: {metricItem.value}
            </span>
          ))}
        </div>
      </GcDashCardBody>
    </GcDashCard>
  );
};

export default ViralClipCard;
