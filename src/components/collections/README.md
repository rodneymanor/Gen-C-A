# Collections Components

This directory contains React components for displaying and managing video collections in the Gen.C Alpha Dashboard.

## Components

### VideoGrid

A responsive grid component for displaying video thumbnail cards with interactive features.

**Features:**
- **9:16 Aspect Ratio Cards**: Optimized for mobile-first video content (TikTok, Instagram, etc.)
- **Platform Badges**: Visual indicators for TikTok, Instagram, YouTube, etc.
- **Interactive Elements**: 
  - Hover effects with play button overlay
  - Favorite star toggle
  - Context menu (3-dots) for additional actions
  - View count display
  - Creator information
- **Responsive Design**: 4-column desktop → 1-column mobile layout
- **Bulk Selection**: Multi-select mode for batch operations
- **Accessibility**: Full keyboard navigation and screen reader support

**Props:**
- `videos`: Array of ContentItem objects to display
- `onVideoSelect`: Callback for video selection/click
- `onVideoPlay`: Callback for play button click
- `onVideoFavorite`: Callback for favorite toggle
- `onVideoContextMenu`: Callback for context menu interactions
- `selectedVideos`: Array of selected video IDs (for bulk actions)
- `favoriteVideos`: Array of favorited video IDs
- `showBulkActions`: Boolean to enable multi-select mode

### VideoModal

A comprehensive modal popup for viewing video content with detailed insights panel.

**Features:**
- **Split Layout**: Video player (left) + insights panel (right, 600px fixed width)
- **Mobile Responsive**: Stacked layout on mobile devices
- **Video Player**: Embedded iframe support for TikTok, Instagram, YouTube
- **Navigation Strip**: Vertical navigation between videos with prev/next buttons
- **Tabbed Insights Panel**:
  - **Video Tab**: Title, creator info, stats, full transcript
  - **Script Tab**: Breakdown of hook, bridge, golden nugget, CTA components
  - **Analytics Tab**: Performance metrics (readability, engagement, hook strength)
  - **More Tabs**: Extensible for additional features
- **Copy Functionality**: Copy individual script components or all content
- **Keyboard Navigation**: ESC to close, arrow keys for video navigation
- **Accessibility**: Focus management, screen reader support

**Props:**
- `isOpen`: Boolean to control modal visibility
- `video`: Current ContentItem being displayed
- `videos`: Array of all videos for navigation
- `onClose`: Callback to close the modal
- `onNavigateVideo`: Callback for prev/next navigation

### CollectionCard

Display card for collection overview with preview thumbnails.

**Features:**
- Collection metadata display
- Preview thumbnails (up to 4 videos)
- Platform badges
- Favorite toggle
- Action buttons (View, Edit)

### CollectionsExample

A complete example implementation showing how to use all components together.

**Features:**
- Video grid with all interactive features
- Modal integration
- Bulk selection mode
- Filtering and sorting controls
- State management examples

## Usage

```tsx
import { VideoGrid, VideoModal, CollectionsExample } from './components/collections';

// Basic usage
<VideoGrid 
  videos={videos}
  onVideoPlay={handleVideoPlay}
  onVideoFavorite={handleFavorite}
  favoriteVideos={favoriteIds}
/>

// With modal
<VideoModal
  isOpen={modalOpen}
  video={selectedVideo}
  videos={allVideos}
  onClose={() => setModalOpen(false)}
  onNavigateVideo={handleNavigation}
/>

// Complete example
<CollectionsExample />
```

## Design System Integration

These components follow the established design patterns:

- **Atlassian Design System**: Uses ADS icons, tokens, and styling patterns
- **Emotion CSS-in-JS**: Styled with emotion for dynamic theming
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts
- **Accessibility**: WCAG AA compliant with proper ARIA labels and keyboard navigation
- **Design Tokens**: Consistent spacing, colors, and typography from the design system

## Key Features Implemented

✅ **9:16 Video Card Aspect Ratio**: Optimized for mobile video content  
✅ **Platform Badges**: TikTok, Instagram, YouTube visual indicators  
✅ **Interactive Elements**: Hover states, favorite toggle, context menus  
✅ **View Count Display**: Formatted view counts with abbreviated numbers  
✅ **Video Modal**: Desktop split-view and mobile stacked layouts  
✅ **Tabbed Insights Panel**: Video, Script, Hooks, Analytics, More tabs  
✅ **Script Components**: Hook, Bridge, Golden Nugget, CTA breakdown  
✅ **Copy Functionality**: Copy individual components or all content  
✅ **Video Navigation**: Navigate between videos within modal  
✅ **Responsive Design**: 4-column desktop → 1-column mobile  
✅ **Accessibility**: Full keyboard navigation and screen reader support  

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design tested on various screen sizes

## Performance Considerations

- Lazy loading for video thumbnails
- Efficient state management for large video collections
- Optimized CSS with emotion for minimal bundle impact
- Proper cleanup of event listeners and modal state