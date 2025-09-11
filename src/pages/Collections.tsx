import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { CollectionCard } from '../components/collections/CollectionCard';
import { VideoGrid } from '../components/collections/VideoGrid';
import type { Collection, ContentItem } from '../types';

// Atlassian Design System Icons
import SearchIcon from '@atlaskit/icon/glyph/search';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import AddIcon from '@atlaskit/icon/glyph/add';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import ChartIcon from '@atlaskit/icon/glyph/graph-line';
import MobileIcon from '@atlaskit/icon/glyph/mobile';
import ImageIcon from '@atlaskit/icon/glyph/image';
import VideoIcon from '@atlaskit/icon/glyph/vid-play';
import CalendarIcon from '@atlaskit/icon/glyph/calendar';
import StarIcon from '@atlaskit/icon/glyph/star';
import StarFilledIcon from '@atlaskit/icon/glyph/star-filled';
import NatureIcon from '@atlaskit/icon/glyph/emoji/nature';

const collectionsStyles = css`
  max-width: 1200px;
  margin: 0 auto;
`;

const headerStyles = css`
  display: flex;
  justify-content: between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }
  
  .header-content {
    flex: 1;
    
    h1 {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }
    
    .subtitle {
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }
  
  .header-actions {
    display: flex;
    gap: var(--space-3);
    
    @media (max-width: 768px) {
      flex-wrap: wrap;
    }
  }
`;

const filtersStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .search-container {
    flex: 1;
    max-width: 400px;
    
    @media (max-width: 768px) {
      max-width: none;
    }
  }
  
  .filter-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
      justify-content: center;
    }
  }
  
  .sort-container {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    
    label {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-700);
      white-space: nowrap;
    }
  }
`;

const favoritesStyles = css`
  margin-bottom: var(--space-8);
  
  .favorites-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    
    h2 {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
    
    .favorites-icon {
      font-size: 20px;
    }
  }
  
  .favorites-grid {
    display: flex;
    gap: var(--space-4);
    overflow-x: auto;
    padding-bottom: var(--space-2);
    
    .favorite-item {
      min-width: 200px;
      padding: var(--space-3) var(--space-4);
      /* Perplexity Flat Design - Minimal favorites */
      background: transparent;
      border: 1px solid var(--color-neutral-200);
      border-radius: var(--radius-medium);
      cursor: pointer;
      transition: var(--transition-colors);
      
      &:hover {
        border-color: var(--color-primary-500);  /* Claude orange accent on hover */
        /* REMOVED: Background and transform for flat design */
      }
      
      .favorite-icon {
        margin-right: var(--space-2);
      }
      
      .favorite-name {
        font-size: var(--font-size-body-small);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin: 0;
      }
    }
  }
`;

const collectionsGridStyles = css`
  .collections-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    
    h2 {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
    
    .collections-count {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-600);
    }
  }
  
  .collections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
`;

const newCollectionCardStyles = css`
  border: 2px dashed var(--color-neutral-300);
  background: transparent;  /* Perplexity flat design */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  cursor: pointer;
  transition: var(--transition-all);
  
  /* Perplexity Flat Design - Minimal hover */
  &:hover {
    border-color: var(--color-primary-500);  /* Claude orange accent */
    /* REMOVED: Background and transform for flat design */
  }
  
  .new-icon {
    font-size: 48px;
    margin-bottom: var(--space-4);
    opacity: 0.6;
  }
  
  .new-title {
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-700);
    margin: 0 0 var(--space-2) 0;
  }
  
  .new-description {
    font-size: var(--font-size-body-small);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
`;

const detailViewStyles = css`
  .detail-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    
    .back-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .collection-title {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
  
  .collection-info-bar {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
  }
  
  .video-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-3);
    }
    
    .video-search {
      flex: 1;
      max-width: 400px;
    }
    
    .video-filters {
      display: flex;
      gap: var(--space-2);
    }
  }
`;

// Mock data
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Summer Vibes Collection',
    description: 'Bright, energetic content perfect for summer campaigns and seasonal posts',
    thumbnail: '',
    tags: ['summer', 'lifestyle', 'bright'],
    platforms: ['tiktok', 'instagram'],
    videoCount: 23,
    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  },
  {
    id: '2',
    name: 'Product Launch',
    description: 'Professional videos showcasing our latest product features and benefits',
    thumbnail: '',
    tags: ['product', 'professional', 'launch'],
    platforms: ['youtube'],
    videoCount: 15,
    created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  },
  {
    id: '3',
    name: 'Tutorial Series',
    description: 'Step-by-step educational content for our community',
    thumbnail: '',
    tags: ['education', 'tutorial', 'community'],
    platforms: ['youtube', 'tiktok'],
    videoCount: 8,
    created: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isPrivate: false,
    previewVideos: []
  }
];

const mockVideos: ContentItem[] = [
  {
    id: '1',
    title: 'Beach Day Transformation',
    description: 'Quick summer makeup look perfect for beach days',
    type: 'video',
    platform: 'tiktok',
    thumbnail: '',
    duration: 15,
    tags: ['makeup', 'summer', 'beach'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'published',
    metadata: {}
  },
  {
    id: '2',
    title: 'Summer Skincare Routine',
    description: 'Essential skincare steps for hot weather',
    type: 'video',
    platform: 'instagram',
    thumbnail: '',
    duration: 23,
    tags: ['skincare', 'routine', 'summer'],
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'published',
    metadata: {}
  }
];

export const Collections: React.FC = () => {
  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  const favorites = ['Summer Content', 'Brand Guidelines', 'Viral Hooks'];

  const handleCreateCollection = () => {
    console.log('Create new collection');
  };

  const handleImportVideos = () => {
    console.log('Import videos');
  };

  const handleViewCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setView('detail');
  };

  const handleEditCollection = (collection: Collection) => {
    console.log('Edit collection:', collection.id);
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedCollection(null);
  };

  const handleVideoSelect = (video: ContentItem) => {
    setSelectedVideos(prev => 
      prev.includes(video.id) 
        ? prev.filter(id => id !== video.id)
        : [...prev, video.id]
    );
  };

  const handleVideoPlay = (video: ContentItem) => {
    console.log('Play video:', video.id);
  };

  const filteredCollections = mockCollections.filter(collection => 
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === 'detail' && selectedCollection) {
    return (
      <div css={collectionsStyles}>
        <div css={detailViewStyles}>
          <div className="detail-header">
            <Button
              variant="subtle"
              onClick={handleBackToGrid}
              className="back-button"
            >
              ← Back to Collections
            </Button>
            <h1 className="collection-title">{selectedCollection.name}</h1>
          </div>

          <div className="collection-info-bar">
            <Card appearance="subtle" spacing="comfortable">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <NatureIcon label="Collection theme" />
                  <div>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {selectedCollection.name}
                    </h2>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-body-small)', color: 'var(--color-neutral-600)' }}>
                      {selectedCollection.videoCount} videos · Created {selectedCollection.created.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {selectedCollection.description && (
                  <p style={{ margin: 0, color: 'var(--color-neutral-700)', lineHeight: 'var(--line-height-relaxed)' }}>
                    "{selectedCollection.description}"
                  </p>
                )}
              </div>
            </Card>

            <Card appearance="raised" spacing="comfortable">
              <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-h5)' }}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <Button variant="primary" fullWidth>
                  + Add Videos
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth
                  iconBefore={<RefreshIcon label="" />}
                >
                  Bulk Actions
                </Button>
                <Button 
                  variant="subtle" 
                  fullWidth
                  iconBefore={<SettingsIcon label="" />}
                >
                  Collection Settings
                </Button>
                <Button 
                  variant="subtle" 
                  fullWidth
                  iconBefore={<ChartIcon label="" />}
                >
                  Analytics
                </Button>
              </div>
            </Card>
          </div>

          <div className="video-controls">
            <div className="video-search">
              <Input
                placeholder="Search videos..."
                iconBefore={<SearchIcon label="" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="video-filters">
              <Button 
                variant={platformFilter === 'tiktok' ? 'primary' : 'subtle'} 
                size="small"
              >
                TikTok
              </Button>
              <Button 
                variant={platformFilter === 'instagram' ? 'primary' : 'subtle'} 
                size="small"
              >
                Instagram
              </Button>
              <Button 
                variant="subtle" 
                size="small"
              >
                Newest
              </Button>
            </div>
          </div>

          <VideoGrid
            videos={mockVideos}
            onVideoSelect={handleVideoSelect}
            onVideoPlay={handleVideoPlay}
            selectedVideos={selectedVideos}
            showBulkActions={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div css={collectionsStyles}>
      <div css={headerStyles}>
        <div className="header-content">
          <h1>Collections</h1>
          <p className="subtitle">Organize your video content</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="secondary" 
            onClick={handleImportVideos}
            iconBefore={<DownloadIcon label="" />}
          >
            Import Videos
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateCollection}
            iconBefore={<AddIcon label="" />}
          >
            Create Collection
          </Button>
        </div>
      </div>

      <div css={filtersStyles}>
        <div className="search-container">
          <Input
            placeholder="Search collections..."
            iconBefore={<SearchIcon label="" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <Button variant={platformFilter === 'all' ? 'primary' : 'subtle'} size="small">
            All
          </Button>
          <Button 
            variant={platformFilter === 'tiktok' ? 'primary' : 'subtle'} 
            size="small"
          >
            TikTok
          </Button>
          <Button 
            variant={platformFilter === 'instagram' ? 'primary' : 'subtle'} 
            size="small"
          >
            Instagram
          </Button>
          <Button 
            variant={platformFilter === 'youtube' ? 'primary' : 'subtle'} 
            size="small"
          >
            YouTube
          </Button>
        </div>
        <div className="sort-container">
          <label htmlFor="sort-select">Sort:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-medium)',
              fontSize: 'var(--font-size-body-small)',
            }}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      <div css={favoritesStyles}>
        <div className="favorites-header">
          <StarFilledIcon label="Favorites" />
          <h2>Favorites</h2>
        </div>
        <div className="favorites-grid">
          {favorites.map(favorite => (
            <div key={favorite} className="favorite-item">
              <StarIcon label="" />
              <p className="favorite-name">{favorite}</p>
            </div>
          ))}
        </div>
      </div>

      <div css={collectionsGridStyles}>
        <div className="collections-header">
          <h2>All Collections</h2>
          <span className="collections-count">
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="collections-grid">
          {filteredCollections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onView={handleViewCollection}
              onEdit={handleEditCollection}
            />
          ))}
          <Card css={newCollectionCardStyles} onClick={handleCreateCollection}>
            <div className="new-icon"><AddIcon label="Create new collection" size="xlarge" /></div>
            <h3 className="new-title">Create New Collection</h3>
            <p className="new-description">
              Create a new collection to organize your video content
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};