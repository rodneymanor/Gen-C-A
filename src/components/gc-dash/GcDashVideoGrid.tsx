import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { Play, Sparkles, Layers, Users } from 'lucide-react';

import { useGridKeyboardNavigation } from '@/hooks/useGridKeyboardNavigation';
import {
  gcDashColor,
  gcDashMotion,
  gcDashShape,
  gcDashSpacing,
  gcDashTypography,
} from './styleUtils';
import { GcDashButton } from './GcDashButton';
import { GcDashCard, GcDashCardBody, GcDashCardTitle, GcDashCardSubtitle } from './GcDashCard';
import { GcDashLabel } from './GcDashLabel';

export type GcDashGridType = 'videos' | 'collections' | 'creators';

export interface GcDashVideoData {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  platform?: 'instagram' | 'tiktok' | 'youtube';
  views?: number;
  likes?: number;
  duration?: string;
}

export interface GcDashCollectionData {
  id: string;
  name: string;
  description?: string;
  videoCount: number;
  thumbnail: string;
  creator: string;
}

export interface GcDashCreatorData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  videoCount: number;
  followers?: number;
}

export interface GcDashVideoGridProps {
  videos: GcDashVideoData[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  onVideoClick?: (video: GcDashVideoData) => void;
  onVideoSelect?: (video: GcDashVideoData, index: number) => void;
  className?: string;
  enableKeyboardNavigation?: boolean;
}

export interface GcDashCollectionGridProps {
  collections: GcDashCollectionData[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  onCollectionClick?: (collection: GcDashCollectionData) => void;
  className?: string;
}

export interface GcDashCreatorGridProps {
  creators: GcDashCreatorData[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  onCreatorClick?: (creator: GcDashCreatorData) => void;
  className?: string;
}

export interface GcDashVideoGridControlsProps {
  columns: 1 | 2 | 3 | 4 | 5 | 6;
  onColumnsChange: (cols: 1 | 2 | 3 | 4 | 5 | 6) => void;
  slideoutOpen: boolean;
  onSlideoutToggle: () => void;
  gridType?: GcDashGridType;
  onGridTypeChange?: (type: GcDashGridType) => void;
  className?: string;
}

export interface GcDashVideoGridSlideoutProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  columns: number;
}

const gridWrapperStyles = (columns: number) => css`
  display: grid;
  gap: ${gcDashSpacing.lg};
  grid-template-columns: repeat(${Math.min(columns, 2)}, minmax(0, 1fr));
  align-items: stretch;

  @media (min-width: 768px) {
    grid-template-columns: repeat(${Math.min(columns, 3)}, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
  }
`;

const focusRingStyles = css`
  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 2px ${gcDashColor.surface}, 0 0 0 4px ${gcDashColor.primary};
  }
`;

const cardBaseStyles = css`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  border-radius: ${gcDashShape.radiusLg};
  background: ${gcDashColor.surface};
  box-shadow: 0 18px 36px rgba(9, 30, 66, 0.12);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 42px rgba(9, 30, 66, 0.18);
  }
`;

const cardFooterStyles = css`
  display: flex;
  align-items: center;
  gap: ${gcDashSpacing.md};
  padding: ${gcDashSpacing.md} ${gcDashSpacing.lg};
  margin-top: auto;
`;

const avatarStyles = css`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(9, 30, 66, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: ${gcDashColor.textPrimary};
`;

const cardTitleStyles = css`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${gcDashColor.textPrimary};
`;

const cardMetaStyles = css`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${gcDashColor.textMuted};
`;

const badgeStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(9, 30, 66, 0.08);
  color: ${gcDashColor.textPrimary};
`;

const videoMediaStyles = css`
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  aspect-ratio: 9 / 16;
  background: #0a1425;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
`;

const overlayStyles = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(9, 30, 66, 0.0);
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;

  svg {
    width: 48px;
    height: 48px;
    color: #ffffff;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.28));
  }
`;

const platformBadgeColors: Record<NonNullable<GcDashVideoData['platform']>, { background: string; color: string }> = {
  instagram: { background: 'rgba(225, 48, 108, 0.9)', color: '#fff' },
  tiktok: { background: 'rgba(0, 0, 0, 0.85)', color: '#fff' },
  youtube: { background: 'rgba(255, 0, 0, 0.85)', color: '#fff' },
};

const platformBadgeStyles = (platform: NonNullable<GcDashVideoData['platform']>) => css`
  position: absolute;
  top: ${gcDashSpacing.sm};
  left: ${gcDashSpacing.sm};
  border-radius: ${gcDashShape.radiusSm};
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: capitalize;
  background: ${platformBadgeColors[platform].background};
  color: ${platformBadgeColors[platform].color};
`;

const viewsBadgeStyles = css`
  position: absolute;
  bottom: ${gcDashSpacing.sm};
  left: ${gcDashSpacing.sm};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${gcDashShape.radiusSm};
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(9, 30, 66, 0.72);
  color: #ffffff;
`;

const durationBadgeStyles = css`
  position: absolute;
  bottom: ${gcDashSpacing.sm};
  right: ${gcDashSpacing.sm};
  border-radius: ${gcDashShape.radiusSm};
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(9, 30, 66, 0.72);
  color: #ffffff;
`;

const descriptionStyles = css`
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: ${gcDashColor.textMuted};
`;

const cardHoverOverlay = css`
  ${cardBaseStyles};

  &:hover ${overlayStyles} {
    opacity: 1;
    background: rgba(9, 30, 66, 0.28);
  }
`;

const formatCount = (value?: number): string => {
  if (!value) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

const uppercaseHandle = (value: string): string => value.replace(/\s+/g, '').toLowerCase();

export interface InternalVideoCardProps {
  video: GcDashVideoData;
  onClick?: (video: GcDashVideoData) => void;
  tabIndex?: number;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

export const GcDashVideoCard = forwardRef<HTMLDivElement, InternalVideoCardProps>(
  ({ video, onClick, tabIndex = -1, onMouseEnter, onFocus }, ref) => (
    <div
      ref={ref}
      css={[cardHoverOverlay, focusRingStyles]}
      role="button"
      tabIndex={tabIndex}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onClick={() => {
        onClick?.(video);
      }}
      aria-label={`Open video: ${video.title}`}
    >
      <div css={videoMediaStyles}>
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <div css={overlayStyles}>
          <Play strokeWidth={1.6} fill="currentColor" />
        </div>
        {video.platform ? (
          <span css={platformBadgeStyles(video.platform)}>{video.platform}</span>
        ) : null}
        {video.views ? (
          <span css={viewsBadgeStyles}>
            <Play size={14} strokeWidth={1.6} fill="currentColor" />
            {formatCount(video.views)}
          </span>
        ) : null}
        {video.duration ? <span css={durationBadgeStyles}>{video.duration}</span> : null}
      </div>
      <div css={cardFooterStyles}>
        <span css={avatarStyles}>{video.creator.slice(0, 2).toUpperCase()}</span>
        <div css={css`min-width: 0; flex: 1;`}>
          <p css={cardTitleStyles}>{video.title}</p>
          <div css={cardMetaStyles}>
            <span>{video.creator}</span>
            <span>•</span>
            <span>@{uppercaseHandle(video.creator)}</span>
          </div>
        </div>
      </div>
    </div>
  ),
);

GcDashVideoCard.displayName = 'GcDashVideoCard';

export function GcDashCollectionCard({ collection, onClick }: { collection: GcDashCollectionData; onClick?: (collection: GcDashCollectionData) => void }) {
  return (
    <div css={[cardBaseStyles, focusRingStyles]} role="button" tabIndex={0} onClick={() => onClick?.(collection)}>
      <div
        css={css`
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #0a1425;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}
      >
        <img src={collection.thumbnail} alt={collection.name} loading="lazy" />
        <span
          css={css`
            position: absolute;
            right: ${gcDashSpacing.sm};
            bottom: ${gcDashSpacing.sm};
            padding: 4px 10px;
            border-radius: ${gcDashShape.radiusSm};
            background: rgba(9, 30, 66, 0.78);
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
          `}
        >
          {collection.videoCount} videos
        </span>
      </div>
      <div css={css`padding: ${gcDashSpacing.lg}; display: grid; gap: ${gcDashSpacing.sm};`}>
        <div>
          <h3 css={cardTitleStyles}>{collection.name}</h3>
          {collection.description ? <p css={descriptionStyles}>{collection.description}</p> : null}
        </div>
        <div css={cardMetaStyles}>
          <span css={avatarStyles}>{collection.creator.slice(0, 1).toUpperCase()}</span>
          <span>{collection.creator}</span>
        </div>
      </div>
    </div>
  );
}

export function GcDashCreatorCard({ creator, onClick }: { creator: GcDashCreatorData; onClick?: (creator: GcDashCreatorData) => void }) {
  return (
    <div css={[cardBaseStyles, focusRingStyles]} role="button" tabIndex={0} onClick={() => onClick?.(creator)}>
      <div css={css`padding: ${gcDashSpacing.xl}; display: grid; gap: ${gcDashSpacing.md}; text-align: center;`}>
        <div css={css`display: flex; justify-content: center;`}>
          <div
            css={css`
              width: 72px;
              height: 72px;
              border-radius: 999px;
              overflow: hidden;
              background: rgba(9, 30, 66, 0.08);

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            `}
          >
            <img src={creator.avatar} alt={creator.name} loading="lazy" />
          </div>
        </div>
        <div>
          <h3 css={cardTitleStyles}>{creator.name}</h3>
          <p css={css`${descriptionStyles}; margin: 4px 0 0;`}>@{creator.handle}</p>
        </div>
        <div css={css`display: flex; justify-content: center; gap: ${gcDashSpacing.lg};`}>
          <div>
            <p css={cardTitleStyles}>{creator.videoCount}</p>
            <p css={css`${cardMetaStyles}; justify-content: center;`}>Videos</p>
          </div>
          {creator.followers ? (
            <div>
              <p css={cardTitleStyles}>{creator.followers.toLocaleString()}</p>
              <p css={css`${cardMetaStyles}; justify-content: center;`}>Followers</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function GcDashVideoGrid({
  videos,
  columns = 3,
  onVideoClick,
  onVideoSelect,
  className,
  enableKeyboardNavigation = true,
}: GcDashVideoGridProps) {
  const { gridProps, getItemProps } = useGridKeyboardNavigation<GcDashVideoData>({
    items: videos,
    columns,
    onItemSelect: onVideoSelect,
    onItemActivate: onVideoClick,
    disabled: !enableKeyboardNavigation,
  });

  return (
    <div
      {...gridProps}
      className={clsx('gc-dash-video-grid', className)}
      css={gridWrapperStyles(columns)}
    >
      {videos.map((video, index) => {
        const itemProps = getItemProps(index);
        return (
          <GcDashVideoCard
            key={video.id}
            video={video}
            onClick={onVideoClick}
            tabIndex={itemProps.tabIndex}
            onMouseEnter={itemProps.onMouseEnter}
            onFocus={itemProps.onFocus}
            ref={itemProps.ref}
          />
        );
      })}
    </div>
  );
}

export function GcDashCollectionGrid({
  collections,
  columns = 3,
  onCollectionClick,
  className,
}: GcDashCollectionGridProps) {
  return (
    <div className={clsx('gc-dash-collection-grid', className)} css={gridWrapperStyles(columns)}>
      {collections.map((collection) => (
        <GcDashCollectionCard key={collection.id} collection={collection} onClick={onCollectionClick} />
      ))}
    </div>
  );
}

export function GcDashCreatorGrid({ creators, columns = 3, onCreatorClick, className }: GcDashCreatorGridProps) {
  return (
    <div className={clsx('gc-dash-creator-grid', className)} css={gridWrapperStyles(columns)}>
      {creators.map((creator) => (
        <GcDashCreatorCard key={creator.id} creator={creator} onClick={onCreatorClick} />
      ))}
    </div>
  );
}

export function GcDashVideoGridControls({
  columns,
  onColumnsChange,
  slideoutOpen,
  onSlideoutToggle,
  gridType = 'videos',
  onGridTypeChange,
  className,
}: GcDashVideoGridControlsProps) {
  const columnOptions: Array<1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6];
  const gridTypes: Array<{ value: GcDashGridType; label: string; icon: React.ReactNode }> = [
    { value: 'videos', label: 'Videos', icon: <Sparkles size={16} /> },
    { value: 'collections', label: 'Collections', icon: <Layers size={16} /> },
    { value: 'creators', label: 'Creators', icon: <Users size={16} /> },
  ];

  const labelForGridType = () => {
    switch (gridType) {
      case 'collections':
        return 'Collections per row';
      case 'creators':
        return 'Creators per row';
      default:
        return 'Videos per row';
    }
  };

  return (
    <GcDashCard className={clsx('gc-dash-video-grid-controls', className)}>
      <GcDashCardBody
        css={css`
          display: grid;
          gap: ${gcDashSpacing.lg};
        `}
      >
        {onGridTypeChange ? (
          <div css={css`display: grid; gap: ${gcDashSpacing.sm};`}>
            <GcDashCardSubtitle>Grid type</GcDashCardSubtitle>
            <div
              css={css`
                display: inline-flex;
                flex-wrap: wrap;
                gap: ${gcDashSpacing.xs};
              `}
            >
              {gridTypes.map((type) => (
                <GcDashButton
                  key={type.value}
                  variant={gridType === type.value ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onGridTypeChange(type.value)}
                  leadingIcon={type.icon}
                >
                  {type.label}
                </GcDashButton>
              ))}
            </div>
          </div>
        ) : null}

        <div css={css`display: grid; gap: ${gcDashSpacing.sm};`}>
          <GcDashCardSubtitle>{labelForGridType()} (desktop)</GcDashCardSubtitle>
          <div css={css`display: flex; flex-wrap: wrap; gap: ${gcDashSpacing.xs};`}>
            {columnOptions.map((option) => (
              <GcDashButton
                key={option}
                size="sm"
                variant={columns === option ? 'primary' : 'ghost'}
                onClick={() => onColumnsChange(option)}
              >
                {option}
              </GcDashButton>
            ))}
          </div>
        </div>

        <div css={css`display: flex; align-items: center; gap: ${gcDashSpacing.md}; flex-wrap: wrap;`}>
          <GcDashButton
            size="sm"
            variant={slideoutOpen ? 'secondary' : 'ghost'}
            onClick={onSlideoutToggle}
          >
            {slideoutOpen ? 'Close slideout' : 'Open slideout'}
          </GcDashButton>
          <GcDashLabel tone="neutral" variant="soft" uppercase={false}>
            Adjust layout responsiveness
          </GcDashLabel>
        </div>
      </GcDashCardBody>
    </GcDashCard>
  );
}

export function GcDashVideoGridSlideout({ isOpen, columns, className, children, ...rest }: GcDashVideoGridSlideoutProps) {
  return (
    <div
      className={clsx('gc-dash-video-grid-slideout', className)}
      css={css`
        position: sticky;
        top: ${gcDashSpacing.lg};
        border-radius: ${gcDashShape.radiusLg};
        border: 1px solid ${gcDashColor.border};
        background: ${gcDashColor.surface};
        box-shadow: 0 18px 36px rgba(9, 30, 66, 0.07);
        padding: ${gcDashSpacing.lg};
        min-height: 240px;
        display: grid;
        gap: ${gcDashSpacing.md};
        opacity: ${isOpen ? 1 : 0.55};
        transition: ${gcDashMotion.transition};
      `}
      aria-hidden={!isOpen}
      {...rest}
    >
      <GcDashCardSubtitle>Slideout panel</GcDashCardSubtitle>
      <GcDashCardTitle>Preview layout details</GcDashCardTitle>
      <p css={descriptionStyles}>
        Use this panel to validate the responsive grid behavior. The current configuration renders {columns}{' '}
        column{columns === 1 ? '' : 's'} on large screens and gracefully collapses on smaller breakpoints.
      </p>
      {children}
    </div>
  );
}
