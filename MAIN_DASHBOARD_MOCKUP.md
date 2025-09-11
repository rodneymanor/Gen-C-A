# Gen.C Alpha - Main Dashboard Interface Mockup

## Design Overview

The main dashboard serves as the central hub for content creators, providing quick access to all major workflows while maintaining Claude's warm, conversational design philosophy. The interface balances powerful functionality with intuitive navigation patterns.

---

## Layout Structure

### Desktop Layout (1280px+)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Top Navigation Bar                                                                  │
│ ┌─ [Gen.C Logo] ─────────────────────── Search ──────────── [Profile] [Settings] │
└─────────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Main Dashboard Container                                                            │
│ ┌─────────────────┬─────────────────────────────────────────────────────────────┐   │
│ │ Side Navigation │ Dashboard Content Area                                      │   │
│ │ (280px)         │                                                             │   │
│ │                 │ ┌─ Welcome Section ─────────────────────────────────────┐   │   │
│ │ 🏠 Dashboard    │ │ Good morning, Alex!                                   │   │   │
│ │ 📁 Collections  │ │ Ready to create something amazing today?               │   │   │
│ │ 📚 Library      │ │                                                       │   │   │
│ │ ✍️  Write       │ │ ┌─ Quick Actions ──────────────────────────────────┐ │   │   │
│ │ 👤 Brand Hub    │ │ │ [📝 Write Script] [📁 New Collection]           │ │   │   │
│ │                 │ │ │ [📤 Import Content] [🎬 Analyze Video]          │ │   │   │
│ │ ──────────────  │ │ └─────────────────────────────────────────────────┘ │   │   │
│ │ 🔧 Tools        │ └───────────────────────────────────────────────────────────┘   │   │
│ │ 🌐 Extensions   │                                                             │   │
│ │ ⬇️  Downloads   │ ┌─ Activity Overview ───────────────────────────────────┐   │   │
│ │                 │ │                                                       │   │   │
│ │ ──────────────  │ │ ┌─ Recent Activity ──┬─ Performance Metrics ───────┐ │   │   │
│ │ ⚙️  Settings    │ │ │                    │                             │ │   │   │
│ │ 💬 Help         │ │ │ • Script created   │ 📊 Content Created          │ │   │   │
│ │                 │ │ │   2 hours ago      │    24 items this week       │ │   │   │
│ │                 │ │ │ • Collection       │                             │ │   │   │
│ │                 │ │ │   "Travel Tips"    │ 📈 Script Generation        │ │   │   │
│ │                 │ │ │   updated          │    12 scripts generated     │ │   │   │
│ │                 │ │ │ • Video imported   │                             │ │   │   │
│ │                 │ │ │   from TikTok      │ 🎯 Engagement Insights      │ │   │   │
│ │                 │ │ │                    │    Top performing content   │ │   │   │
│ │                 │ │ └────────────────────┴─────────────────────────────┘ │   │   │
│ │                 │ └───────────────────────────────────────────────────────────┘   │   │
│ │                 │                                                             │   │
│ │                 │ ┌─ Featured Content & Recommendations ──────────────────┐   │   │
│ │                 │ │                                                       │   │   │
│ │                 │ │ Today's Content Inspiration                           │   │   │
│ │                 │ │ ┌─────┬─────┬─────┬─────┬─────┐                       │   │   │
│ │                 │ │ │Card │Card │Card │Card │Card │                       │   │   │
│ │                 │ │ └─────┴─────┴─────┴─────┴─────┘                       │   │   │
│ │                 │ └───────────────────────────────────────────────────────────┘   │   │
│ └─────────────────┴─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Top Navigation Bar
```typescript
interface TopNavigationProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TopNavigation = ({ user, searchQuery, onSearchChange }: TopNavigationProps) => (
  <header className="top-navigation">
    <div className="nav-left">
      <Logo 
        src="/logo.svg" 
        alt="Gen.C" 
        size="32px"
        className="brand-logo"
      />
      <Text size="lg" weight="semibold" color="neutral-700">
        Gen.C Alpha
      </Text>
    </div>
    
    <div className="nav-center">
      <SearchField
        placeholder="Search collections, scripts, content..."
        value={searchQuery}
        onChange={onSearchChange}
        width="400px"
        appearance="subtle"
        icon={<SearchIcon />}
      />
    </div>
    
    <div className="nav-right">
      <NotificationButton count={3} />
      <UserMenu
        avatar={<Avatar src={user.avatar} name={user.name} size="medium" />}
        name={user.name}
        email={user.email}
        menuItems={[
          { label: 'Profile', href: '/profile' },
          { label: 'Settings', href: '/settings' },
          { label: 'Help', href: '/help' },
          { separator: true },
          { label: 'Sign out', onClick: handleSignOut }
        ]}
      />
    </div>
  </header>
);
```

### Side Navigation
```typescript
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  isActive: boolean;
}

const SideNavigation = ({ currentPath }: { currentPath: string }) => {
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: HomeIcon, isActive: currentPath === '/' },
    { id: 'collections', label: 'Collections', href: '/collections', icon: FolderIcon, badge: 12, isActive: currentPath === '/collections' },
    { id: 'library', label: 'Library', href: '/library', icon: LibraryIcon, badge: 156, isActive: currentPath === '/library' },
    { id: 'write', label: 'Write', href: '/write', icon: EditIcon, isActive: currentPath === '/write' },
    { id: 'brand-hub', label: 'Brand Hub', href: '/brand-hub', icon: PersonIcon, badge: 3, isActive: currentPath === '/brand-hub' },
  ];
  
  const toolItems: NavigationItem[] = [
    { id: 'chrome-extension', label: 'Chrome Extension', href: '/chrome-extension', icon: ExtensionIcon, isActive: false },
    { id: 'downloads', label: 'iOS Shortcuts', href: '/downloads', icon: DownloadIcon, isActive: false },
  ];

  return (
    <nav className="side-navigation">
      <NavigationSection>
        <SectionHeading color="neutral-600" size="sm">
          Content
        </SectionHeading>
        {navigationItems.map(item => (
          <NavigationItem
            key={item.id}
            href={item.href}
            isSelected={item.isActive}
            iconBefore={<item.icon size="20" />}
            iconAfter={item.badge ? <Badge text={item.badge} appearance="primary" /> : undefined}
          >
            {item.label}
          </NavigationItem>
        ))}
      </NavigationSection>
      
      <NavigationSection>
        <SectionHeading color="neutral-600" size="sm">
          Tools & Extensions
        </SectionHeading>
        {toolItems.map(item => (
          <NavigationItem
            key={item.id}
            href={item.href}
            isSelected={item.isActive}
            iconBefore={<item.icon size="20" />}
          >
            {item.label}
          </NavigationItem>
        ))}
      </NavigationSection>
      
      <div className="navigation-footer">
        <NavigationItem href="/settings" iconBefore={<SettingsIcon size="20" />}>
          Settings
        </NavigationItem>
        <NavigationItem href="/help" iconBefore={<HelpIcon size="20" />}>
          Help & Support
        </NavigationItem>
      </div>
    </nav>
  );
};
```

### Welcome Section
```typescript
const WelcomeSection = ({ user }: { user: User }) => {
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="welcome-section">
      <div className="welcome-content">
        <Heading size="2xl" color="neutral-800">
          {getTimeOfDayGreeting()}, {user.firstName}!
        </Heading>
        <Text size="lg" color="neutral-600">
          Ready to create something amazing today?
        </Text>
      </div>
      
      <QuickActionsGrid />
    </div>
  );
};

const QuickActionsGrid = () => {
  const quickActions = [
    {
      id: 'write-script',
      label: 'Write Script',
      description: 'Generate AI-powered scripts',
      icon: EditIcon,
      color: 'orange',
      href: '/write'
    },
    {
      id: 'new-collection',
      label: 'New Collection',
      description: 'Organize your videos',
      icon: FolderPlusIcon,
      color: 'blue',
      onClick: () => createNewCollection()
    },
    {
      id: 'import-content',
      label: 'Import Content',
      description: 'Add videos from social platforms',
      icon: UploadIcon,
      color: 'green',
      onClick: () => openImportDialog()
    },
    {
      id: 'analyze-video',
      label: 'Analyze Video',
      description: 'Extract insights and personas',
      icon: AnalyticsIcon,
      color: 'purple',
      href: '/brand-hub?action=analyze'
    }
  ];

  return (
    <div className="quick-actions-grid">
      {quickActions.map(action => (
        <QuickActionCard
          key={action.id}
          label={action.label}
          description={action.description}
          icon={<action.icon size="24" />}
          color={action.color}
          href={action.href}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
};
```

### Activity Overview
```typescript
const ActivityOverview = () => {
  return (
    <div className="activity-overview">
      <div className="activity-grid">
        <RecentActivityPanel />
        <PerformanceMetricsPanel />
      </div>
    </div>
  );
};

const RecentActivityPanel = () => {
  const recentActivities = [
    {
      id: 1,
      type: 'script_created',
      title: 'Travel Tips Script',
      timestamp: '2 hours ago',
      icon: EditIcon,
      color: 'orange'
    },
    {
      id: 2,
      type: 'collection_updated',
      title: 'Collection "Travel Content" updated',
      timestamp: '4 hours ago',
      icon: FolderIcon,
      color: 'blue'
    },
    {
      id: 3,
      type: 'video_imported',
      title: 'Video imported from TikTok',
      timestamp: '1 day ago',
      icon: VideoIcon,
      color: 'green'
    }
  ];

  return (
    <Panel>
      <PanelHeader>
        <Heading size="md">Recent Activity</Heading>
        <Button appearance="subtle" size="small" href="/library">
          View all
        </Button>
      </PanelHeader>
      
      <PanelContent>
        <ActivityList>
          {recentActivities.map(activity => (
            <ActivityItem
              key={activity.id}
              icon={<activity.icon size="16" color={activity.color} />}
              title={activity.title}
              timestamp={activity.timestamp}
            />
          ))}
        </ActivityList>
      </PanelContent>
    </Panel>
  );
};

const PerformanceMetricsPanel = () => {
  const metrics = [
    {
      label: 'Content Created',
      value: '24 items',
      period: 'this week',
      trend: '+18%',
      trendDirection: 'up'
    },
    {
      label: 'Script Generation',
      value: '12 scripts',
      period: 'generated',
      trend: '+5',
      trendDirection: 'up'
    },
    {
      label: 'Collections',
      value: '8 active',
      period: 'collections',
      trend: '+2',
      trendDirection: 'up'
    }
  ];

  return (
    <Panel>
      <PanelHeader>
        <Heading size="md">Performance Metrics</Heading>
        <Button appearance="subtle" size="small" iconBefore={<AnalyticsIcon size="16" />}>
          Analytics
        </Button>
      </PanelHeader>
      
      <PanelContent>
        <MetricsList>
          {metrics.map((metric, index) => (
            <MetricItem
              key={index}
              label={metric.label}
              value={metric.value}
              period={metric.period}
              trend={metric.trend}
              trendDirection={metric.trendDirection}
            />
          ))}
        </MetricsList>
      </PanelContent>
    </Panel>
  );
};
```

### Content Inspiration Section
```typescript
const ContentInspiration = () => {
  const [inspirationContent, setInspirationContent] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="content-inspiration">
      <div className="section-header">
        <Heading size="md">Today's Content Inspiration</Heading>
        <Button
          appearance="subtle"
          iconAfter={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Explore More'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="inspiration-grid">
          {inspirationContent.map(content => (
            <InspirationCard
              key={content.id}
              title={content.title}
              platform={content.platform}
              engagement={content.engagement}
              thumbnail={content.thumbnail}
              onUse={() => useContentIdea(content)}
              onSave={() => saveContentIdea(content)}
            />
          ))}
        </div>
      )}
      
      <div className="inspiration-preview">
        <TrendingContentCarousel items={inspirationContent.slice(0, 5)} />
      </div>
    </div>
  );
};
```

---

## Responsive Design Adaptations

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────────────────────────┐
│ Condensed Navigation (Icons + Labels)                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Welcome Section (Full Width) ──────────────────────────┐ │
│ │ Good morning, Alex!                                     │ │
│ │ [Quick Actions in 2x2 Grid]                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Activity Overview (Stacked Panels) ───────────────────┐ │
│ │ Recent Activity                                         │ │
│ │ Performance Metrics                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────────────┐
│ [≡] Gen.C    [🔍] [👤]             │
├─────────────────────────────────────┤
│ Good morning, Alex!                 │
│ Ready to create something amazing?  │
│                                     │
│ ┌─ Quick Actions (2x2 Grid) ──────┐ │
│ │ [📝] [📁]                      │ │
│ │ [📤] [🎬]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Recent Activity ───────────────┐ │
│ │ • Script created 2h ago         │ │
│ │ • Collection updated 4h ago     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ Quick Metrics ─────────────────┐ │
│ │ 24 items | 12 scripts | 8 cols  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [🏠] [📁] [📚] [✍️] [👤]          │
└─────────────────────────────────────┘
```

---

## Styling Specifications

### CSS Implementation
```scss
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $neutral-50 0%, $claude-orange-50 100%);
  font-family: $font-family-base;
}

.welcome-section {
  background: $neutral-0;
  border-radius: $radius-xl;
  padding: $space-8;
  box-shadow: $shadow-warm-md;
  margin-bottom: $space-8;
  
  .welcome-content {
    margin-bottom: $space-6;
    
    h1 {
      color: $neutral-800;
      margin-bottom: $space-2;
    }
    
    p {
      color: $neutral-600;
    }
  }
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-4;
  
  @media (max-width: $bp-md) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.quick-action-card {
  background: $neutral-0;
  border: 2px solid $neutral-200;
  border-radius: $radius-lg;
  padding: $space-6;
  text-align: center;
  transition: all $duration-normal $ease-in-out;
  cursor: pointer;
  
  &:hover {
    border-color: $claude-orange-300;
    box-shadow: $shadow-warm-md;
    transform: translateY(-2px);
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-full;
    margin: 0 auto $space-4;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.orange { background: linear-gradient(135deg, $claude-orange-100, $claude-orange-200); }
    &.blue { background: linear-gradient(135deg, $info-100, $info-200); }
    &.green { background: linear-gradient(135deg, $success-100, $success-200); }
    &.purple { background: linear-gradient(135deg, #F3E8FF, #E9D5FF); }
  }
}

.activity-overview {
  .activity-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-6;
    
    @media (max-width: $bp-lg) {
      grid-template-columns: 1fr;
    }
  }
}

.panel {
  background: $neutral-0;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
  
  .panel-header {
    padding: $space-6;
    border-bottom: 1px solid $neutral-200;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .panel-content {
    padding: $space-6;
  }
}
```

This main dashboard design creates an inviting, functional entry point that guides users toward their most common workflows while providing visibility into their content creation activities and performance metrics.