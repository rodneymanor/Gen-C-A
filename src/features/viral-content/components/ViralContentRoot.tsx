import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  GcDashPlanChip,
  GcDashNavButtons,
  GcDashHeader,
  GcDashHeaderSearchInput,
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashBlankSlate,
  GcDashLabel,
} from '@/components/gc-dash';
import { ViralClipCard } from './ViralClipCard';
import { AddViralVideoModal } from './AddViralVideoModal';
import MediaServicesPresentationIcon from '@atlaskit/icon/glyph/media-services/presentation';
import VideoFilledIcon from '@atlaskit/icon/glyph/video-filled';
import ImageIcon from '@atlaskit/icon/glyph/image';
import PersonIcon from '@atlaskit/icon/glyph/person';
import type { Platform, ViralVideo } from '../types';
import { PLATFORM_EMOJI, PLATFORM_LABELS } from '../constants/feed';
import { fetchViralFeed } from '../api';
import {
  pageContainerStyles,
  shellStyles,
  heroStyles,
  heroTitleStyles,
  highlightRowStyles,
  controlsCardBodyStyles,
  controlsLeftStyles,
  controlsRightStyles,
  platformChipsStyles,
  gridStyles,
  masonrySentinelStyles,
} from './styles';

const SUPPORTED_PLATFORMS: ReadonlyArray<Exclude<Platform, 'all'>> = ['instagram', 'tiktok', 'youtube'];

const isSupportedPlatform = (value: Platform): value is Exclude<Platform, 'all'> =>
  SUPPORTED_PLATFORMS.includes(value as Exclude<Platform, 'all'>);

const skeletonStyles = css`
  border-radius: 20px;
  opacity: 0.45;
  background: rgba(9, 30, 66, 0.04);
  min-height: 320px;
  animation: pulse 1.6s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

export const ViralContentRoot: React.FC = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(0);
  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  const platformOptions = useMemo(
    () => [
      { key: 'all' as Platform, label: 'All platforms', emoji: '✨' },
      { key: 'instagram' as Platform, label: 'Instagram', emoji: PLATFORM_EMOJI.instagram },
      { key: 'tiktok' as Platform, label: 'TikTok', emoji: PLATFORM_EMOJI.tiktok },
      { key: 'youtube' as Platform, label: 'YouTube', emoji: PLATFORM_EMOJI.youtube },
    ],
    [],
  );

  const resultSummary = useMemo(() => {
    const label = platform === 'all' ? 'All platforms' : PLATFORM_LABELS[platform];
    return `${videos.length} pieces · ${label}`;
  }, [videos.length, platform]);

  useEffect(() => {
    setSearchDraft(searchQuery);
  }, [searchQuery]);

  const resetFeed = useCallback(() => {
    setVideos([]);
    setPage(0);
    setHasMore(true);
  }, []);

  useEffect(() => {
    resetFeed();
  }, [platform, searchQuery, resetFeed]);

  const loadPage = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const { items, hasMore: nextHasMore } = await fetchViralFeed(page, platform, searchQuery);
    setVideos((prev) => (page === 0 ? items : [...prev, ...items]));
    setHasMore(nextHasMore);
    setIsLoading(false);
    setPage((prev) => prev + 1);
  }, [page, platform, searchQuery, isLoading, hasMore]);

  useEffect(() => {
    loadPage().catch((error) => {
      console.warn('Failed to load viral content', error);
      setIsLoading(false);
      setHasMore(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, searchQuery]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading && hasMore) {
        loadPage().catch((error) => console.warn('Failed to lazily load viral content', error));
      }
    });

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadPage, hasMore, isLoading]);

  const handleOpenVideo = useCallback((video: ViralVideo) => {
    window.open(video.url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleFindSimilar = useCallback((video: ViralVideo) => {
    console.log('more-like-this', video.id);
  }, []);

  const handleAddToProject = useCallback((video: ViralVideo) => {
    console.log('add-to-project', video.id);
  }, []);

  const ensureSupportedPlatform = useCallback(() => {
    if (!isSupportedPlatform(platform)) {
      return null;
    }
    return platform;
  }, [platform]);

  const reloadFirstPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items, hasMore: nextHasMore } = await fetchViralFeed(0, platform, searchQuery);
      setVideos(items);
      setHasMore(nextHasMore);
      setPage(1);
    } catch (error) {
      console.warn('Failed to refresh viral content', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsAddingVideo(false);
    }
  }, [platform, searchQuery]);

  const handleAddVideo = useCallback(() => {
    setIsAddVideoOpen(true);
  }, []);

  const handleAddCreator = useCallback(() => {
    const currentPlatform = ensureSupportedPlatform();
    if (!currentPlatform) return;
    console.log('add-creator', { platform: currentPlatform });
  }, [ensureSupportedPlatform]);

  const handlePreviousNav = () => navigate('/dashboard');
  const handleNextNav = () => navigate('/collections');

  return (
    <div css={pageContainerStyles}>
      <div css={shellStyles}>
        <GcDashHeader
          leading={
            <>
              <GcDashPlanChip planName="Viral feed" info={resultSummary} highlighted />
              <GcDashNavButtons onPrevious={handlePreviousNav} onNext={handleNextNav} />
            </>
          }
          search={
            <GcDashHeaderSearchInput
              placeholder="Search creators, hooks, formats"
              ariaLabel="Search the viral feed"
              value={searchDraft}
              onValueChange={setSearchDraft}
              onSearch={(value) => setSearchQuery(value)}
              size="medium"
            />
          }
        />

        <section css={heroStyles}>
          <div css={heroTitleStyles}>
            <h1>See what creators are shipping today</h1>
            <p>
              Track the daily content drops from your go-to Instagram, TikTok, and YouTube sources — spot the trends,
              swipe the structures, and remix them into your own workflow without leaving your dashboard.
            </p>
          </div>
          <div css={highlightRowStyles}>
            <GcDashLabel tone="primary" variant="soft" uppercase={false}>
              🚀 Daily refresh at 9 AM PT
            </GcDashLabel>
            <GcDashLabel tone="neutral" variant="soft" uppercase={false}>
              🪄 Claude-ready hook ideas included
            </GcDashLabel>
            <GcDashLabel tone="primary" variant="outline" uppercase={false}>
              📊 Auto-tags by format & persona
            </GcDashLabel>
          </div>
        </section>

        <GcDashCard>
          <GcDashCardBody css={controlsCardBodyStyles}>
            <div css={controlsLeftStyles}>
              <div css={platformChipsStyles}>
                {platformOptions.map((option) => (
                  <GcDashButton
                    key={option.key}
                    variant={platform === option.key ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setPlatform(option.key)}
                  >
                    {option.emoji} {option.label}
                  </GcDashButton>
                ))}
              </div>
            </div>
            <div css={controlsRightStyles}>
      <GcDashButton
        variant="primary"
        leadingIcon={<VideoFilledIcon label="" />}
        onClick={handleAddVideo}
      >
                Add video
              </GcDashButton>
              <GcDashButton
                variant="secondary"
                leadingIcon={<PersonIcon label="" />}
                onClick={handleAddCreator}
              >
                Add creator
              </GcDashButton>
            </div>
          </GcDashCardBody>
        </GcDashCard>

        {videos.length === 0 && !isLoading && !isAddingVideo ? (
          <GcDashBlankSlate
            title="Nothing viral matched that filter"
            description="Try switching platforms or clearing your search to bring back today’s feed."
            primaryAction={
              <GcDashButton
                variant="primary"
                onClick={() => {
                  setSearchQuery('');
                  setSearchDraft('');
                }}
              >
                Clear search
              </GcDashButton>
            }
            secondaryAction={
              <GcDashButton variant="ghost" onClick={() => setPlatform('all')}>
                Show all platforms
              </GcDashButton>
            }
          />
        ) : (
          <section css={gridStyles}>
            {isAddingVideo && <GcDashCard key="manual-add-skeleton" css={skeletonStyles} />}
            {videos.map((video) => (
              <ViralClipCard
                key={video.id}
                video={{ ...video, description: video.description || video.title }}
                onOpen={handleOpenVideo}
                onFindSimilar={handleFindSimilar}
                onAddToProject={handleAddToProject}
                onPlay={handleOpenVideo}
              />
            ))}

            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => <GcDashCard key={`skeleton-${index}`} css={skeletonStyles} />)}
          </section>
        )}

        <div ref={sentinelRef} css={masonrySentinelStyles} aria-hidden />

        {!hasMore && videos.length > 0 && (
          <GcDashBlankSlate
            title="You’ve reached the top creators for today"
            description="Bookmark your favorites or refresh tomorrow for a new batch of inspiration."
            centerContent={false}
            primaryAction={
              <GcDashButton variant="primary" onClick={() => setPlatform('all')}>
                Reset filters
              </GcDashButton>
            }
            secondaryAction={
              <GcDashButton variant="ghost" onClick={() => navigate('/collections')}>
                Save highlights to collections
              </GcDashButton>
            }
          >
            <div
              css={css`
                display: grid;
                gap: 12px;
              `}
            >
              <div
                css={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  color: rgba(9, 30, 66, 0.6);
                `}
              >
                <MediaServicesPresentationIcon label="" /> Long-form inspiration
              </div>
              <div
                css={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  color: rgba(9, 30, 66, 0.6);
                `}
              >
                <VideoFilledIcon label="" /> Viral short-form beats
              </div>
              <div
                css={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  color: rgba(9, 30, 66, 0.6);
                `}
              >
                <ImageIcon label="" /> Carousel + cover inspiration
              </div>
            </div>
          </GcDashBlankSlate>
        )}
      </div>
      <AddViralVideoModal
        open={isAddVideoOpen}
        onClose={() => setIsAddVideoOpen(false)}
        onSubmitStart={() => setIsAddingVideo(true)}
        onSubmitEnd={() => setIsAddingVideo(false)}
        onSuccess={reloadFirstPage}
      />
    </div>
  );
};

ViralContentRoot.displayName = 'ViralContentRoot';

export default ViralContentRoot;
