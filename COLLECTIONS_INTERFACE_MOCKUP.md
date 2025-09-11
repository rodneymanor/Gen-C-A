# Gen.C Alpha - Collections Management Interface Mockup

## Design Overview

The Collections Management Interface serves as the primary workspace for organizing and browsing video content. It combines powerful filtering capabilities with an intuitive card-based layout, enhanced by Claude's warm design aesthetic and conversational interaction patterns.

---

## Layout Structure

### Desktop Layout (1280px+)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Page Header                                                                         │
│ ┌─ Collections / Video Library ────────── [+ New Collection] [Import] [View ▼] ─┐ │
│ │                                                                                 │ │
│ │ Breadcrumb: Home > Collections                                                 │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Main Content Area                                                                   │
│ ┌─────────────────┬───────────────────────────────────────────────────────────────┐ │
│ │ Collections     │ Video Grid & Filters                                          │ │
│ │ Sidebar         │                                                               │ │
│ │ (280px)         │ ┌─ Active Collection Header ─────────────────────────────────┐ │ │
│ │                 │ │ 🎬 Travel Content (24 videos)                             │ │ │
│ │ ⭐ Favorites     │ │ Last updated 2 hours ago                                   │ │ │
│ │   └─ Top Perf.  │ │ [📝 Generate Script] [📤 Export] [⚙️ Settings]           │ │ │
│ │   └─ Travel     │ └───────────────────────────────────────────────────────────┘ │ │
│ │                 │                                                               │ │
│ │ 🕒 Recent       │ ┌─ Filter Bar ──────────────────────────────────────────────┐ │ │
│ │   └─ Latest     │ │ [Search videos...] [All Platforms ▼] [Date ▼] [Sort ▼]   │ │ │
│ │   └─ Yesterday  │ │ Active filters: TikTok × Recent ×                         │ │ │
│ │                 │ └───────────────────────────────────────────────────────────┘ │ │
│ │ 📁 All Collect. │                                                               │ │
│ │   └─ Travel     │ ┌─ Video Grid (Responsive) ─────────────────────────────────┐ │ │
│ │   └─ Fitness    │ │                                                           │ │ │
│ │   └─ Food       │ │ ┌─────┬─────┬─────┬─────┐                                │ │ │
│ │   └─ Tech       │ │ │Video│Video│Video│Video│                                │ │ │
│ │                 │ │ │Card │Card │Card │Card │                                │ │ │
│ │ 🗑️ Trash        │ │ │     │     │     │     │                                │ │ │
│ │                 │ │ ├─────┼─────┼─────┼─────┤                                │ │ │
│ │ ┌─── Actions ───┐ │ │Video│Video│Video│Video│                                │ │ │
│ │ │+ New Collect. │ │ │Card │Card │Card │Card │                                │ │ │
│ │ │📥 Import      │ │ │     │     │     │     │                                │ │ │
│ │ │📤 Export All  │ │ └─────┴─────┴─────┴─────┘                                │ │ │
│ │ └───────────────┘ │                                                           │ │ │
│ │                   │ ┌─ Bulk Actions (when videos selected) ─────────────────┐ │ │ │
│ │                   │ │ ✓ 3 videos selected [Move to...] [Delete] [Export]   │ │ │ │
│ │                   │ └───────────────────────────────────────────────────────┘ │ │ │
│ │                   │                                                           │ │ │
│ │                   │ [Load More Videos] - Infinite scroll trigger             │ │ │
│ └─────────────────┴───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Collections Sidebar
```typescript
interface Collection {
  id: string;
  name: string;
  videoCount: number;
  lastUpdated: Date;
  isFavorite: boolean;
  thumbnail?: string;
  category: 'favorites' | 'recent' | 'all' | 'trash';
}

const CollectionsSidebar = ({ collections, activeCollection, onCollectionSelect }: CollectionsSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState(['favorites', 'recent', 'all']);
  
  const groupedCollections = {
    favorites: collections.filter(c => c.isFavorite),
    recent: collections.filter(c => isRecent(c.lastUpdated)).slice(0, 5),
    all: collections.filter(c => c.category === 'all'),
    trash: collections.filter(c => c.category === 'trash')
  };

  return (
    <aside className="collections-sidebar">
      <div className="sidebar-header">
        <Heading size="md" color="neutral-700">Collections</Heading>
        <Button
          appearance="subtle"
          iconBefore={<PlusIcon size="16" />}
          onClick={createNewCollection}
          size="small"
        >
          New
        </Button>
      </div>
      
      {/* Favorites Section */}
      <CollectionSection
        title="⭐ Favorites"
        isExpanded={expandedSections.includes('favorites')}
        onToggle={() => toggleSection('favorites')}
      >
        {groupedCollections.favorites.map(collection => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            isActive={activeCollection?.id === collection.id}
            onClick={() => onCollectionSelect(collection)}
            showVideoCount
            showThumbnail
          />
        ))}
      </CollectionSection>
      
      {/* Recent Section */}
      <CollectionSection
        title="🕒 Recent"
        isExpanded={expandedSections.includes('recent')}
        onToggle={() => toggleSection('recent')}
      >
        {groupedCollections.recent.map(collection => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            isActive={activeCollection?.id === collection.id}
            onClick={() => onCollectionSelect(collection)}
            showTimestamp
          />
        ))}
      </CollectionSection>
      
      {/* All Collections Section */}
      <CollectionSection
        title="📁 All Collections"
        isExpanded={expandedSections.includes('all')}
        onToggle={() => toggleSection('all')}
      >
        {groupedCollections.all.map(collection => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            isActive={activeCollection?.id === collection.id}
            onClick={() => onCollectionSelect(collection)}
            showVideoCount
            onContextMenu={(e) => showCollectionContextMenu(e, collection)}
          />
        ))}
      </CollectionSection>
      
      {/* Trash Section */}
      <CollectionSection
        title="🗑️ Trash"
        isExpanded={expandedSections.includes('trash')}
        onToggle={() => toggleSection('trash')}
      >
        <Text size="sm" color="neutral-500" style={{ padding: '8px 16px' }}>
          {groupedCollections.trash.length} deleted collections
        </Text>
      </CollectionSection>
      
      <div className="sidebar-actions">
        <ActionButton
          icon={<PlusIcon />}
          label="New Collection"
          onClick={createNewCollection}
          variant="primary"
        />
        <ActionButton
          icon={<ImportIcon />}
          label="Import Content"
          onClick={openImportDialog}
          variant="secondary"
        />
        <ActionButton
          icon={<ExportIcon />}
          label="Export All"
          onClick={exportAllCollections}
          variant="secondary"
        />
      </div>
    </aside>
  );
};
```

### Collection Header
```typescript
const CollectionHeader = ({ collection, onAction }: CollectionHeaderProps) => {
  const actions = [
    {
      id: 'generate-script',
      label: 'Generate Script',
      icon: EditIcon,
      appearance: 'primary' as const,
      onClick: () => onAction('generate-script', collection)
    },
    {
      id: 'export',
      label: 'Export',
      icon: ExportIcon,
      appearance: 'default' as const,
      onClick: () => onAction('export', collection)
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      appearance: 'subtle' as const,
      onClick: () => onAction('settings', collection)
    }
  ];

  return (
    <div className="collection-header">
      <div className="collection-info">
        <div className="collection-title">
          <Icon glyph="video" size="24" primaryColor="#F97316" />
          <Heading size="xl" color="neutral-800">
            {collection.name}
          </Heading>
          <Badge
            text={`${collection.videoCount} videos`}
            appearance="primary"
            max={99}
          />
        </div>
        
        <div className="collection-metadata">
          <Text size="sm" color="neutral-600">
            Last updated {formatRelativeTime(collection.lastUpdated)}
          </Text>
          <div className="metadata-divider">•</div>
          <Text size="sm" color="neutral-600">
            Created by {collection.createdBy}
          </Text>
          {collection.description && (
            <>
              <div className="metadata-divider">•</div>
              <Text size="sm" color="neutral-600" className="collection-description">
                {truncate(collection.description, 100)}
              </Text>
            </>
          )}
        </div>
      </div>
      
      <div className="collection-actions">
        <ButtonGroup>
          {actions.map(action => (
            <Button
              key={action.id}
              appearance={action.appearance}
              iconBefore={<action.icon size="16" />}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
};
```

### Filter Bar
```typescript
interface FilterState {
  search: string;
  platforms: Platform[];
  dateRange: DateRange | null;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

const FilterBar = ({ filters, onFiltersChange, videoCount }: FilterBarProps) => {
  const platformOptions = [
    { label: 'All Platforms', value: 'all' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Twitter', value: 'twitter' }
  ];
  
  const sortOptions = [
    { label: 'Date Added', value: 'date_added' },
    { label: 'Date Created', value: 'date_created' },
    { label: 'Title A-Z', value: 'title_asc' },
    { label: 'Creator', value: 'creator' },
    { label: 'Duration', value: 'duration' },
    { label: 'Engagement', value: 'engagement' }
  ];

  const activeFilters = getActiveFilters(filters);

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <div className="search-field">
          <SearchField
            placeholder="Search videos by title, creator, or content..."
            value={filters.search}
            onChange={(search) => onFiltersChange({ ...filters, search })}
            width="320px"
            appearance="subtle"
            icon={<SearchIcon />}
          />
        </div>
        
        <div className="filter-dropdowns">
          <Select
            placeholder="All Platforms"
            options={platformOptions}
            value={filters.platforms}
            isMulti
            onChange={(platforms) => onFiltersChange({ ...filters, platforms })}
            width="180px"
          />
          
          <DateRangePicker
            value={filters.dateRange}
            onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
            placeholder="Select date range"
          />
          
          <Select
            placeholder="Sort by"
            options={sortOptions}
            value={filters.sortBy}
            onChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
            width="160px"
          />
          
          <Button
            appearance="subtle"
            iconBefore={filters.sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
            onClick={() => onFiltersChange({
              ...filters,
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
            })}
            aria-label="Toggle sort order"
          />
        </div>
        
        <div className="view-controls">
          <ViewToggle
            views={['grid', 'list']}
            activeView="grid"
            onChange={setViewMode}
          />
          <Button
            appearance="subtle"
            iconBefore={<FilterIcon />}
            onClick={openAdvancedFilters}
          >
            Filters
          </Button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="active-filters">
          <Text size="sm" color="neutral-600">Filters:</Text>
          <div className="filter-tags">
            {activeFilters.map(filter => (
              <FilterTag
                key={filter.id}
                label={filter.label}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
          <Button
            appearance="subtle"
            size="small"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}
      
      <div className="results-summary">
        <Text size="sm" color="neutral-600">
          {videoCount} videos found
        </Text>
      </div>
    </div>
  );
};
```

### Video Card Component
```typescript
interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelect: (videoId: string) => void;
  onClick: (video: Video) => void;
  onAction: (action: string, video: Video) => void;
}

const VideoCard = ({ video, isSelected, onSelect, onClick, onAction }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      appearance="elevated"
      isClickable
      onClick={() => onClick(video)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('video-card', { 'video-card--selected': isSelected })}
    >
      {/* Selection Checkbox */}
      <div className="card-selection">
        <Checkbox
          isChecked={isSelected}
          onChange={() => onSelect(video.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      {/* Video Thumbnail */}
      <div className="card-media">
        <VideoThumbnail
          src={video.thumbnail}
          alt={video.title}
          duration={video.duration}
          aspectRatio="9:16"
          showPlayButton={isHovered}
        />
        
        {/* Platform Badge */}
        <div className="platform-badge">
          <Badge
            text={video.platform.toUpperCase()}
            appearance="primary"
          />
        </div>
        
        {/* Quick Actions Overlay */}
        {isHovered && (
          <div className="card-overlay">
            <ButtonGroup>
              <Button
                appearance="primary"
                iconBefore={<PlayIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('play', video);
                }}
                size="small"
              >
                Play
              </Button>
              <Button
                appearance="default"
                iconBefore={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('edit', video);
                }}
                size="small"
              />
            </ButtonGroup>
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="card-content">
        <div className="video-info">
          <Text weight="medium" color="neutral-800" className="video-title">
            {truncate(video.title, 60)}
          </Text>
          
          <div className="creator-info">
            <Avatar
              src={video.creator.avatar}
              name={video.creator.name}
              size="small"
            />
            <Text size="sm" color="neutral-600">
              {video.creator.name}
            </Text>
          </div>
        </div>
        
        <div className="video-metadata">
          <div className="metadata-row">
            <Text size="xs" color="neutral-500">
              {formatDate(video.createdAt)}
            </Text>
            <Text size="xs" color="neutral-500">
              {formatDuration(video.duration)}
            </Text>
          </div>
          
          {video.engagement && (
            <div className="engagement-stats">
              <EngagementIndicator
                views={video.engagement.views}
                likes={video.engagement.likes}
                size="small"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Card Actions */}
      <div className="card-actions">
        <DropdownMenu
          trigger={(
            <Button
              appearance="subtle"
              iconBefore={<MoreIcon />}
              size="small"
              aria-label="More actions"
            />
          )}
        >
          <DropdownItemGroup>
            <DropdownItem onClick={() => onAction('generate-script', video)}>
              Generate Script
            </DropdownItem>
            <DropdownItem onClick={() => onAction('add-to-collection', video)}>
              Add to Collection
            </DropdownItem>
            <DropdownItem onClick={() => onAction('download', video)}>
              Download
            </DropdownItem>
          </DropdownItemGroup>
          <DropdownItemGroup>
            <DropdownItem onClick={() => onAction('duplicate', video)}>
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => onAction('edit', video)}>
              Edit Details
            </DropdownItem>
          </DropdownItemGroup>
          <DropdownItemGroup>
            <DropdownItem onClick={() => onAction('delete', video)}>
              Delete
            </DropdownItem>
          </DropdownItemGroup>
        </DropdownMenu>
      </div>
    </Card>
  );
};
```

### Video Grid Container
```typescript
const VideoGrid = ({ videos, selectedVideos, onVideoSelect, onVideoClick }: VideoGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  return (
    <div className="video-grid-container">
      {selectedVideos.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedVideos.length}
          onAction={handleBulkAction}
          onClear={() => setSelectedVideos([])}
        />
      )}
      
      <div className={cn('video-grid', `video-grid--${viewMode}`)}>
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            isSelected={selectedVideos.includes(video.id)}
            onSelect={(videoId) => {
              const newSelection = selectedVideos.includes(videoId)
                ? selectedVideos.filter(id => id !== videoId)
                : [...selectedVideos, videoId];
              setSelectedVideos(newSelection);
            }}
            onClick={onVideoClick}
            onAction={handleVideoAction}
          />
        ))}
      </div>
      
      <InfiniteScrollTrigger
        onLoadMore={loadMoreVideos}
        hasMore={hasMoreVideos}
        isLoading={isLoading}
      />
    </div>
  );
};
```

---

## Responsive Design

### Tablet Layout (768px - 1023px)
```
┌───────────────────────────────────────────────────────┐
│ [≡] Collections    [Search...]    [+] [Import] [⚙]   │
├───────────────────────────────────────────────────────┤
│ 🎬 Travel Content (24 videos)                        │
│ [Generate Script] [Export] [Settings]                │
├───────────────────────────────────────────────────────┤
│ [Search] [Platform ▼] [Date ▼] [Sort ▼]              │
│ Active: TikTok × Recent ×                             │
├───────────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┐                       │
│ │  Video  │  Video  │  Video  │                       │
│ │  Card   │  Card   │  Card   │                       │
│ ├─────────┼─────────┼─────────┤                       │
│ │  Video  │  Video  │  Video  │                       │
│ │  Card   │  Card   │  Card   │                       │
│ └─────────┴─────────┴─────────┘                       │
└───────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────────────┐
│ [≡] Collections [🔍] [+]           │
├─────────────────────────────────────┤
│ 🎬 Travel Content                   │
│ 24 videos • Updated 2h ago          │
│ [Generate] [Export] [⋯]             │
├─────────────────────────────────────┤
│ [Search videos...]                  │
│ [All ▼] [Recent ▼] [⚙]             │
│ TikTok × Recent ×                   │
├─────────────────────────────────────┤
│ ┌───────────┬───────────┐           │
│ │   Video   │   Video   │           │
│ │   Card    │   Card    │           │
│ ├───────────┼───────────┤           │
│ │   Video   │   Video   │           │
│ │   Card    │   Card    │           │
│ └───────────┴───────────┘           │
│                                     │
│ [Load More Videos]                  │
└─────────────────────────────────────┘
```

---

## Styling Specifications

```scss
.collections-page {
  min-height: 100vh;
  background: $neutral-50;
  
  .page-header {
    background: $neutral-0;
    border-bottom: 1px solid $neutral-200;
    padding: $space-6 $space-8;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }
  }
  
  .main-content {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: $space-6;
    max-width: 1400px;
    margin: 0 auto;
    padding: $space-6 $space-8;
    
    @media (max-width: $bp-lg) {
      grid-template-columns: 1fr;
      padding: $space-4;
    }
  }
}

.collections-sidebar {
  background: $neutral-0;
  border-radius: $radius-lg;
  border: 1px solid $neutral-200;
  height: fit-content;
  
  .sidebar-header {
    padding: $space-6;
    border-bottom: 1px solid $neutral-200;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .collection-section {
    border-bottom: 1px solid $neutral-100;
    
    &:last-child {
      border-bottom: none;
    }
    
    .section-header {
      padding: $space-4 $space-6;
      background: $neutral-50;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      &:hover {
        background: $neutral-100;
      }
    }
  }
}

.collection-header {
  background: $neutral-0;
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-md;
  margin-bottom: $space-6;
  
  .collection-info {
    margin-bottom: $space-6;
    
    .collection-title {
      display: flex;
      align-items: center;
      gap: $space-3;
      margin-bottom: $space-2;
    }
    
    .collection-metadata {
      display: flex;
      align-items: center;
      gap: $space-2;
      
      .metadata-divider {
        color: $neutral-400;
      }
    }
  }
}

.video-grid {
  display: grid;
  gap: $space-6;
  
  &--grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    
    @media (max-width: $bp-md) {
      grid-template-columns: repeat(2, 1fr);
      gap: $space-4;
    }
    
    @media (max-width: $bp-sm) {
      grid-template-columns: repeat(2, 1fr);
      gap: $space-3;
    }
  }
  
  &--list {
    grid-template-columns: 1fr;
  }
}

.video-card {
  position: relative;
  background: $neutral-0;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
  transition: all $duration-normal $ease-in-out;
  
  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
  
  &--selected {
    border: 2px solid $claude-orange-500;
    box-shadow: $shadow-warm-md;
  }
  
  .card-selection {
    position: absolute;
    top: $space-3;
    left: $space-3;
    z-index: 2;
    
    .checkbox {
      background: rgba(255, 255, 255, 0.9);
      border-radius: $radius-sm;
      padding: $space-1;
    }
  }
  
  .card-media {
    position: relative;
    aspect-ratio: 9/16;
    overflow: hidden;
    
    .platform-badge {
      position: absolute;
      top: $space-3;
      right: $space-3;
      z-index: 2;
    }
    
    .card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity $duration-normal;
      
      .video-card:hover & {
        opacity: 1;
      }
    }
  }
  
  .card-content {
    padding: $space-4;
    
    .video-info {
      margin-bottom: $space-3;
      
      .video-title {
        margin-bottom: $space-2;
        line-height: $leading-tight;
      }
      
      .creator-info {
        display: flex;
        align-items: center;
        gap: $space-2;
      }
    }
    
    .video-metadata {
      .metadata-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: $space-2;
      }
    }
  }
  
  .card-actions {
    position: absolute;
    top: $space-3;
    right: $space-12;
    z-index: 2;
    opacity: 0;
    transition: opacity $duration-normal;
    
    .video-card:hover & {
      opacity: 1;
    }
  }
}
```

This Collections Management Interface provides a comprehensive, scalable solution for organizing and browsing video content while maintaining Claude's warm, user-friendly aesthetic and powerful functionality.