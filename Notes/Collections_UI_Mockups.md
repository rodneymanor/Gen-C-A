# Collections UI Mockups - Visual Design Specifications

## 1. Video Thumbnail Cards Grid

### 1.1 Desktop Grid Layout (4 Columns)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  COLLECTIONS                                                           [Filter ▼] [+ Video]  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                                    │
│  │[TikTok] ⋮│  │[IG] ⭐   ⋮│  │[TikTok]  ⋮│  │[IG]     ⋮│                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │   VIDEO  │  │   VIDEO  │  │   VIDEO  │  │   VIDEO  │                                    │
│  │THUMBNAIL │  │THUMBNAIL │  │THUMBNAIL │  │THUMBNAIL │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │   9:16   │  │   9:16   │  │   9:16   │  │   9:16   │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │    ▶️    │  │    ▶️    │  │    ▶️    │  │    ▶️    │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │  👁 1.2M │  │  👁 850K │  │  👁 2.1M │  │  👁 456K │                                    │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤                                    │
│  │ 👤 @user │  │ 👤 @user │  │ 👤 @user │  │ 👤 @user │                                    │
│  │ Creator1 │  │ Creator2 │  │ Creator3 │  │ Creator4 │                                    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                                    │
│                                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                                    │
│  │[IG] ⭐   ⋮│  │[TikTok]  ⋮│  │[IG]     ⋮│  │[TikTok] ⋮│                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │   VIDEO  │  │   VIDEO  │  │   VIDEO  │  │   VIDEO  │                                    │
│  │THUMBNAIL │  │THUMBNAIL │  │THUMBNAIL │  │THUMBNAIL │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │   9:16   │  │   9:16   │  │   9:16   │  │   9:16   │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │    ▶️    │  │    ▶️    │  │    ▶️    │  │    ▶️    │                                    │
│  │          │  │          │  │          │  │          │                                    │
│  │  👁 623K │  │  👁 1.8M │  │  👁 299K │  │  👁 1.1M │                                    │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤                                    │
│  │ 👤 @user │  │ 👤 @user │  │ 👤 @user │  │ 👤 @user │                                    │
│  │ Creator5 │  │ Creator6 │  │ Creator7 │  │ Creator8 │                                    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                                    │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mobile Grid Layout (1 Column)

```
┌─────────────────────────────────┐
│ ≡ COLLECTIONS        [Filter ▼] │
├─────────────────────────────────┤
│                                 │
│        ┌─────────────┐           │
│        │[TikTok]    ⋮│           │
│        │             │           │
│        │    VIDEO    │           │
│        │  THUMBNAIL  │           │
│        │             │           │
│        │    9:16     │           │
│        │             │           │
│        │             │           │
│        │             │           │
│        │     ▶️      │           │
│        │             │           │
│        │   👁 1.2M   │           │
│        ├─────────────┤           │
│        │ 👤 @creator │           │
│        │   Name      │           │
│        └─────────────┘           │
│                                 │
│        ┌─────────────┐           │
│        │[IG] ⭐      ⋮│           │
│        │             │           │
│        │    VIDEO    │           │
│        │  THUMBNAIL  │           │
│        │             │           │
│        │    9:16     │           │
│        │             │           │
│        │             │           │
│        │             │           │
│        │     ▶️      │           │
│        │             │           │
│        │   👁 850K   │           │
│        ├─────────────┤           │
│        │ 👤 @creator │           │
│        │   Name      │           │
│        └─────────────┘           │
│                                 │
└─────────────────────────────────┘
```

### 1.3 Card Specifications

#### Individual Video Card Layout
```
┌─────────────────────────────┐
│ [Platform] ⭐(if fav)     ⋮ │  ← Top overlay: Platform badge, favorite star, menu
│                             │
│                             │
│        THUMBNAIL            │  ← Main thumbnail area (9:16 aspect ratio)
│         IMAGE               │
│        (9:16 ratio)         │  ← Hover state shows play button overlay
│                             │
│          ▶️                 │  ← Play button (visible on hover)
│                             │
│                             │
│   👁 [View Count]          │  ← Bottom overlay: View count
├─────────────────────────────┤
│ 👤 @creator_handle          │  ← Creator section with avatar and name
│ Creator Display Name        │
└─────────────────────────────┘
```

#### Hover States
- **Card Hover**: Subtle scale (1.05x) and shadow elevation
- **Play Button**: Appears with fade-in animation (opacity 0 → 0.8)
- **Thumbnail Overlay**: Dark overlay (black/50%) for better contrast
- **Context Menu**: Three-dot menu becomes visible

#### Interactive Elements
- **Platform Badge**: Color-coded (TikTok: black, Instagram: gradient, YouTube: red)
- **Favorite Star**: Gold star when favorited, gray outline when not
- **Context Menu Options**:
  ```
  👁 View Insights
  ⭐ Add to Favorites / Remove from Favorites  
  ───────────────
  📁 Move to Collection
  📋 Copy to Collection
  ───────────────
  🗑️ Delete
  ```

## 2. Video Modal Popup - Desktop Layout

### 2.1 Full Modal Layout (Split View)
```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        [X]    │
│  ┌─────────────────────────────────────────┐│┌─┐│┌─────────────────────────────────────────┐  │
│  │                                         ││ ▲││                                         │  │
│  │              VIDEO PLAYER               ││  ││             INSIGHTS PANEL              │  │
│  │                                         ││ ▼││                                         │  │
│  │   ┌─────────────────────────────────┐   ││  ││  ┌─────┬─────┬─────┬─────┬─────────┐    │  │
│  │   │                                 │   ││  ││  │Video│Script│Hooks│Analytics│More│    │  │
│  │   │                                 │   ││  ││  └─────┴─────┴─────┴─────┴─────────┘    │  │
│  │   │                                 │   ││  ││                                         │  │
│  │   │        TIKTOK/INSTAGRAM         │   ││  ││  📹 Video Title Here                    │  │
│  │   │           VIDEO EMBED           │   ││  ││  👤 @creator_name • TikTok              │  │
│  │   │                                 │   ││  ││  📊 1.2M views • 85K likes             │  │
│  │   │            (9:16 or             │   ││  ││  ⏱️ 0:32 duration                      │  │
│  │   │           responsive)           │   ││  ││                                         │  │
│  │   │                                 │   ││  ││  ─────────────────────────────────────  │  │
│  │   │                                 │   ││  ││                                         │  │
│  │   │         ▶️ ⏸️ 🔊 ⏱️           │   ││  ││  📝 FULL TRANSCRIPT                     │  │
│  │   │                                 │   ││  ││  ┌─────────────────────────────────┐   │  │
│  │   │                                 │   ││  ││  │ "Hey everyone! Today I'm going  │   │  │
│  │   │                                 │   ││  ││  │ to show you the most incredible │   │  │
│  │   └─────────────────────────────────┘   ││  ││  │ hack that will change your life │   │  │
│  │                                         ││  ││  │ forever. You won't believe how  │   │  │
│  │                                         ││  ││  │ simple this is..."              │   │  │
│  │                                         ││  ││  │                                 │   │  │
│  │                                         ││  ││  │ [Continue transcript...]         │   │  │
│  │                                         ││  ││  └─────────────────────────────────┘   │  │
│  │                                         ││  ││                                         │  │
│  │                                         ││  ││  📋 SCRIPT COMPONENTS                   │  │
│  │                                         ││  ││  ┌─ H ─┬─ Hook ────────────────────┐   │  │
│  │                                         ││  ││  │ "Hey everyone! Today I'm..."  [📋] │  │
│  │                                         ││  ││  └───────────────────────────────────┘   │  │
│  │                                         ││  ││  ┌─ B ─┬─ Bridge ──────────────────┐   │  │
│  │                                         ││  ││  │ "going to show you the most..." [📋] │  │
│  └─────────────────────────────────────────┘│  ││  └───────────────────────────────────┘   │  │
│                    ↑                         │  ││  ┌─ G ─┬─ Golden Nugget ──────────┐   │  │
│              Flexible width                  │  ││  │ "incredible hack that will..." [📋] │  │
│             (maintains ratio)                │  ││  └───────────────────────────────────┘   │  │
│                                              │  ││  ┌─ C ─┬─ Call to Action ─────────┐   │  │
│                                              │  ││  │ "You won't believe how simple"[📋] │  │
│         ┌─ Navigation Strip ─┐               │  ││  └───────────────────────────────────┘   │  │
│         │  [Background blur]  │               │  ││                                         │  │
│         │    ▲ Previous       │               │  ││  📊 PERFORMANCE METRICS                 │  │
│         │    ▼ Next          │               │  ││  Readability: 8.2/10                   │  │
│         └───────────────────┘               │  ││  Engagement: 7.8/10                    │  │
│                                              │  ││  Hook Strength: 9.1/10                 │  │
│                                              │  ││                                         │  │
│                                              │  ││  [📥 Download] [📋 Copy All]           │  │
│                                              │  ││                                         │  │
│                                              │  └┘  ← 600px fixed width                   │  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Modal Components Breakdown

#### Video Player Section (Left Side)
- **Flexible Width**: Adjusts to maintain video aspect ratio
- **Responsive Video**: TikTok/Instagram embed or direct video player
- **Standard Controls**: Play/pause, volume, scrubber, fullscreen
- **Background**: Black background for letterboxing if needed

#### Navigation Strip (Center)
- **Width**: 64px thin vertical strip
- **Background**: Dark gradient with blur effect
- **Buttons**: Vertical up/down arrows for prev/next video
- **Styling**: Semi-transparent with hover states
- **Position**: Floating overlay between video and insights

#### Insights Panel (Right Side)
- **Fixed Width**: 600px
- **Tabs**: Video, Script, Hooks, Analytics, More
- **Scrollable Content**: Vertical scroll for long content
- **Sections**:
  - Video metadata (title, creator, stats)
  - Full transcript (scrollable text area)
  - Script components (expandable cards with copy buttons)
  - Performance metrics (progress bars and scores)
  - Action buttons (download, copy, etc.)

## 3. Video Modal Popup - Mobile Layout

### 3.1 Mobile Modal Layout (Stacked)
```
┌─────────────────────────────────────────────┐
│                                      [X]    │
│  ┌─────────────────────────────────────────┐ │
│  │                                         │ │
│  │           VIDEO PLAYER                  │ │
│  │                                         │ │
│  │   ┌─────────────────────────────────┐   │ │
│  │   │                                 │   │ │
│  │   │     TIKTOK/INSTAGRAM           │   │ │
│  │   │        VIDEO EMBED              │   │ │
│  │   │                                 │   │ │
│  │   │       (Full width,              │   │ │
│  │   │      responsive height)         │   │ │
│  │   │                                 │   │ │
│  │   │     ▶️ ⏸️ 🔊 ⏱️             │   │ │
│  │   │                                 │   │ │
│  │   └─────────────────────────────────┘   │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │           INSIGHTS PANEL                │ │
│  │                                         │ │
│  │ ┌─────┬─────┬─────┬──────┬──────────┐   │ │
│  │ │Video│Script│Hooks│Stats │More     │   │ │
│  │ └─────┴─────┴─────┴──────┴──────────┘   │ │
│  │                                         │ │
│  │ 📹 Video Title Here                     │ │
│  │ 👤 @creator_name • TikTok               │ │
│  │ 📊 1.2M views • 85K likes              │ │
│  │ ⏱️ 0:32 duration                       │ │
│  │                                         │ │
│  │ ──────────────────────────────────────  │ │
│  │                                         │ │
│  │ 📝 TRANSCRIPT                           │ │
│  │ ┌─────────────────────────────────────┐ │ │
│  │ │ "Hey everyone! Today I'm going to   │ │ │
│  │ │ show you the most incredible hack   │ │ │
│  │ │ that will change your life..."      │ │ │
│  │ │                                     │ │ │
│  │ │ [Scrollable content continues...]   │ │ │
│  │ └─────────────────────────────────────┘ │ │
│  │                                         │ │
│  │ 📋 SCRIPT COMPONENTS                    │ │
│  │ ┌─ Hook ──────────────────────────────┐ │ │
│  │ │ "Hey everyone! Today I'm..."      📋│ │ │
│  │ └─────────────────────────────────────┘ │ │
│  │ ┌─ Bridge ────────────────────────────┐ │ │
│  │ │ "going to show you the most..."   📋│ │ │
│  │ └─────────────────────────────────────┘ │ │
│  │                                         │ │
│  │ ↓ Scrollable content continues...      │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐  │
│ │        NAVIGATION (Bottom)              │  │
│ │                                         │  │
│ │  [← Previous]          [Next →]        │  │
│ │                                         │  │
│ └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 4. Design System Specifications

### 4.1 Colors and Styling

design system  appropriate colors and styles 

```

## 5. Interactive States and Animations

design system appropriate states and animations

This mockup document provides comprehensive visual specifications for implementing the collections video grid and modal popup functionality, including responsive layouts, styling details, and accessibility considerations.