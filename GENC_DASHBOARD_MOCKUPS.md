# Gen.C Alpha Dashboard - Claude-Inspired UI Mockups

## Overview

This document presents comprehensive UI mockups for the Gen.C Alpha dashboard, designed with Claude's conversational and approachable aesthetic while maintaining the platform's powerful content creation capabilities. The design emphasizes clarity, warmth, and intelligent information hierarchy.

---

## 1. Main Dashboard Layout

### Hero Section & Quick Actions
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Gen.C Alpha Dashboard                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Welcome back, Sarah! ────────────────────────┐  ┌─ Quick Actions ─────┐ │
│  │                                                │  │                     │ │
│  │ Today you've saved 12 videos and generated    │  │  🎬 New Collection  │ │
│  │ 3 scripts. Ready to create something amazing? │  │  ✍️  Generate Script │ │
│  │                                                │  │  📚 Browse Library  │ │
│  │ 📊 This week: 47 videos, 8 scripts            │  │  🤖 AI Assistant    │ │
│  └────────────────────────────────────────────────┘  └─────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Recent Activity                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 🎥 Added "Summer Vibes Collection" · 2 hours ago                        │ │
│ │ ✨ Generated script for TikTok hook · 4 hours ago                       │ │
│ │ 📖 Saved article "Content Trends 2024" · Yesterday                      │ │
│ │ 👤 Created persona "Fitness Influencer" · 2 days ago                    │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Navigation Sidebar
```
┌─ Navigation ──────────────┐
│                           │
│ 🏠 Dashboard              │
│                           │
│ ── Content ──             │
│ 📁 Collections        12 │
│ 📚 Library           247 │
│ ✍️  Write                 │
│                           │
│ ── Brand ──               │
│ 👥 Brand Hub          5  │
│                           │
│ ── Tools ──               │
│ 🔌 Extensions             │
│ 📱 Mobile Shortcuts       │
│                           │
│ ── Account ──             │
│ ⚙️  Settings              │
│ 💡 Help & Support         │
│                           │
│ ┌─── User Menu ─────────┐ │
│ │ 👤 Sarah Chen         │ │
│ │    Premium Plan       │ │
│ │                       │ │
│ │ Profile Settings      │ │
│ │ Sign Out             │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

### Component Specifications

#### Welcome Hero Section
```typescript
// Claude-inspired warm welcome section
<div className="dashboard-hero">
  <Card appearance="subtle" spacing="comfortable">
    <div className="hero-content">
      <div className="welcome-section">
        <Heading size="large" color="warmNeutral800">
          Welcome back, {user.name}! 👋
        </Heading>
        <Text size="medium" color="warmNeutral600">
          Today you've saved {todayStats.videos} videos and generated{' '}
          {todayStats.scripts} scripts. Ready to create something amazing?
        </Text>
        
        <div className="stats-summary">
          <Badge appearance="gentle" max={999}>
            📊 This week: {weekStats.videos} videos, {weekStats.scripts} scripts
          </Badge>
        </div>
      </div>
      
      <div className="quick-actions">
        <Heading size="small" color="warmNeutral700">
          Quick Actions
        </Heading>
        <ButtonGroup direction="vertical" spacing="comfortable">
          <Button 
            appearance="primary" 
            iconBefore={<CollectionIcon />}
            onClick={createCollection}
          >
            New Collection
          </Button>
          <Button 
            appearance="default" 
            iconBefore={<EditIcon />}
            onClick={generateScript}
          >
            Generate Script
          </Button>
          <Button 
            appearance="subtle" 
            iconBefore={<LibraryIcon />}
            onClick={browseLibrary}
          >
            Browse Library
          </Button>
        </ButtonGroup>
      </div>
    </div>
  </Card>
</div>
```

#### Recent Activity Feed
```typescript
// Conversational activity feed
<div className="activity-feed">
  <Heading size="medium" color="warmNeutral800">
    Recent Activity
  </Heading>
  
  <div className="activity-list">
    {activities.map(activity => (
      <Card key={activity.id} appearance="raised" isClickable>
        <div className="activity-item">
          <div className="activity-icon">
            <Icon 
              glyph={activity.type} 
              size="medium" 
              primaryColor="warmPrimary500" 
            />
          </div>
          
          <div className="activity-content">
            <Text weight="medium" color="warmNeutral800">
              {activity.description}
            </Text>
            <Text size="small" color="warmNeutral500">
              {formatTimeAgo(activity.timestamp)}
            </Text>
          </div>
          
          <Button 
            appearance="subtle" 
            iconBefore={<ChevronRightIcon />}
            onClick={() => navigateToActivity(activity)}
          >
            View
          </Button>
        </div>
      </Card>
    ))}
  </div>
</div>
```

---

## 2. Collections Management Interface

### Collections Grid View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Collections · Organize your video content                                  │
│ ┌─ Create Collection ─┐ ┌─ Import Videos ─┐ ┌─ View Settings ─┐           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔍 Search collections...     📱 Platform: All ▼    📅 Sort: Recent ▼       │
│                                                                             │
│ ┌─── Favorites ────────────────────────────────────────────────────────────┐ │
│ │                                                                           │ │
│ │ ⭐ Summer Content     ⭐ Brand Guidelines    ⭐ Viral Hooks              │ │
│ │                                                                           │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─── All Collections ──────────────────────────────────────────────────────┐ │
│ │                                                                           │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │ │
│ │ │ Summer Vibes    │ │ Product Launch  │ │ Tutorial Series │              │ │
│ │ │ 23 videos       │ │ 15 videos       │ │ 8 videos        │              │ │
│ │ │ 📱 TikTok, IG    │ │ 🎥 YouTube      │ │ 🎬 Mixed        │              │ │
│ │ │                 │ │                 │ │                 │              │ │
│ │ │ [Preview] [Edit]│ │ [Preview] [Edit]│ │ [Preview] [Edit]│              │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘              │ │
│ │                                                                           │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─ + New ─────────┐              │ │
│ │ │ Behind Scenes   │ │ User Reviews    │ │ Create a new    │              │ │
│ │ │ 12 videos       │ │ 9 videos        │ │ collection to   │              │ │
│ │ │ 📱 Instagram     │ │ 🎥 All platforms│ │ organize your   │              │ │
│ │ │                 │ │                 │ │ video content   │              │ │
│ │ │ [Preview] [Edit]│ │ [Preview] [Edit]│ │                 │              │ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────┘              │ │
│ │                                                                           │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Collection Detail View with Video Grid
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Collections                           Summer Vibes Collection     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ Collection Info ────────────────────────┐ ┌─ Actions ──────────────────┐ │
│ │                                          │ │                            │ │
│ │ 🌴 Summer Vibes Collection               │ │ + Add Videos               │ │
│ │    23 videos · Created June 15           │ │ 🔄 Bulk Actions            │ │
│ │                                          │ │ ⚙️  Collection Settings     │ │
│ │ "Bright, energetic content perfect for  │ │ 📊 Analytics               │ │
│ │  summer campaigns and seasonal posts"   │ │                            │ │
│ │                                          │ │                            │ │
│ └──────────────────────────────────────────┘ └────────────────────────────┘ │
│                                                                             │
│ 🔍 Search videos...    📱 TikTok ▼    🎨 Bright ▼    📅 Newest ▼           │
│                                                                             │
│ ┌─── Video Grid ─────────────────────────────────────────────────────────────┐ │
│ │                                                                           │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │ │
│ │ │▶ 0:15 │ │▶ 0:23 │ │▶ 0:18 │ │▶ 0:31 │ │▶ 0:12 │ │▶ 0:29 │              │ │
│ │ │       │ │       │ │       │ │       │ │       │ │       │              │ │
│ │ │🌊Beach│ │🌞Sun  │ │🏖️Sand │ │🌴Palm │ │🍹Drink│ │🎵Music│              │ │
│ │ │Day    │ │Vibes  │ │Castle │ │Trees  │ │Time   │ │Video  │              │ │
│ │ │       │ │       │ │       │ │       │ │       │ │       │              │ │
│ │ │📱 TT  │ │📱 TT  │ │📸 IG  │ │📱 TT  │ │📸 IG  │ │🎥 YT  │              │ │
│ │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘              │ │
│ │                                                                           │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │ │
│ │ │▶ 0:45 │ │▶ 0:19 │ │▶ 0:33 │ │▶ 0:27 │ │▶ 0:21 │ │▶ 0:16 │              │ │
│ │ │       │ │       │ │       │ │       │ │       │ │       │              │ │
│ │ │⛱️Sunset│ │🌺Flow │ │🏄Surf │ │🎪Fun  │ │🌈Bright│ │☀️Golden│              │ │
│ │ │Beach  │ │Crown  │ │Session│ │Times  │ │Colors │ │Hour   │              │ │
│ │ │       │ │       │ │       │ │       │ │       │ │       │              │ │
│ │ │📸 IG  │ │📱 TT  │ │🎥 YT  │ │📱 TT  │ │📸 IG  │ │🎥 YT  │              │ │
│ │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘              │ │
│ │                                                                           │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Collection Card Component
```typescript
// Warm, approachable collection cards
<Card 
  appearance="elevated" 
  spacing="comfortable"
  isHoverable
  onClick={openCollection}
  className="collection-card"
>
  <div className="card-header">
    <div className="collection-info">
      <Heading size="medium" color="warmNeutral800">
        {collection.name}
      </Heading>
      <Text size="small" color="warmNeutral600">
        {collection.videoCount} videos · Created {formatDate(collection.created)}
      </Text>
    </div>
    
    <div className="collection-meta">
      <div className="platform-badges">
        {collection.platforms.map(platform => (
          <Badge key={platform} appearance="primary" spacing="comfortable">
            {getPlatformIcon(platform)} {platform}
          </Badge>
        ))}
      </div>
    </div>
  </div>
  
  <div className="card-content">
    <Text color="warmNeutral700">
      {collection.description}
    </Text>
    
    <div className="preview-thumbnails">
      {collection.previewVideos.slice(0, 4).map(video => (
        <img 
          key={video.id} 
          src={video.thumbnail} 
          alt={video.title}
          className="preview-thumb"
        />
      ))}
      {collection.videoCount > 4 && (
        <div className="more-videos">
          +{collection.videoCount - 4}
        </div>
      )}
    </div>
  </div>
  
  <div className="card-actions">
    <ButtonGroup spacing="comfortable">
      <Button 
        appearance="subtle" 
        iconBefore={<EyeIcon />}
        onClick={previewCollection}
      >
        Preview
      </Button>
      <Button 
        appearance="default" 
        iconBefore={<EditIcon />}
        onClick={editCollection}
      >
        Edit
      </Button>
    </ButtonGroup>
  </div>
</Card>
```

#### Video Grid Item
```typescript
// Individual video cards within collections
<Card 
  appearance="raised" 
  spacing="compact"
  isHoverable
  onClick={openVideoModal}
  className="video-card"
>
  <div className="video-thumbnail">
    <img src={video.thumbnail} alt={video.title} />
    <div className="video-duration">
      <Badge appearance="neutral" spacing="compact">
        ▶ {formatDuration(video.duration)}
      </Badge>
    </div>
    
    <div className="video-overlay">
      <Button 
        appearance="primary" 
        iconBefore={<PlayIcon />}
        size="small"
      >
        Play
      </Button>
    </div>
  </div>
  
  <div className="video-info">
    <Text weight="medium" size="small" color="warmNeutral800">
      {video.title}
    </Text>
    
    <div className="video-meta">
      <Badge appearance="primary" size="small">
        {getPlatformIcon(video.platform)} {video.platform}
      </Badge>
      
      <Text size="xsmall" color="warmNeutral500">
        {formatDate(video.created)}
      </Text>
    </div>
  </div>
</Card>
```

---

## 3. AI Script Generation Workspace

### Script Generation Interface
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Script Writer · Create engaging content with AI assistance              │
│ ┌─ Templates ▼ ─┐ ┌─ Saved Scripts ─┐ ┌─ Voice Input ─┐ ┌─ Export ─────┐   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─── Daily Inspiration ─────────────────── ✨ Trending Today ─────────────┐ │
│ │                                                                         │ │
│ │ 🔥 "Beach day transformation" • 847K views • TikTok                     │ │
│ │ 🌟 "Simple summer makeup look" • 623K views • Instagram                 │ │
│ │ 💡 "5-minute productivity hack" • 1.2M views • YouTube                  │ │
│ │                                                                         │ │
│ │ ┌─ Explore More Ideas ─────────────────────────────────────────────────┐ │ │
│ │ │ Get personalized content suggestions based on your brand            │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─── Script Generation ───────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ What would you like to create today?                                    │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Tell me about your video idea...                                    │ │ │
│ │ │                                                                     │ │ │
│ │ │ e.g., "A fun TikTok about summer skincare routine for teens"       │ │ │
│ │ │                                                                     │ │ │
│ │ │                                                                     │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ Settings ──────────────┐ ┌─ Brand Voice ────────────────────────────┐ │ │
│ │ │                         │ │                                          │ │ │
│ │ │ 🤖 AI Model: Creative ▼ │ │ 👤 Persona: Summer Lifestyle ▼          │ │ │
│ │ │ 📏 Length: Short (15s) ▼│ │ 🎯 Tone: Energetic & Fun                │ │ │
│ │ │ 🎨 Style: Engaging ▼    │ │ 📱 Platform: TikTok optimized            │ │ │
│ │ │ 🎯 Platform: TikTok ▼   │ │                                          │ │ │
│ │ │                         │ │ ✨ This will create content that         │ │ │
│ │ └─────────────────────────┘ │    matches your brand personality        │ │ │
│ │                             └──────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ Generate Script ─────────────┐ ┌─ Use Voice Input ──────────────────┐ │ │
│ │ │ ✨ Create with AI             │ │ 🎤 Record your idea                 │ │ │
│ │ └───────────────────────────────┘ └─────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Script Editing Interface
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Your Generated Script · Ready for refinement                               │
│ ┌─ Save to Library ─┐ ┌─ Export ─┐ ┌─ Regenerate ─┐ ┌─ Voice Preview ─────┐ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─── Script Editor ───────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ 🎬 Summer Skincare Routine for Teens                                   │ │
│ │                                                                         │ │
│ │ [HOOK - First 3 seconds]                                                │ │
│ │ "Wait, you're using WHAT on your face this summer? 😱"                  │ │
│ │                                                                         │ │
│ │ [PROBLEM - Seconds 3-6]                                                 │ │
│ │ "If you're still using heavy moisturizers in this heat,                │ │
│ │ your skin is probably feeling gross and oily..."                        │ │
│ │                                                                         │ │
│ │ [SOLUTION - Seconds 6-12]                                               │ │
│ │ "Here's my 3-step summer skincare routine that keeps                    │ │
│ │ my skin glowing without the grease:                                     │ │
│ │                                                                         │ │
│ │ 1. Gentle foam cleanser (removes sweat & sunscreen)                     │ │
│ │ 2. Lightweight serum with hyaluronic acid                               │ │
│ │ 3. SPF 30+ moisturizer (non-comedogenic!)                              │ │
│ │                                                                         │ │
│ │ [CALL TO ACTION - Seconds 12-15]                                        │ │
│ │ "Try this for one week and comment your before/after!                   │ │
│ │ Follow for more teen skincare tips 💫"                                   │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─── Script Insights ─────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ ✅ Engaging hook within 3 seconds                                       │ │
│ │ ✅ Clear problem-solution structure                                      │ │
│ │ ✅ Strong call-to-action                                                │ │
│ │ ⚠️  Consider adding trending hashtags                                    │ │
│ │ 💡 Estimated engagement: High (based on similar content)               │ │
│ │                                                                         │ │
│ │ 📊 Script Stats: 15 seconds • 87 words • TikTok optimized              │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### AI Script Generation Form
```typescript
// Conversational script generation interface
<div className="script-generation-workspace">
  <div className="daily-inspiration">
    <Card appearance="subtle" spacing="comfortable">
      <div className="inspiration-header">
        <Heading size="medium" color="warmNeutral800">
          ✨ Daily Inspiration
        </Heading>
        <Text size="small" color="warmNeutral600">
          Trending Today
        </Text>
      </div>
      
      <div className="trending-content">
        {trendingIdeas.map(idea => (
          <div key={idea.id} className="trending-item">
            <Text weight="medium" color="warmNeutral800">
              {idea.emoji} "{idea.title}" • {idea.views} views • {idea.platform}
            </Text>
          </div>
        ))}
        
        <Button 
          appearance="subtle" 
          iconBefore={<ExploreIcon />}
          onClick={exploreTrends}
        >
          Explore More Ideas
        </Button>
      </div>
    </Card>
  </div>
  
  <div className="generation-form">
    <Card appearance="elevated" spacing="comfortable">
      <Heading size="medium" color="warmNeutral800">
        What would you like to create today?
      </Heading>
      
      <Field name="scriptIdea" label="" isRequired>
        {({ fieldProps }) => (
          <TextArea
            {...fieldProps}
            placeholder="Tell me about your video idea...

e.g., 'A fun TikTok about summer skincare routine for teens'"
            rows={4}
            resize="vertical"
          />
        )}
      </Field>
      
      <div className="generation-settings">
        <div className="ai-settings">
          <Heading size="small" color="warmNeutral700">
            Settings
          </Heading>
          
          <Field name="aiModel" label="AI Model">
            {({ fieldProps }) => (
              <Select
                {...fieldProps}
                options={aiModelOptions}
                placeholder="Creative"
              />
            )}
          </Field>
          
          <Field name="length" label="Length">
            {({ fieldProps }) => (
              <Select
                {...fieldProps}
                options={lengthOptions}
                placeholder="Short (15s)"
              />
            )}
          </Field>
        </div>
        
        <div className="brand-voice">
          <Heading size="small" color="warmNeutral700">
            Brand Voice
          </Heading>
          
          <Field name="persona" label="Persona">
            {({ fieldProps }) => (
              <Select
                {...fieldProps}
                options={personaOptions}
                placeholder="Select persona"
              />
            )}
          </Field>
          
          <div className="persona-preview">
            <Text size="small" color="warmNeutral600">
              ✨ This will create content that matches your brand personality
            </Text>
          </div>
        </div>
      </div>
      
      <div className="generation-actions">
        <ButtonGroup spacing="comfortable">
          <Button 
            appearance="primary" 
            iconBefore={<MagicIcon />}
            onClick={generateScript}
            size="large"
          >
            ✨ Generate Script
          </Button>
          <Button 
            appearance="default" 
            iconBefore={<MicrophoneIcon />}
            onClick={useVoiceInput}
            size="large"
          >
            🎤 Use Voice Input
          </Button>
        </ButtonGroup>
      </div>
    </Card>
  </div>
</div>
```

#### Script Editor Component
```typescript
// Rich script editor with AI insights
<div className="script-editor">
  <div className="editor-header">
    <Heading size="large" color="warmNeutral800">
      Your Generated Script
    </Heading>
    <Text color="warmNeutral600">
      Ready for refinement
    </Text>
  </div>
  
  <div className="editor-content">
    <div className="script-text">
      <Editor
        appearance="full-width"
        placeholder="Your script will appear here..."
        value={scriptContent}
        onChange={handleScriptChange}
        primaryToolbarComponents={[
          'heading',
          'bold',
          'italic',
          'bullet-list',
          'numbered-list'
        ]}
      />
    </div>
    
    <div className="script-insights">
      <Card appearance="subtle" spacing="comfortable">
        <Heading size="small" color="warmNeutral800">
          Script Insights
        </Heading>
        
        <div className="insights-list">
          {scriptInsights.map(insight => (
            <div key={insight.id} className="insight-item">
              <div className="insight-icon">
                {insight.type === 'success' && '✅'}
                {insight.type === 'warning' && '⚠️'}
                {insight.type === 'suggestion' && '💡'}
              </div>
              <Text size="small" color="warmNeutral700">
                {insight.message}
              </Text>
            </div>
          ))}
        </div>
        
        <div className="script-stats">
          <Text size="small" color="warmNeutral600">
            📊 Script Stats: {scriptStats.duration} seconds • {scriptStats.words} words • {scriptStats.platform} optimized
          </Text>
        </div>
      </Card>
    </div>
  </div>
  
  <div className="editor-actions">
    <ButtonGroup spacing="comfortable">
      <Button appearance="primary" iconBefore={<SaveIcon />}>
        Save to Library
      </Button>
      <Button appearance="default" iconBefore={<ExportIcon />}>
        Export
      </Button>
      <Button appearance="subtle" iconBefore={<RefreshIcon />}>
        Regenerate
      </Button>
    </ButtonGroup>
  </div>
</div>
```

---

## 4. Content Library View

### Unified Content Library
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Content Library · Your creative asset repository                           │
│ ┌─ Add Content ▼ ─┐ ┌─ Import ────┐ ┌─ Export Selected ─┐ ┌─ Settings ───┐ │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 🔍 Search all content...    📁 Type: All ▼  📅 Date: All time ▼  🔄 Sync   │
│                                                                             │
│ ┌─── Quick Filters ────────────────────────────────────────────────────────┐ │
│ │ [All] [Scripts] [Videos] [Images] [Notes] [Ideas] [Saved Posts]         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────┬───────────────┐ │
│ │ Content List                                            │ Preview Panel │ │
│ │                                                         │               │ │
│ │ ☐ ✍️  Summer Skincare Script                    Script  │ ┌───────────┐ │ │
│ │    "Wait, you're using WHAT on your face..."    Today   │ │           │ │ │
│ │                                                         │ │  Script   │ │ │
│ │ ☐ 🎥 Beach Day Transformation                   Video   │ │  Preview  │ │ │
│ │    TikTok • 0:15 • 247K views                 Yesterday │ │           │ │ │
│ │                                                         │ │  [View]   │ │ │
│ │ ☐ 💡 Content Ideas - July Batch                 Ideas  │ │  [Edit]   │ │ │
│ │    "10 summer content ideas for lifestyle..."  2 days  │ │  [Notes]  │ │ │
│ │                                                         │ │           │ │ │
│ │ ☐ 📸 Product Photos - Sunscreen Collection     Images  │ └───────────┘ │ │
│ │    12 high-res images • Beach themed          3 days   │               │ │
│ │                                                         │ ┌─ Actions ─┐ │ │
│ │ ☐ 🌐 Viral Hook Analysis                       Notes   │ │           │ │ │
│ │    "Analysis of top 10 hooks in fitness..."   1 week   │ │ Download  │ │ │
│ │                                                         │ │ Duplicate │ │ │
│ │ ☐ 🎵 Background Music - Upbeat Summer          Audio   │ │ Share     │ │ │
│ │    5 tracks • Royalty-free • 30s each        1 week   │ │ Delete    │ │ │
│ │                                                         │ │           │ │ │
│ │ [Select All] [Bulk Actions ▼]        247 items total   │ └───────────┘ │ │
│ │                                                         │               │ │
│ └─────────────────────────────────────────────────────────┴───────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Advanced Search Interface
```
┌─ Advanced Search ─────────────────────────────────────────────────────────────┐
│                                                                               │
│ 🔍 Search Query                                                               │
│ ┌───────────────────────────────────────────────────────────────────────────┐ │
│ │ summer skincare routine TikTok                                            │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ ┌─ Filters ──────────────────┐ ┌─ Date Range ────────────────────────────────┐ │
│ │                            │ │                                             │ │
│ │ Content Type:              │ │ From: [June 1, 2024  ▼]                    │ │
│ │ ☐ Scripts                  │ │ To:   [Today         ▼]                    │ │
│ │ ☑ Videos                   │ │                                             │ │
│ │ ☐ Images                   │ │ Quick Select:                               │ │
│ │ ☐ Notes                    │ │ [Today] [Week] [Month] [Quarter] [All]     │ │
│ │ ☐ Ideas                    │ │                                             │ │
│ │                            │ └─────────────────────────────────────────────┘ │
│ │ Platform:                  │                                               │ │
│ │ ☑ TikTok                   │ ┌─ Tags ────────────────────────────────────────┐ │
│ │ ☐ Instagram                │ │                                             │ │
│ │ ☐ YouTube                  │ │ Included Tags:                              │ │
│ │ ☐ All Platforms            │ │ [skincare] [summer] [teens] [trending]     │ │
│ │                            │ │                                             │ │
│ │ Source:                    │ │ Excluded Tags:                              │ │
│ │ ☐ AI Generated             │ │ [winter] [mature-skin]                      │ │
│ │ ☑ User Created             │ │                                             │ │
│ │ ☐ Imported                 │ └─────────────────────────────────────────────┘ │
│ │ ☐ Browser Extension        │                                               │ │
│ └────────────────────────────┘                                               │
│                                                                               │
│ [Search] [Reset Filters] [Save Search]                                       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Content Library Table
```typescript
// Comprehensive content library with preview panel
<div className="content-library">
  <div className="library-header">
    <Heading size="large" color="warmNeutral800">
      Content Library
    </Heading>
    <Text color="warmNeutral600">
      Your creative asset repository
    </Text>
  </div>
  
  <div className="library-controls">
    <div className="search-filters">
      <Textfield
        placeholder="Search all content..."
        value={searchQuery}
        onChange={handleSearch}
        elemBeforeInput={<SearchIcon />}
      />
      
      <div className="filter-controls">
        <Select
          placeholder="Type: All"
          options={contentTypeOptions}
          value={selectedType}
          onChange={handleTypeFilter}
        />
        <Select
          placeholder="Date: All time"
          options={dateRangeOptions}
          value={selectedDateRange}
          onChange={handleDateFilter}
        />
      </div>
    </div>
    
    <div className="quick-filters">
      {contentTypes.map(type => (
        <Button
          key={type.id}
          appearance={selectedFilters.includes(type.id) ? "primary" : "subtle"}
          onClick={() => toggleFilter(type.id)}
          size="small"
        >
          {type.icon} {type.label}
        </Button>
      ))}
    </div>
  </div>
  
  <div className="library-content">
    <div className="content-table">
      <DynamicTable
        head={{
          cells: [
            { key: 'select', content: <Checkbox />, width: 4 },
            { key: 'content', content: 'Content', isSortable: true },
            { key: 'type', content: 'Type', isSortable: true },
            { key: 'created', content: 'Created', isSortable: true },
            { key: 'actions', content: 'Actions', width: 8 }
          ]
        }}
        rows={contentItems.map(item => ({
          key: item.id,
          isHighlighted: selectedItem?.id === item.id,
          onClick: () => selectItem(item),
          cells: [
            { content: <Checkbox isChecked={selectedItems.includes(item.id)} /> },
            { 
              content: (
                <div className="content-cell">
                  <div className="content-icon">
                    {getContentTypeIcon(item.type)}
                  </div>
                  <div className="content-info">
                    <Text weight="medium" color="warmNeutral800">
                      {item.title}
                    </Text>
                    <Text size="small" color="warmNeutral600">
                      {item.preview}
                    </Text>
                  </div>
                </div>
              )
            },
            { 
              content: (
                <Badge appearance="primary" spacing="comfortable">
                  {item.type}
                </Badge>
              )
            },
            { content: <Text size="small">{formatDate(item.created)}</Text> },
            { 
              content: (
                <DropdownMenu>
                  <DropdownItem onClick={() => viewItem(item)}>View</DropdownItem>
                  <DropdownItem onClick={() => editItem(item)}>Edit</DropdownItem>
                  <DropdownItem onClick={() => downloadItem(item)}>Download</DropdownItem>
                  <DropdownItem onClick={() => deleteItem(item)}>Delete</DropdownItem>
                </DropdownMenu>
              )
            }
          ]
        }))}
      />
    </div>
    
    {selectedItem && (
      <div className="preview-panel">
        <Card appearance="elevated" spacing="comfortable">
          <div className="preview-header">
            <Heading size="small" color="warmNeutral800">
              {selectedItem.title}
            </Heading>
            <Button 
              appearance="subtle" 
              iconBefore={<CrossIcon />} 
              onClick={closePreview}
            />
          </div>
          
          <Tabs
            tabs={[
              {
                label: 'View',
                content: <ContentViewer item={selectedItem} />
              },
              {
                label: 'Edit',
                content: <ContentEditor item={selectedItem} />
              },
              {
                label: 'Notes',
                content: <ContentNotes item={selectedItem} />
              }
            ]}
          />
          
          <div className="preview-actions">
            <ButtonGroup direction="vertical" spacing="comfortable">
              <Button appearance="primary" onClick={() => downloadItem(selectedItem)}>
                Download
              </Button>
              <Button appearance="default" onClick={() => duplicateItem(selectedItem)}>
                Duplicate
              </Button>
              <Button appearance="subtle" onClick={() => shareItem(selectedItem)}>
                Share
              </Button>
            </ButtonGroup>
          </div>
        </Card>
      </div>
    )}
  </div>
</div>
```

This comprehensive mockup provides detailed specifications for each major interface of the Gen.C Alpha dashboard, designed with Claude's warm, conversational aesthetic while maintaining the platform's powerful functionality for content creators.