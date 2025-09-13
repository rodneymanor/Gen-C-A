# Emoji to Professional Icon Mapping

## Overview
This document provides a comprehensive mapping of remaining emojis in the Gen.C Alpha codebase to professional Atlassian Design System icons.

## 🎯 Priority Replacements (User-Facing)

### Navigation & Actions
| Current Emoji | Context | Atlassian Icon | Import Path | Usage |
|---------------|---------|----------------|-------------|-------|
| `☰` | Mobile menu toggle | `MenuIcon` | `@atlaskit/icon/glyph/menu` | `<MenuIcon label="Open menu" />` |
| `✏️` | Edit actions | `EditIcon` | `@atlaskit/icon/glyph/edit` | `<EditIcon label="Edit" />` |
| `👁️` | View/Preview actions | `WatchIcon` | `@atlaskit/icon/glyph/watch` | `<WatchIcon label="Preview" />` |
| `✓` | Checkmark/Selected | `CheckIcon` | `@atlaskit/icon/glyph/check` | `<CheckIcon label="Selected" />` |

### Content Types
| Current Emoji | Context | Atlassian Icon | Import Path | Usage |
|---------------|---------|----------------|-------------|-------|
| `🎥` | Video content | `VidPlayIcon` | `@atlaskit/icon/glyph/vid-play` | `<VidPlayIcon label="Video" />` |
| `📹` | Video camera/recording | `CameraIcon` | `@atlaskit/icon/glyph/camera` | `<CameraIcon label="Record video" />` |
| `📁` | Collections/Folders | `FolderIcon` | `@atlaskit/icon/glyph/folder` | `<FolderIcon label="Collection" />` |
| `👤` | User avatar/profile | `PersonIcon` | `@atlaskit/icon/glyph/person` | `<PersonIcon label="User" />` |
| `✍️` | Scripts/Writing | `EditIcon` | `@atlaskit/icon/glyph/edit` | `<EditIcon label="Script" />` |
| `📝` | Notes/Documents | `DocumentIcon` | `@atlaskit/icon/glyph/document` | `<DocumentIcon label="Note" />` |
| `📸` | Images/Photos | `ImageIcon` | `@atlaskit/icon/glyph/image` | `<ImageIcon label="Image" />` |
| `💡` | Ideas/Lightbulb | `LightbulbIcon` | `@atlaskit/icon/glyph/lightbulb` | `<LightbulbIcon label="Idea" />` |
| `📄` | Generic documents | `DocumentIcon` | `@atlaskit/icon/glyph/document` | `<DocumentIcon label="Document" />` |

### Status & Feedback
| Current Emoji | Context | Atlassian Icon | Import Path | Usage |
|---------------|---------|----------------|-------------|-------|
| `✨` | Magic/AI features | `StarIcon` | `@atlaskit/icon/glyph/star` | `<StarIcon label="AI powered" />` |
| `🔥` | Trending/Hot content | `FireIcon` | `@atlaskit/icon/glyph/emoji/frequent` | `<FireIcon label="Trending" />` |
| `🌟` | Featured/Special | `StarFilledIcon` | `@atlaskit/icon/glyph/star-filled` | `<StarFilledIcon label="Featured" />` |
| `🚀` | Launch/New features | `RocketIcon` | `@atlaskit/icon/glyph/shipping` | `<RocketIcon label="Launch" />` |

### Actions & Controls
| Current Emoji | Context | Atlassian Icon | Import Path | Usage |
|---------------|---------|----------------|-------------|-------|
| `🔍` | Search functionality | `SearchIcon` | `@atlaskit/icon/glyph/search` | `<SearchIcon label="Search" />` |
| `📊` | Analytics/Charts | `GraphLineIcon` | `@atlaskit/icon/glyph/graph-line` | `<GraphLineIcon label="Analytics" />` |
| `📥` | Import/Download | `DownloadIcon` | `@atlaskit/icon/glyph/download` | `<DownloadIcon label="Import" />` |
| `👥` | People/Team | `PeopleIcon` | `@atlaskit/icon/glyph/people` | `<PeopleIcon label="Team" />` |
| `🎯` | Target/Focus | `DiscoverIcon` | `@atlaskit/icon/glyph/discover` | `<DiscoverIcon label="Target" />` |
| `🎤` | Voice/Audio input | `AudioIcon` | `@atlaskit/icon/glyph/audio` | `<AudioIcon label="Voice input" />` |
| `⚏` | Grid view | `AppSwitcherIcon` | `@atlaskit/icon/glyph/app-switcher` | `<AppSwitcherIcon label="Grid view" />` |

### Platform Indicators
| Current Emoji | Context | Atlassian Icon | Import Path | Usage |
|---------------|---------|----------------|-------------|-------|
| `📱` | Mobile/TikTok | `MobileIcon` | `@atlaskit/icon/glyph/mobile` | `<MobileIcon label="Mobile" />` |
| `🐦` | Twitter | `PersonIcon` | `@atlaskit/icon/glyph/person` | `<PersonIcon label="Twitter" />` |
| `💼` | LinkedIn | `OfficeBuildingIcon` | `@atlaskit/icon/glyph/office-building` | `<OfficeBuildingIcon label="LinkedIn" />` |
| `🌐` | Web/Other platforms | `WorldIcon` | `@atlaskit/icon/glyph/world` | `<WorldIcon label="Web platform" />` |

## 🔧 Implementation Strategy

### Step 1: High Priority Files
1. **VideoGrid.tsx** - Multiple video-related emojis
2. **CollectionCard.tsx** - Collection and preview emojis  
3. **TrendingIdeas.tsx** - Trending and status emojis
4. **ScriptGenerator.tsx** - Action and brand emojis
5. **Layout.tsx** - Navigation menu emoji

### Step 2: Enhanced Components
1. **EnhancedLibrary.tsx** - Content type and action emojis
2. **Write.tsx** - Script content emojis
3. **Enhanced.tsx** - Feature status emojis

### Step 3: Implementation Pattern

```typescript
// Before (emoji-based):
<span className="trending-icon" aria-hidden="true">✨</span>

// After (professional icon):
import StarIcon from '@atlaskit/icon/glyph/star';
<StarIcon label="AI powered" size="medium" />
```

### Step 4: Component Updates

```typescript
// VideoGrid.tsx example replacement:
// Before:
<span>🎥</span>

// After:
import VidPlayIcon from '@atlaskit/icon/glyph/vid-play';
<VidPlayIcon label="Video content" />

// CollectionCard.tsx example replacement:
// Before:
<span>📁</span>

// After:
import FolderIcon from '@atlaskit/icon/glyph/folder';
<FolderIcon label="Collection" />
```

## 📝 Test File Updates

### Update Test Expectations
Tests currently expect emoji strings but should expect icon components or identifiers:

```typescript
// format.test.ts updates needed:
// Before:
expect(getPlatformIcon('tiktok')).toBe('📱');

// After:
expect(getPlatformIcon('tiktok')).toBe('mobile');
```

## ✅ Quality Checklist

- [ ] All user-facing emojis replaced with professional icons
- [ ] Consistent icon sizing (16px medium, 12px small)
- [ ] Proper accessibility labels
- [ ] Import statements optimized (specific imports, not full packages)
- [ ] Test files updated to match new icon system
- [ ] Documentation comments removed from CSS files
- [ ] README files updated with icon examples

## 🚀 Implementation Priority

### Phase 1 (Immediate - User-Facing)
1. VideoGrid.tsx - Video content icons
2. CollectionCard.tsx - Collection and action icons  
3. Layout.tsx - Navigation menu icon
4. TrendingIdeas.tsx - Trending indicators

### Phase 2 (Enhanced Components)
1. EnhancedLibrary.tsx - Content management icons
2. ScriptGenerator.tsx - Brand and action icons
3. Write.tsx - Content creation icons

### Phase 3 (Documentation & Tests)
1. Update test expectations
2. Clean up CSS comments
3. Update README examples

This mapping ensures a professional, consistent visual experience while maintaining semantic meaning across your React application.