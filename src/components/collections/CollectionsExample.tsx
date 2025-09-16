import React, { useState } from 'react';
import { css } from '@emotion/react';
import { VideoGrid, VideoModal } from './index';
import { Button } from '../ui/Button';
import type { ContentItem } from '../../types';

const exampleStyles = css`
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    
    h1 {
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-bold);
      color: var(--color-neutral-800);
      margin: 0;
    }
    
    .actions {
      display: flex;
      gap: var(--space-3);
    }
  }
  
  .filters {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
    padding: var(--space-4);
    background: var(--color-neutral-50);
    border-radius: var(--radius-medium);
    border: 1px solid var(--color-neutral-200);
    
    select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-neutral-300);
      border-radius: var(--radius-small);
      background: white;
      font-size: var(--font-size-body);
      min-height: 40px;
    }
  }
`;

// Mock video data for demonstration
const mockVideos: ContentItem[] = [
  {
    id: '1',
    title: 'Amazing TikTok Hook Strategy That Gets 10M+ Views',
    description: 'Learn the secret technique used by top creators',
    type: 'video',
    platform: 'tiktok',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.tiktok.com/embed/v2/1234567890',
    duration: 32,
    tags: ['hooks', 'viral', 'strategy'],
    creator: 'viral_creator_01',
    created: new Date('2024-01-15'),
    updated: new Date('2024-01-15'),
    status: 'published',
    metadata: { views: 1200000, likes: 85000, shares: 12000 }
  },
  {
    id: '2',
    title: 'Instagram Reel That Broke the Algorithm',
    description: 'This video shows the perfect formula for viral reels',
    type: 'video',
    platform: 'instagram',
    thumbnail: 'https://images.unsplash.com/photo-1494790108755-2616b612b047?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.instagram.com/reel/ABC123/embed',
    duration: 28,
    tags: ['algorithm', 'viral', 'reels'],
    creator: 'insta_pro_creator',
    created: new Date('2024-01-14'),
    updated: new Date('2024-01-14'),
    status: 'published',
    metadata: { views: 850000, likes: 62000, shares: 8500 }
  },
  {
    id: '3',
    title: 'YouTube Shorts Success Blueprint',
    description: 'How to create shorts that get millions of views',
    type: 'video',
    platform: 'youtube',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: 45,
    tags: ['youtube', 'shorts', 'blueprint'],
    creator: 'youtube_master',
    created: new Date('2024-01-13'),
    updated: new Date('2024-01-13'),
    status: 'published',
    metadata: { views: 2100000, likes: 150000, shares: 22000 }
  },
  {
    id: '4',
    title: 'TikTok Trend Analysis - What\'s Working Now',
    description: 'Deep dive into current trends and how to leverage them',
    type: 'video',
    platform: 'tiktok',
    thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.tiktok.com/embed/v2/9876543210',
    duration: 52,
    tags: ['trends', 'analysis', 'strategy'],
    creator: 'trend_analyzer',
    created: new Date('2024-01-12'),
    updated: new Date('2024-01-12'),
    status: 'published',
    metadata: { views: 456000, likes: 28000, shares: 5200 }
  },
  {
    id: '5',
    title: 'Instagram Story Engagement Hacks',
    description: 'Boost your story views and engagement with these tips',
    type: 'video',
    platform: 'instagram',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.instagram.com/reel/XYZ789/embed',
    duration: 37,
    tags: ['stories', 'engagement', 'hacks'],
    creator: 'story_specialist',
    created: new Date('2024-01-11'),
    updated: new Date('2024-01-11'),
    status: 'published',
    metadata: { views: 623000, likes: 41000, shares: 7800 }
  },
  {
    id: '6',
    title: 'Viral Content Formula Revealed',
    description: 'The exact formula top creators use to go viral',
    type: 'video',
    platform: 'tiktok',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.tiktok.com/embed/v2/5555666677',
    duration: 29,
    tags: ['viral', 'formula', 'content'],
    creator: 'viral_expert',
    created: new Date('2024-01-10'),
    updated: new Date('2024-01-10'),
    status: 'published',
    metadata: { views: 1800000, likes: 120000, shares: 18000 }
  },
  {
    id: '7',
    title: 'Social Media Monetization Strategies',
    description: 'Turn your social media presence into a profitable business',
    type: 'video',
    platform: 'youtube',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.youtube.com/embed/xyz123abc',
    duration: 68,
    tags: ['monetization', 'business', 'strategy'],
    creator: 'biz_creator',
    created: new Date('2024-01-09'),
    updated: new Date('2024-01-09'),
    status: 'published',
    metadata: { views: 299000, likes: 18500, shares: 3400 }
  },
  {
    id: '8',
    title: 'Content Creation Workflow',
    description: 'How I create 100+ pieces of content per month',
    type: 'video',
    platform: 'instagram',
    thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop&crop=face',
    url: 'https://www.instagram.com/reel/DEF456/embed',
    duration: 41,
    tags: ['workflow', 'productivity', 'content'],
    creator: 'workflow_wizard',
    created: new Date('2024-01-08'),
    updated: new Date('2024-01-08'),
    status: 'published',
    metadata: { views: 1100000, likes: 75000, shares: 11000 }
  }
];

export const CollectionsExample: React.FC = () => {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<string[]>(['2', '5']);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [modalVideo, setModalVideo] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoSelect = (video: ContentItem) => {
    if (showBulkActions) {
      setSelectedVideos(prev => 
        prev.includes(video.id) 
          ? prev.filter(id => id !== video.id)
          : [...prev, video.id]
      );
    } else {
      setModalVideo(video);
      setIsModalOpen(true);
    }
  };

  const handleVideoPlay = (video: ContentItem) => {
    setModalVideo(video);
    setIsModalOpen(true);
  };

  const handleVideoFavorite = (video: ContentItem) => {
    setFavoriteVideos(prev => 
      prev.includes(video.id)
        ? prev.filter(id => id !== video.id)
        : [...prev, video.id]
    );
  };

  const handleVideoContextMenu = (video: ContentItem, event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    // In a real app, this would show a context menu
    console.log('Context menu for video:', video.title);
    
    // Mock context menu options
    const options = [
      'View Insights',
      favoriteVideos.includes(video.id) ? 'Remove from Favorites' : 'Add to Favorites',
      '---',
      'Move to Collection',
      'Copy to Collection',
      '---',
      'Delete'
    ];
    
    alert(`Context menu for "${video.title}":\n${options.join('\n')}`);
  };

  const handleNavigateVideo = (direction: 'prev' | 'next') => {
    if (!modalVideo) return;
    
    const currentIndex = mockVideos.findIndex(v => v.id === modalVideo.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : mockVideos.length - 1;
    } else {
      newIndex = currentIndex < mockVideos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setModalVideo(mockVideos[newIndex]);
  };

  const toggleBulkActions = () => {
    setShowBulkActions(!showBulkActions);
    setSelectedVideos([]);
  };

  return (
    <div css={exampleStyles}>
      <div className="header">
        <h1>Video Collections</h1>
        <div className="actions">
          <Button variant="secondary" onClick={toggleBulkActions}>
            {showBulkActions ? 'Cancel Selection' : 'Select Videos'}
          </Button>
          <Button variant="primary">
            + Add Video
          </Button>
        </div>
      </div>

      <div className="filters">
        <select defaultValue="">
          <option value="">All Platforms</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>
        <select defaultValue="">
          <option value="">All Tags</option>
          <option value="viral">Viral</option>
          <option value="strategy">Strategy</option>
          <option value="hooks">Hooks</option>
        </select>
        <select defaultValue="created">
          <option value="created">Sort by Date</option>
          <option value="views">Sort by Views</option>
          <option value="title">Sort by Title</option>
        </select>
      </div>

      {showBulkActions && selectedVideos.length > 0 && (
        <div style={{ 
          padding: 'var(--space-4)', 
          marginBottom: 'var(--space-4)',
          background: 'var(--color-primary-50)',
          borderRadius: 'var(--radius-medium)',
          border: '1px solid var(--color-primary-200)'
        }}>
          <strong>{selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected</strong>
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="primary" size="small">Add to Collection</Button>
            <Button variant="secondary" size="small">Download</Button>
            <Button variant="subtle" size="small">Delete</Button>
          </div>
        </div>
      )}

      <VideoGrid
        videos={mockVideos}
        onVideoSelect={handleVideoSelect}
        onVideoPlay={handleVideoPlay}
        onVideoFavorite={handleVideoFavorite}
        onVideoContextMenu={handleVideoContextMenu}
        selectedVideos={selectedVideos}
        favoriteVideos={favoriteVideos}
        showBulkActions={showBulkActions}
      />

      <VideoModal
        isOpen={isModalOpen}
        video={modalVideo}
        videos={mockVideos}
        onClose={() => setIsModalOpen(false)}
        onNavigateVideo={handleNavigateVideo}
      />
    </div>
  );
};