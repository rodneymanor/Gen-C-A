import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { VideoGrid } from '../components/collections/VideoGrid';
import { VideoModal } from '../components/collections/VideoModal';
import type { ContentItem, Platform } from '../types';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import SearchIcon from '@atlaskit/icon/glyph/search';
import FilterIcon from '@atlaskit/icon/glyph/filter';
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import PersonIcon from '@atlaskit/icon/glyph/person';
import EyeIcon from '@atlaskit/icon/glyph/watch';
import CalendarIcon from '@atlaskit/icon/glyph/calendar';
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line';
import StarIcon from '@atlaskit/icon/glyph/star';
import SettingsIcon from '@atlaskit/icon/glyph/settings';

interface VideoFilters {
  searchQuery: string;
  searchType: 'basic' | 'advanced';
  watchList: boolean;
  channels: string[];
  platforms: Platform[];
  viewsRange: 'any' | 'low' | 'medium' | 'high' | 'viral';
  timeRange: 'any' | 'day' | 'week' | 'month' | 'quarter';
  engagementRate: 'any' | 'low' | 'medium' | 'high';
  sortBy: 'recent' | 'popular' | 'views' | 'engagement';
}

const defaultFilters: VideoFilters = {
  searchQuery: '',
  searchType: 'basic',
  watchList: false,
  channels: [],
  platforms: [],
  viewsRange: 'any',
  timeRange: 'any',
  engagementRate: 'any',
  sortBy: 'recent',
};

const savedFilters = [
  { name: 'High Engagement TikToks', id: 'high-tiktok' },
  { name: 'New Creator Content', id: 'new-creators' },
  { name: 'Trending This Week', id: 'trending-week' },
];

// Mock data for videos with comprehensive metadata
const generateMockVideos = (): ContentItem[] => {
  const platforms: Platform[] = ['tiktok', 'instagram', 'youtube', 'twitter'];
  const creators = ['@sarah_creates', '@techguru', '@lifestyle_lisa', '@fitness_frank', '@cook_master', '@travel_tales'];
  const titles = [
    'How to Create Viral Content That Actually Works',
    '5 Mistakes Everyone Makes on Social Media',
    'The Secret to Building Your Personal Brand',
    'Why Your Content Isn\'t Getting Views (And How to Fix It)',
    'Behind the Scenes of My Most Successful Post',
    'The Ultimate Guide to Content Creation',
    'What I Wish I Knew Before Starting My Channel',
    'How I Grew My Following in 30 Days',
    'The Content Strategy That Changed Everything',
    'Why Authenticity Beats Perfection Every Time'
  ];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `video-${i + 1}`,
    title: titles[i % titles.length],
    type: 'video' as const,
    platform: platforms[i % platforms.length],
    thumbnail: `https://picsum.photos/seed/${i}/400/600`,
    url: `https://example.com/embed/video-${i + 1}`,
    duration: Math.floor(Math.random() * 300) + 15, // 15s to 5min
    tags: ['viral', 'trending', 'creator', 'social media', 'tips'].slice(0, Math.floor(Math.random() * 3) + 2),
    creator: creators[i % creators.length],
    created: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
    updated: new Date(),
    status: 'published' as const,
    metadata: {
      views: Math.floor(Math.random() * 1000000) + 1000,
      likes: Math.floor(Math.random() * 50000) + 100,
      comments: Math.floor(Math.random() * 5000) + 10,
      shares: Math.floor(Math.random() * 10000) + 50,
      engagementRate: Math.round((Math.random() * 10 + 2) * 100) / 100, // 2-12%
      watchList: Math.random() > 0.7, // 30% chance to be in watch list
    },
  }));
};

const pageStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: var(--space-4);
    gap: var(--space-4);
  }
`;

const headerStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  .title-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);

    @media (max-width: 768px) {
      flex-direction: column;
      gap: var(--space-2);
    }
  }

  .title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-800);
    margin: 0;
  }

  .subtitle {
    font-size: var(--font-size-body);
    color: var(--color-neutral-600);
    margin: var(--space-2) 0 0 0;
    max-width: 600px;
    line-height: var(--line-height-relaxed);

    @media (max-width: 768px) {
      max-width: none;
    }
  }
`;

const searchSectionStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-2);
  }

  .search-type-dropdown {
    min-width: 140px;
    position: relative;

    @media (max-width: 768px) {
      min-width: 100%;
      order: -1;
    }
  }

  .search-input-container {
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  .search-filters {
    display: flex;
    gap: var(--space-2);

    @media (max-width: 768px) {
      width: 100%;
      justify-content: flex-end;
    }
  }
`;

const dropdownStyles = css`
  position: relative;
  
  .dropdown-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-neutral-50);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    font-size: var(--font-size-body);
    color: var(--color-neutral-700);
    cursor: pointer;
    transition: var(--transition-all);

    &:hover {
      background: var(--color-neutral-100);
      border-color: var(--color-neutral-300);
    }

    &:focus {
      outline: none;
      border-color: var(--color-primary-500);
      box-shadow: var(--focus-ring);
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    box-shadow: var(--shadow-overlay);
    z-index: 10;
    margin-top: var(--space-1);

    .dropdown-item {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: none;
      border: none;
      text-align: left;
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
      cursor: pointer;
      transition: var(--transition-all);

      &:hover {
        background: var(--color-neutral-50);
      }

      &:first-of-type {
        border-radius: var(--radius-medium) var(--radius-medium) 0 0;
      }

      &:last-of-type {
        border-radius: 0 0 var(--radius-medium) var(--radius-medium);
      }
    }
  }
`;

const filtersStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  background: var(--color-neutral-50);
  border-radius: var(--radius-medium);

  @media (max-width: 768px) {
    gap: var(--space-2);
    padding: var(--space-3);
  }

  .filter-group {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .filter-actions {
    margin-left: auto;
    display: flex;
    gap: var(--space-2);

    @media (max-width: 768px) {
      margin-left: 0;
      width: 100%;
      justify-content: space-between;
    }
  }
`;

const filterPillStyles = (isActive: boolean) => css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-all);
  border: 1px solid transparent;

  ${isActive ? css`
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border-color: var(--color-primary-300);
  ` : css`
    background: white;
    color: var(--color-neutral-700);
    border-color: var(--color-neutral-200);

    &:hover {
      background: var(--color-neutral-50);
      border-color: var(--color-neutral-300);
    }
  `}

  .remove-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: currentColor;
    color: white;
    cursor: pointer;
    transition: var(--transition-all);

    &:hover {
      transform: scale(1.1);
    }
  }
`;

const savedFiltersDropdownStyles = css`
  position: relative;

  .saved-filters-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    box-shadow: var(--shadow-overlay);
    z-index: 10;
    margin-top: var(--space-1);
    min-width: 200px;

    .saved-filter-item {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: none;
      border: none;
      text-align: left;
      font-size: var(--font-size-body);
      color: var(--color-neutral-700);
      cursor: pointer;
      transition: var(--transition-all);
      display: flex;
      align-items: center;
      gap: var(--space-2);

      &:hover {
        background: var(--color-neutral-50);
      }
    }
  }
`;

export const Videos: React.FC = () => {
  const [filters, setFilters] = useState<VideoFilters>(defaultFilters);
  const [videos] = useState<ContentItem[]>(() => generateMockVideos());
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ContentItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showSavedFiltersDropdown, setShowSavedFiltersDropdown] = useState(false);
  const [visibleVideosCount, setVisibleVideosCount] = useState(20);

  // Filter and sort videos based on current filters
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos.filter(video => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(query);
        const matchesCreator = video.creator?.toLowerCase().includes(query);
        const matchesTags = video.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCreator && !matchesTags) return false;
      }

      // Watch list filter
      if (filters.watchList && !video.metadata?.watchList) return false;

      // Platform filter
      if (filters.platforms.length > 0 && !filters.platforms.includes(video.platform!)) return false;

      // Views range filter
      if (filters.viewsRange !== 'any' && video.metadata?.views) {
        const views = video.metadata.views;
        switch (filters.viewsRange) {
          case 'low': if (views >= 10000) return false; break;
          case 'medium': if (views < 10000 || views >= 100000) return false; break;
          case 'high': if (views < 100000 || views >= 1000000) return false; break;
          case 'viral': if (views < 1000000) return false; break;
        }
      }

      // Time range filter
      if (filters.timeRange !== 'any') {
        const now = new Date();
        const videoDate = new Date(video.created);
        const daysDiff = (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (filters.timeRange) {
          case 'day': if (daysDiff > 1) return false; break;
          case 'week': if (daysDiff > 7) return false; break;
          case 'month': if (daysDiff > 30) return false; break;
          case 'quarter': if (daysDiff > 90) return false; break;
        }
      }

      // Engagement rate filter
      if (filters.engagementRate !== 'any' && video.metadata?.engagementRate) {
        const rate = video.metadata.engagementRate;
        switch (filters.engagementRate) {
          case 'low': if (rate >= 5) return false; break;
          case 'medium': if (rate < 5 || rate >= 10) return false; break;
          case 'high': if (rate < 10) return false; break;
        }
      }

      return true;
    });

    // Sort videos
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.metadata?.likes || 0) - (a.metadata?.likes || 0));
        break;
      case 'views':
        filtered.sort((a, b) => (b.metadata?.views || 0) - (a.metadata?.views || 0));
        break;
      case 'engagement':
        filtered.sort((a, b) => (b.metadata?.engagementRate || 0) - (a.metadata?.engagementRate || 0));
        break;
    }

    return filtered;
  }, [videos, filters]);

  const visibleVideos = filteredAndSortedVideos.slice(0, visibleVideosCount);

  // Lazy loading
  const loadMoreVideos = useCallback(() => {
    setVisibleVideosCount(prev => Math.min(prev + 20, filteredAndSortedVideos.length));
  }, [filteredAndSortedVideos.length]);

  // Scroll listener for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMoreVideos();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreVideos]);

  const updateFilter = useCallback((key: keyof VideoFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setVisibleVideosCount(20); // Reset visible count when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setVisibleVideosCount(20);
  }, []);

  const toggleFilterValue = useCallback((key: keyof VideoFilters, value: any) => {
    setFilters(prev => {
      const currentValue = prev[key];
      if (Array.isArray(currentValue)) {
        const newArray = currentValue.includes(value)
          ? currentValue.filter(v => v !== value)
          : [...currentValue, value];
        return { ...prev, [key]: newArray };
      } else {
        return { ...prev, [key]: currentValue === value ? defaultFilters[key] : value };
      }
    });
  }, []);

  const handleVideoSelect = useCallback((video: ContentItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  }, []);

  const handleVideoFavorite = useCallback((video: ContentItem) => {
    setFavoriteVideos(prev => 
      prev.includes(video.id) 
        ? prev.filter(id => id !== video.id)
        : [...prev, video.id]
    );
  }, []);

  const handleNavigateVideo = useCallback((direction: 'prev' | 'next') => {
    if (!selectedVideo) return;
    
    const currentIndex = filteredAndSortedVideos.findIndex(v => v.id === selectedVideo.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredAndSortedVideos.length - 1;
    } else {
      newIndex = currentIndex < filteredAndSortedVideos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedVideo(filteredAndSortedVideos[newIndex]);
  }, [selectedVideo, filteredAndSortedVideos]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.watchList) count++;
    if (filters.platforms.length > 0) count += filters.platforms.length;
    if (filters.viewsRange !== 'any') count++;
    if (filters.timeRange !== 'any') count++;
    if (filters.engagementRate !== 'any') count++;
    return count;
  };

  return (
    <div css={pageStyles}>
      {/* Header Section */}
      <header css={headerStyles}>
        <div className="title-section">
          <div>
            <h1 className="title">Videos</h1>
            <p className="subtitle">
              Discover what's going viral in your niche and why it worked
            </p>
          </div>
        </div>

        {/* Search Interface */}
        <div css={searchSectionStyles}>
          <div className="search-type-dropdown">
            <div css={dropdownStyles}>
              <button 
                className="dropdown-button"
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                aria-label="Select search type"
              >
                {filters.searchType === 'basic' ? 'Basic Search' : 'Advanced Search'}
                <ChevronDownIcon label="" size="small" primaryColor={token('color.icon')} />
              </button>
              {showSearchDropdown && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      updateFilter('searchType', 'basic');
                      setShowSearchDropdown(false);
                    }}
                  >
                    Basic Search
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      updateFilter('searchType', 'advanced');
                      setShowSearchDropdown(false);
                    }}
                  >
                    Advanced Search
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="search-input-container">
            <Input
              placeholder="Search videos, creators, or topics..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              iconBefore={<SearchIcon label="" size="small" primaryColor={token('color.icon')} />}
              size="medium"
            />
          </div>

          <div className="search-filters">
            <Button
              variant="secondary"
              size="medium"
              iconBefore={<FilterIcon label="" size="small" primaryColor={token('color.icon')} />}
              onClick={() => {/* Toggle advanced filters */}}
            >
              Filters
            </Button>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <section css={filtersStyles} aria-label="Video filters">
        <div className="filter-group">
          <button
            css={filterPillStyles(filters.watchList)}
            onClick={() => toggleFilterValue('watchList', true)}
            aria-label="Filter by watch list"
          >
            <StarFilledIcon label="" size="small" primaryColor="currentColor" />
            Watch list
            {filters.watchList && (
              <span className="remove-icon" onClick={(e) => {
                e.stopPropagation();
                updateFilter('watchList', false);
              }}>
                <CrossIcon label="" size="small" primaryColor="currentColor" />
              </span>
            )}
          </button>

          <button
            css={filterPillStyles(filters.platforms.length > 0)}
            onClick={() => toggleFilterValue('platforms', 'tiktok')}
          >
            <PersonIcon label="" size="small" primaryColor="currentColor" />
            Platform
            {filters.platforms.length > 0 && (
              <Badge variant="neutral" size="small">
                {filters.platforms.length}
              </Badge>
            )}
          </button>

          <button
            css={filterPillStyles(filters.viewsRange !== 'any')}
            onClick={() => toggleFilterValue('viewsRange', 'high')}
          >
            <EyeIcon label="" size="small" primaryColor="currentColor" />
            Views
          </button>

          <button
            css={filterPillStyles(filters.timeRange !== 'any')}
            onClick={() => toggleFilterValue('timeRange', 'month')}
          >
            <CalendarIcon label="" size="small" primaryColor="currentColor" />
            Last three months
          </button>

          <button
            css={filterPillStyles(filters.engagementRate !== 'any')}
            onClick={() => toggleFilterValue('engagementRate', 'high')}
          >
            <GraphLineIcon label="" size="small" primaryColor="currentColor" />
            Engagement rate
          </button>
        </div>

        <div className="filter-actions">
          <Button
            variant="subtle"
            size="small"
            onClick={clearFilters}
            disabled={getActiveFilterCount() === 0}
          >
            Clear {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Button>

          <div css={savedFiltersDropdownStyles}>
            <Button
              variant="subtle"
              size="small"
              iconBefore={<StarIcon label="" size="small" primaryColor={token('color.icon')} />}
              onClick={() => setShowSavedFiltersDropdown(!showSavedFiltersDropdown)}
              onBlur={() => setTimeout(() => setShowSavedFiltersDropdown(false), 200)}
            >
              Save filter
            </Button>
            {showSavedFiltersDropdown && (
              <div className="saved-filters-menu">
                {savedFilters.map(savedFilter => (
                  <button
                    key={savedFilter.id}
                    className="saved-filter-item"
                    onClick={() => {
                      // Apply saved filter logic here
                      setShowSavedFiltersDropdown(false);
                    }}
                  >
                    <SettingsIcon label="" size="small" primaryColor={token('color.icon')} />
                    {savedFilter.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <main>
        <VideoGrid
          videos={visibleVideos}
          onVideoSelect={handleVideoSelect}
          onVideoPlay={handleVideoSelect}
          onVideoFavorite={handleVideoFavorite}
          selectedVideos={selectedVideos}
          favoriteVideos={favoriteVideos}
          showBulkActions={false}
        />
        
        {visibleVideosCount < filteredAndSortedVideos.length && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Button
              variant="secondary"
              size="large"
              onClick={loadMoreVideos}
            >
              Load More Videos ({filteredAndSortedVideos.length - visibleVideosCount} remaining)
            </Button>
          </div>
        )}
      </main>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        video={selectedVideo}
        videos={filteredAndSortedVideos}
        onClose={() => setIsVideoModalOpen(false)}
        onNavigateVideo={handleNavigateVideo}
      />
    </div>
  );
};