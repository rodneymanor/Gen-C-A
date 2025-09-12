import React, { useState, useEffect, useMemo } from 'react';
import { css } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertCircle, 
  Loader2,
  Grid,
  List
} from 'lucide-react';
import { 
  Creator, 
  Watchlist, 
  CreatorFilters, 
  Platform,
  PlatformFilter 
} from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CreatorCard } from '../components/ui/CreatorCard';
import { WatchlistSidebar } from '../components/ui/WatchlistSidebar';
import { DotPagination } from '../components/ui/Pagination';
import { PlatformIcon } from '../components/ui/PlatformIcon';

export interface ChannelsPageProps {
  className?: string;
  testId?: string;
}

const pageStyles = css`
  display: flex;
  min-height: 100vh;
  background: transparent;
  
  /* Dark theme styles */
  .theme-dark & {
    background: var(--color-neutral-900);
  }
`;

const mainContentStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const headerStyles = css`
  background: transparent;
  border-bottom: 1px solid var(--color-neutral-200);
  padding: var(--space-6) var(--space-6) var(--space-4) var(--space-6);
  
  .theme-dark & {
    background: var(--color-neutral-800);
    border-color: var(--color-neutral-700);
  }
`;

const headerTopStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
  }
`;

const titleSectionStyles = css`
  flex: 1;
`;

const titleStyles = css`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-2) 0;
  
  .theme-dark & {
    color: var(--color-neutral-100);
  }
`;

const subtitleStyles = css`
  font-size: var(--font-size-body);
  color: var(--color-neutral-600);
  margin: 0;
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
`;

const trialSectionStyles = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  
  @media (max-width: 768px) {
    align-items: stretch;
  }
`;

const processingNoteStyles = css`
  font-size: var(--font-size-caption);
  color: var(--color-neutral-500);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
`;

const searchBarStyles = css`
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--space-2);
  }
`;

const searchInputContainerStyles = css`
  flex: 1;
  display: flex;
  gap: var(--space-2);
`;

const filtersContainerStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  
  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const contentAreaStyles = css`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const mainContentAreaStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-6);
  overflow: auto;
  
  @media (max-width: 768px) {
    padding: var(--space-3) var(--space-4);
  }
`;

const gridContainerStyles = css`
  flex: 1;
`;

const gridHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
`;

const resultsCountStyles = css`
  font-size: var(--font-size-body-small);
  color: var(--color-neutral-600);
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
`;

const viewToggleStyles = css`
  display: flex;
  gap: var(--space-1);
  
  button {
    padding: var(--space-2);
    border: 1px solid var(--color-neutral-300);
    background: transparent;
    color: var(--color-neutral-600);
    border-radius: var(--radius-medium);
    cursor: pointer;
    
    &:hover {
      border-color: var(--color-primary-500);
      color: var(--color-primary-600);
    }
    
    &[data-active="true"] {
      background: var(--color-primary-500);
      color: white;
      border-color: var(--color-primary-500);
    }
    
    .theme-dark & {
      border-color: var(--color-neutral-600);
      background: var(--color-neutral-800);
      color: var(--color-neutral-400);
      
      &:hover {
        background: var(--color-neutral-700);
      }
      
      &[data-active="true"] {
        background: var(--color-primary-600);
        border-color: var(--color-primary-600);
      }
    }
  }
`;

const creatorsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const loadingStateStyles = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  color: var(--color-neutral-600);
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
`;

const emptyStateStyles = css`
  text-align: center;
  padding: var(--space-8);
  
  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--space-4) auto;
    color: var(--color-neutral-400);
  }
  
  .empty-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
    
    .theme-dark & {
      color: var(--color-neutral-300);
    }
  }
  
  .empty-description {
    font-size: var(--font-size-body);
    color: var(--color-neutral-600);
    margin-bottom: var(--space-4);
    
    .theme-dark & {
      color: var(--color-neutral-400);
    }
  }
`;

// Sample creator data based on the mockup
const SAMPLE_CREATORS: Creator[] = [
  {
    id: '1',
    name: 'MrBeast',
    username: 'mrbeast',
    followerCount: 433000000,
    platform: 'youtube',
    isVerified: true,
    tags: ['entertainment', 'philanthropy'],
    metrics: { engagementRate: 0.08, averageViews: 50000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '2',
    name: 'Kim Kardashian',
    username: 'kimkardashian',
    followerCount: 365000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['lifestyle', 'fashion'],
    metrics: { engagementRate: 0.03, averageViews: 2000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '3',
    name: 'Nicki Minaj',
    username: 'nickiminaj',
    followerCount: 224000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'entertainment'],
    metrics: { engagementRate: 0.05, averageViews: 3000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '4',
    name: 'Cardi B',
    username: 'iamcardib',
    followerCount: 164000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'lifestyle'],
    metrics: { engagementRate: 0.04, averageViews: 2500000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '5',
    name: 'Khaby Lame',
    username: 'khaby.lame',
    followerCount: 161000000,
    platform: 'tiktok',
    isVerified: true,
    tags: ['comedy', 'viral'],
    metrics: { engagementRate: 0.12, averageViews: 15000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '6',
    name: 'Chris Brown',
    username: 'chrisbrownofficial',
    followerCount: 144000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'r&b'],
    metrics: { engagementRate: 0.06, averageViews: 2800000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '7',
    name: 'Drake',
    username: 'champagnepapi',
    followerCount: 142000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'hip-hop'],
    metrics: { engagementRate: 0.04, averageViews: 3500000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '8',
    name: 'MrBeast',
    username: 'mrbeast',
    followerCount: 119000000,
    platform: 'tiktok',
    isVerified: true,
    tags: ['entertainment', 'challenges'],
    metrics: { engagementRate: 0.15, averageViews: 25000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '9',
    name: 'Bella Poarch',
    username: 'bellapoarch',
    followerCount: 93000000,
    platform: 'tiktok',
    isVerified: true,
    tags: ['music', 'viral'],
    metrics: { engagementRate: 0.18, averageViews: 20000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '10',
    name: 'Snoop Dogg',
    username: 'snoopdogg',
    followerCount: 89000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'lifestyle'],
    metrics: { engagementRate: 0.05, averageViews: 1800000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '11',
    name: 'Khaby',
    username: 'khaby00',
    followerCount: 79000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['comedy', 'viral'],
    metrics: { engagementRate: 0.08, averageViews: 2200000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '12',
    name: 'MrBeast',
    username: 'mrbeast',
    followerCount: 78000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['entertainment', 'charity'],
    metrics: { engagementRate: 0.12, averageViews: 5000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '13',
    name: 'Mark Rober',
    username: 'markrober',
    followerCount: 71000000,
    platform: 'youtube',
    isVerified: true,
    tags: ['science', 'engineering'],
    metrics: { engagementRate: 0.09, averageViews: 8000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '14',
    name: 'Will Smith',
    username: 'willsmith',
    followerCount: 70000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['entertainment', 'lifestyle'],
    metrics: { engagementRate: 0.07, averageViews: 3200000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '15',
    name: 'Travis Scott',
    username: 'travisscott',
    followerCount: 60000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'fashion'],
    metrics: { engagementRate: 0.06, averageViews: 2700000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '16',
    name: 'Huda Kattan',
    username: 'hudabeauty',
    followerCount: 57000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['beauty', 'makeup'],
    metrics: { engagementRate: 0.04, averageViews: 1500000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '17',
    name: 'Barstool Sports',
    username: 'barstoolsports',
    followerCount: 48000000,
    platform: 'tiktok',
    isVerified: true,
    tags: ['sports', 'comedy'],
    metrics: { engagementRate: 0.11, averageViews: 8000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '18',
    name: 'Tyga',
    username: 'tyga',
    followerCount: 46000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'lifestyle'],
    metrics: { engagementRate: 0.05, averageViews: 1200000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '19',
    name: 'BuzzFeed Tasty',
    username: 'buzzfeedtasty',
    followerCount: 45000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['food', 'cooking'],
    metrics: { engagementRate: 0.03, averageViews: 800000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '20',
    name: 'Jennifer Aniston',
    username: 'jenniferaniston',
    followerCount: 45000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['entertainment', 'lifestyle'],
    metrics: { engagementRate: 0.08, averageViews: 2800000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '21',
    name: 'TEDx Talks',
    username: 'tedx',
    followerCount: 44000000,
    platform: 'youtube',
    isVerified: true,
    tags: ['education', 'inspiration'],
    metrics: { engagementRate: 0.02, averageViews: 500000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '22',
    name: 'Charli DAmelio',
    username: 'charlidamelio',
    followerCount: 42000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['dance', 'lifestyle'],
    metrics: { engagementRate: 0.07, averageViews: 2500000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '23',
    name: 'Wiz Khalifa',
    username: 'wizkhalifa',
    followerCount: 40000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['music', 'lifestyle'],
    metrics: { engagementRate: 0.04, averageViews: 1000000 },
    created: new Date(),
    updated: new Date()
  },
  {
    id: '24',
    name: 'Formula 1',
    username: 'f1',
    followerCount: 38000000,
    platform: 'instagram',
    isVerified: true,
    tags: ['sports', 'racing'],
    metrics: { engagementRate: 0.06, averageViews: 1800000 },
    created: new Date(),
    updated: new Date()
  }
];

const SAMPLE_WATCHLISTS: Watchlist[] = [];

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  className,
  testId,
  ...props
}) => {
  // State management
  const [creators] = useState<Creator[]>(SAMPLE_CREATORS);
  const [watchlists, setWatchlists] = useState<Watchlist[]>(SAMPLE_WATCHLISTS);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter state
  const [filters, setFilters] = useState<CreatorFilters>({
    search: '',
    platforms: [
      { platform: 'instagram', enabled: false },
      { platform: 'youtube', enabled: false },
      { platform: 'tiktok', enabled: false }
    ],
    tags: [],
    verified: undefined
  });

  const itemsPerPage = 24;

  // Filter creators based on current filters and watchlist selection
  const filteredCreators = useMemo(() => {
    let filtered = creators;

    // Filter by watchlist
    if (selectedWatchlistId) {
      const watchlist = watchlists.find(w => w.id === selectedWatchlistId);
      if (watchlist) {
        filtered = filtered.filter(c => watchlist.creatorIds.includes(c.id));
      }
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.username.toLowerCase().includes(searchLower) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by platforms
    const enabledPlatforms = filters.platforms
      .filter(p => p.enabled)
      .map(p => p.platform);
    if (enabledPlatforms.length > 0) {
      filtered = filtered.filter(c => enabledPlatforms.includes(c.platform));
    }

    // Filter by verified status
    if (filters.verified !== undefined) {
      filtered = filtered.filter(c => c.isVerified === filters.verified);
    }

    return filtered;
  }, [creators, filters, selectedWatchlistId, watchlists]);

  // Paginated creators
  const paginatedCreators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCreators.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCreators, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);

  // Handle search
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  // Handle platform filter toggle
  const handlePlatformToggle = (platform: Platform) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.map(p => 
        p.platform === platform ? { ...p, enabled: !p.enabled } : p
      )
    }));
    setCurrentPage(1);
  };

  // Handle creator selection
  const handleCreatorSelect = (creatorId: string) => {
    setSelectedCreators(prev => 
      prev.includes(creatorId)
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  // Handle add to watchlist
  const handleAddToWatchlist = (creatorId: string) => {
    // This would typically open a modal to select or create a watchlist
    console.log('Add to watchlist:', creatorId);
  };

  // Handle watchlist management
  const handleCreateWatchlist = () => {
    console.log('Create new watchlist');
  };

  const handleEditWatchlist = (watchlistId: string) => {
    console.log('Edit watchlist:', watchlistId);
  };

  const handleDeleteWatchlist = (watchlistId: string) => {
    setWatchlists(prev => prev.filter(w => w.id !== watchlistId));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.querySelector('.main-content-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      css={pageStyles}
      className={clsx('channels-page', className)}
      data-testid={testId}
      {...props}
    >
      <main css={mainContentStyles}>
        {/* Header */}
        <header css={headerStyles}>
          <div css={headerTopStyles}>
            <div css={titleSectionStyles}>
              <h1 css={titleStyles}>Channels</h1>
              <p css={subtitleStyles}>
                Discover and track top channels to improve your content strategy
              </p>
            </div>
            
            <div css={trialSectionStyles}>
              <Button
                variant="primary"
                size="medium"
                testId={`${testId}-trial-button`}
              >
                Start a free trial
              </Button>
              <div css={processingNoteStyles}>
                <AlertCircle size={14} />
                <span>Why are some channels processing?</span>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div css={searchBarStyles}>
            <div css={searchInputContainerStyles}>
              <Input
                placeholder="Search for channels"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                iconBefore={<Search size={16} />}
                fullWidth
                testId={`${testId}-search`}
              />
              <Button
                variant="secondary"
                size="medium"
                iconBefore={<Search size={16} />}
                testId={`${testId}-search-button`}
              >
                Go
              </Button>
            </div>
            
            <div css={filtersContainerStyles}>
              {/* Platform filters */}
              {filters.platforms.map(({ platform, enabled }) => (
                <Button
                  key={platform}
                  variant={enabled ? 'secondary' : 'tertiary'}
                  size="medium"
                  onClick={() => handlePlatformToggle(platform)}
                  testId={`${testId}-filter-${platform}`}
                  style={enabled ? {
                    background: 'rgba(11, 92, 255, 0.08)',
                    borderColor: '#0B5CFF',
                    color: '#0B5CFF'
                  } : undefined}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Button>
              ))}
              
              <Button
                variant="tertiary"
                size="medium"
                iconBefore={<Plus size={16} />}
                testId={`${testId}-submit-channel`}
              >
                Submit new channel
              </Button>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div css={contentAreaStyles}>
          <div css={mainContentAreaStyles} className="main-content-area">
            {/* Grid Header */}
            <div css={gridHeaderStyles}>
              <div css={resultsCountStyles}>
                Showing {paginatedCreators.length} of {filteredCreators.length} channels
                {selectedWatchlistId && (
                  <span> in selected watchlist</span>
                )}
              </div>
              
              <div css={viewToggleStyles}>
                <button
                  data-active={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  data-active={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            
            {/* Content Grid */}
            <div css={gridContainerStyles}>
              {isLoading ? (
                <div css={loadingStateStyles}>
                  <Loader2 size={48} className="animate-spin" />
                  <p>Loading channels...</p>
                </div>
              ) : paginatedCreators.length === 0 ? (
                <div css={emptyStateStyles}>
                  <Search className="empty-icon" />
                  <h3 className="empty-title">No channels found</h3>
                  <p className="empty-description">
                    {filters.search || filters.platforms.some(p => p.enabled) 
                      ? 'Try adjusting your search criteria or filters'
                      : 'No channels available at the moment'
                    }
                  </p>
                  {filters.search || filters.platforms.some(p => p.enabled) ? (
                    <Button
                      variant="tertiary"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          search: '',
                          platforms: prev.platforms.map(p => ({ ...p, enabled: false }))
                        }));
                        setCurrentPage(1);
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <motion.div 
                  css={creatorsGridStyles}
                  layout
                  layoutRoot
                >
                  <AnimatePresence mode="popLayout">
                    {paginatedCreators.map((creator, index) => (
                      <motion.div
                        key={creator.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <CreatorCard
                          creator={creator}
                          isSelected={selectedCreators.includes(creator.id)}
                          onSelect={handleCreatorSelect}
                          onAddToWatchlist={handleAddToWatchlist}
                          testId={`${testId}-creator-${creator.id}`}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <DotPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                testId={`${testId}-pagination`}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Watchlist Sidebar */}
      <WatchlistSidebar
        watchlists={watchlists}
        creators={creators}
        selectedWatchlistId={selectedWatchlistId}
        onSelectWatchlist={setSelectedWatchlistId}
        onCreateWatchlist={handleCreateWatchlist}
        onEditWatchlist={handleEditWatchlist}
        onDeleteWatchlist={handleDeleteWatchlist}
        testId={`${testId}-sidebar`}
      />
    </div>
  );
};

ChannelsPage.displayName = 'ChannelsPage';