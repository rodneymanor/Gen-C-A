# Gen.C Alpha - Component Library Specifications

## Overview

This document defines the comprehensive component library for Gen.C Alpha, designed with Claude's conversational aesthetic and built to integrate seamlessly with Atlassian Design System components. Each component includes detailed specifications for states, variants, responsive behavior, and accessibility requirements.

---

## Core Components

### 1. Button System

#### Primary Button
```typescript
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'ai-powered' | 'creative';
}

// Component Implementation
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  ...props
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'ai-powered':
        return {
          background: 'linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end))',
          boxShadow: 'var(--shadow-ai)',
          color: 'white'
        };
      case 'creative':
        return {
          background: 'var(--color-creative-purple)',
          color: 'white'
        };
      default:
        return {
          background: 'var(--button-primary-bg)',
          color: 'var(--button-primary-text)',
          boxShadow: 'var(--button-primary-shadow)'
        };
    }
  };

  return (
    <Button
      appearance="primary"
      spacing={size === 'large' ? 'comfortable' : 'default'}
      {...props}
      css={getButtonStyles()}
    >
      {children}
    </Button>
  );
};
```

**States:**
- Default: Primary brand color with subtle shadow
- Hover: Darker shade with elevated shadow
- Active: Slightly darker with inset shadow
- Disabled: Reduced opacity with no shadow
- Loading: Spinner overlay with disabled interaction

**Responsive Behavior:**
- Mobile: Full width on screens < 640px
- Tablet: Maintains size with increased touch targets
- Desktop: Standard sizing with hover effects

#### AI-Powered Button Variant
```css
.button-ai-powered {
  background: linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end));
  box-shadow: var(--shadow-ai);
  color: white;
  position: relative;
  overflow: hidden;
}

.button-ai-powered::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.button-ai-powered:hover::before {
  left: 100%;
}
```

### 2. Card System

#### Content Card
```typescript
interface ContentCardProps {
  title: string;
  description?: string;
  thumbnail?: string;
  type: 'video' | 'script' | 'image' | 'note' | 'idea';
  platform?: string;
  created: Date;
  isSelected?: boolean;
  onClick?: () => void;
  actions?: CardAction[];
  metadata?: Record<string, any>;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  thumbnail,
  type,
  platform,
  created,
  isSelected = false,
  onClick,
  actions = [],
  metadata = {}
}) => {
  const typeIcons = {
    video: '🎥',
    script: '✍️',
    image: '📸',
    note: '📝',
    idea: '💡'
  };

  return (
    <Card
      appearance={isSelected ? "selected" : "raised"}
      isHoverable
      onClick={onClick}
      css={{
        transition: 'all var(--duration-normal) var(--ease-in-out)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 'var(--shadow-elevated)'
        }
      }}
    >
      <div className="content-card">
        {thumbnail && (
          <div className="card-thumbnail">
            <img src={thumbnail} alt={title} />
            {type === 'video' && metadata.duration && (
              <Badge appearance="neutral" className="duration-badge">
                ▶ {formatDuration(metadata.duration)}
              </Badge>
            )}
          </div>
        )}
        
        <div className="card-content">
          <div className="card-header">
            <div className="content-type">
              <span className="type-icon">{typeIcons[type]}</span>
              <Text size="small" color="warmNeutral600">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </div>
            
            {platform && (
              <Badge appearance="primary" size="small">
                {getPlatformIcon(platform)} {platform}
              </Badge>
            )}
          </div>
          
          <Heading size="small" color="warmNeutral800">
            {title}
          </Heading>
          
          {description && (
            <Text size="small" color="warmNeutral600">
              {truncate(description, 100)}
            </Text>
          )}
          
          <div className="card-meta">
            <Text size="xsmall" color="warmNeutral500">
              {formatRelativeTime(created)}
            </Text>
          </div>
        </div>
        
        {actions.length > 0 && (
          <div className="card-actions">
            <ButtonGroup spacing="compact">
              {actions.map(action => (
                <Button
                  key={action.id}
                  appearance="subtle"
                  iconBefore={action.icon}
                  onClick={action.onClick}
                  size="small"
                >
                  {action.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        )}
      </div>
    </Card>
  );
};
```

**Card States:**
- Default: Subtle border with light shadow
- Hover: Elevated shadow with slight upward transform
- Selected: Primary border with accent background
- Loading: Skeleton animation overlay

**Responsive Grid:**
```css
.card-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
```

### 3. Navigation Components

#### Sidebar Navigation
```typescript
interface SidebarNavProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentPath: string;
  user: UserProfile;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  currentPath,
  user
}) => {
  const navigationItems = [
    {
      section: 'Content',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠', badge: null },
        { path: '/collections', label: 'Collections', icon: '📁', badge: '12' },
        { path: '/library', label: 'Library', icon: '📚', badge: '247' },
        { path: '/write', label: 'Write', icon: '✍️', badge: null }
      ]
    },
    {
      section: 'Brand',
      items: [
        { path: '/brand-hub', label: 'Brand Hub', icon: '👥', badge: '5' }
      ]
    },
    {
      section: 'Tools',
      items: [
        { path: '/extensions', label: 'Extensions', icon: '🔌', badge: null },
        { path: '/mobile', label: 'Mobile Shortcuts', icon: '📱', badge: null }
      ]
    }
  ];

  return (
    <div className={`sidebar-nav ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <div className="brand">
          <img src="/logo.svg" alt="Gen.C" className="logo" />
          {!isCollapsed && (
            <Heading size="medium" color="warmNeutral800">
              Gen.C Alpha
            </Heading>
          )}
        </div>
        
        <Button
          appearance="subtle"
          iconBefore={isCollapsed ? <MenuExpandIcon /> : <MenuCollapseIcon />}
          onClick={onToggleCollapse}
          size="small"
        />
      </div>
      
      <div className="nav-content">
        {navigationItems.map(section => (
          <div key={section.section} className="nav-section">
            {!isCollapsed && (
              <Text size="xsmall" color="warmNeutral500" weight="semibold">
                {section.section.toUpperCase()}
              </Text>
            )}
            
            {section.items.map(item => (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                isActive={currentPath === item.path}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="nav-footer">
        <NavItem
          path="/settings"
          label="Settings"
          icon="⚙️"
          isActive={currentPath === '/settings'}
          isCollapsed={isCollapsed}
        />
        
        <div className="user-menu">
          <UserMenuTrigger user={user} isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
};
```

#### Navigation Item
```typescript
interface NavItemProps {
  path: string;
  label: string;
  icon: string;
  badge?: string;
  isActive?: boolean;
  isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  path,
  label,
  icon,
  badge,
  isActive = false,
  isCollapsed = false
}) => {
  return (
    <Link href={path} className={`nav-item ${isActive ? 'active' : ''}`}>
      <div className="nav-item-content">
        <span className="nav-icon">{icon}</span>
        
        {!isCollapsed && (
          <>
            <Text color={isActive ? "warmPrimary600" : "warmNeutral700"} weight="medium">
              {label}
            </Text>
            
            {badge && (
              <Badge appearance="subtle" max={999}>
                {badge}
              </Badge>
            )}
          </>
        )}
      </div>
      
      {isCollapsed && badge && (
        <div className="collapsed-badge">
          <Badge appearance="primary" size="small">{badge}</Badge>
        </div>
      )}
    </Link>
  );
};
```

### 4. Form Components

#### Enhanced Text Input
```typescript
interface EnhancedTextfieldProps extends TextfieldProps {
  label: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  variant?: 'default' | 'warm' | 'creative';
}

const EnhancedTextfield: React.FC<EnhancedTextfieldProps> = ({
  label,
  helperText,
  errorMessage,
  isRequired = false,
  showCharacterCount = false,
  maxLength,
  variant = 'default',
  value,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warm':
        return {
          '--input-border-focus': 'var(--color-primary-500)',
          '--input-bg': 'var(--color-primary-50)'
        };
      case 'creative':
        return {
          '--input-border-focus': 'var(--color-creative-purple)',
          '--input-bg': 'var(--color-neutral-50)'
        };
      default:
        return {};
    }
  };

  const characterCount = typeof value === 'string' ? value.length : 0;
  
  return (
    <Field 
      name={props.name || ''}
      label={label}
      isRequired={isRequired}
      isInvalid={!!errorMessage}
    >
      {({ fieldProps }) => (
        <div className="enhanced-textfield" style={getVariantStyles()}>
          <Textfield
            {...fieldProps}
            {...props}
            value={value}
            maxLength={maxLength}
          />
          
          <div className="field-footer">
            <div className="helper-content">
              {errorMessage ? (
                <Text size="small" color="error">
                  {errorMessage}
                </Text>
              ) : helperText ? (
                <Text size="small" color="warmNeutral600">
                  {helperText}
                </Text>
              ) : null}
            </div>
            
            {showCharacterCount && maxLength && (
              <Text size="small" color="warmNeutral500">
                {characterCount}/{maxLength}
              </Text>
            )}
          </div>
        </div>
      )}
    </Field>
  );
};
```

#### AI-Enhanced Textarea
```typescript
interface AITextAreaProps extends TextAreaProps {
  label: string;
  aiSuggestions?: boolean;
  onAISuggest?: (prompt: string) => Promise<string[]>;
  placeholder?: string;
}

const AITextArea: React.FC<AITextAreaProps> = ({
  label,
  aiSuggestions = false,
  onAISuggest,
  placeholder = "Start typing or use AI to help...",
  value,
  onChange,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleAISuggest = async () => {
    if (!onAISuggest || !value) return;
    
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await onAISuggest(value.toString());
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <Field name={props.name || ''} label={label}>
      {({ fieldProps }) => (
        <div className="ai-textarea-container">
          <div className="textarea-header">
            {aiSuggestions && (
              <Button
                appearance="subtle"
                iconBefore={<MagicIcon />}
                onClick={handleAISuggest}
                isLoading={isLoadingSuggestions}
                size="small"
              >
                ✨ AI Suggestions
              </Button>
            )}
          </div>
          
          <TextArea
            {...fieldProps}
            {...props}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            css={{
              minHeight: '120px',
              resize: 'vertical',
              fontFamily: 'var(--font-family-primary)'
            }}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="ai-suggestions">
              <div className="suggestions-header">
                <Text size="small" weight="semibold" color="warmNeutral700">
                  AI Suggestions
                </Text>
                <Button
                  appearance="subtle"
                  iconBefore={<CrossIcon />}
                  onClick={() => setShowSuggestions(false)}
                  size="small"
                />
              </div>
              
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    appearance="subtle"
                    onClick={() => {
                      onChange?.(suggestion);
                      setShowSuggestions(false);
                    }}
                    css={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      whiteSpace: 'normal',
                      height: 'auto',
                      padding: 'var(--space-3)',
                      marginBottom: 'var(--space-2)'
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Field>
  );
};
```

### 5. Data Display Components

#### Enhanced Data Table
```typescript
interface EnhancedTableProps {
  data: any[];
  columns: TableColumn[];
  isLoading?: boolean;
  onRowSelect?: (selectedRows: any[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  emptyState?: React.ReactNode;
}

const EnhancedTable: React.FC<EnhancedTableProps> = ({
  data,
  columns,
  isLoading = false,
  onRowSelect,
  onSort,
  pagination,
  emptyState
}) => {
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort?.(columnKey, newDirection);
  };

  const tableColumns = [
    ...(onRowSelect ? [{
      key: 'select',
      content: (
        <Checkbox
          isChecked={selectedRows.length === data.length && data.length > 0}
          isIndeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
          onChange={(e) => {
            if (e.currentTarget.checked) {
              setSelectedRows(data);
              onRowSelect?.(data);
            } else {
              setSelectedRows([]);
              onRowSelect?.([]);
            }
          }}
        />
      ),
      width: 4
    }] : []),
    ...columns.map(col => ({
      key: col.key,
      content: col.label,
      isSortable: col.sortable,
      width: col.width
    }))
  ];

  const tableRows = data.map(item => ({
    key: item.id,
    isHighlighted: selectedRows.some(row => row.id === item.id),
    cells: [
      ...(onRowSelect ? [{
        content: (
          <Checkbox
            isChecked={selectedRows.some(row => row.id === item.id)}
            onChange={(e) => {
              if (e.currentTarget.checked) {
                const newSelected = [...selectedRows, item];
                setSelectedRows(newSelected);
                onRowSelect?.(newSelected);
              } else {
                const newSelected = selectedRows.filter(row => row.id !== item.id);
                setSelectedRows(newSelected);
                onRowSelect?.(newSelected);
              }
            }}
          />
        )
      }] : []),
      ...columns.map(col => ({
        content: col.render ? col.render(item[col.key], item) : item[col.key]
      }))
    ]
  }));

  if (data.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        {emptyState || (
          <Card appearance="subtle" spacing="comfortable">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <Text size="large" color="warmNeutral600">
                No data available
              </Text>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="enhanced-table">
      <DynamicTable
        head={{ cells: tableColumns }}
        rows={tableRows}
        isLoading={isLoading}
        loadingSpinnerSize="large"
        isRankable={false}
      />
      
      {pagination && (
        <div className="table-pagination">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};
```

### 6. Media Components

#### Video Player Card
```typescript
interface VideoPlayerCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    url: string;
    duration: number;
    platform: string;
    creator?: string;
  };
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({
  video,
  onPlay,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <Card 
      appearance="raised" 
      isHoverable
      css={{
        overflow: 'hidden',
        transition: 'all var(--duration-normal) var(--ease-in-out)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'var(--shadow-elevated)'
        }
      }}
    >
      <div 
        className="video-container"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <div className="video-thumbnail">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
          />
          
          <div className="video-duration">
            <Badge appearance="neutral" spacing="compact">
              ▶ {formatDuration(video.duration)}
            </Badge>
          </div>
          
          <div className="platform-badge">
            <Badge appearance="primary" size="small">
              {getPlatformIcon(video.platform)}
            </Badge>
          </div>
          
          {showOverlay && (
            <div className="video-overlay">
              <Button
                appearance="primary"
                iconBefore={<PlayIcon />}
                onClick={() => {
                  setIsPlaying(true);
                  onPlay?.();
                }}
                size="large"
                css={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  '&:hover': {
                    backgroundColor: 'var(--color-primary-500)'
                  }
                }}
              >
                Play
              </Button>
            </div>
          )}
        </div>
        
        <div className="video-info">
          <Heading size="small" color="warmNeutral800">
            {video.title}
          </Heading>
          
          {video.creator && (
            <Text size="small" color="warmNeutral600">
              by {video.creator}
            </Text>
          )}
          
          {showActions && (
            <div className="video-actions">
              <ButtonGroup spacing="comfortable">
                <Button 
                  appearance="subtle" 
                  iconBefore={<EditIcon />}
                  onClick={onEdit}
                  size="small"
                >
                  Edit
                </Button>
                <Button 
                  appearance="warning" 
                  iconBefore={<TrashIcon />}
                  onClick={onDelete}
                  size="small"
                >
                  Delete
                </Button>
              </ButtonGroup>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
```

### 7. Loading and Empty States

#### Skeleton Components
```typescript
// Content Card Skeleton
const ContentCardSkeleton: React.FC = () => (
  <Card appearance="subtle" spacing="comfortable">
    <div className="skeleton-container">
      <div className="skeleton-thumbnail" />
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-description" />
        <div className="skeleton-meta">
          <div className="skeleton-badge" />
          <div className="skeleton-date" />
        </div>
      </div>
    </div>
  </Card>
);

// Table Row Skeleton
const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <tr className="skeleton-row">
    {Array.from({ length: columns }, (_, i) => (
      <td key={i}>
        <div className="skeleton-line" />
      </td>
    ))}
  </tr>
);
```

#### Empty States
```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    appearance?: 'primary' | 'default';
  };
  illustration?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  illustration
}) => (
  <Card appearance="subtle" spacing="comfortable">
    <div className="empty-state">
      {illustration ? (
        <img src={illustration} alt="" className="empty-illustration" />
      ) : icon ? (
        <div className="empty-icon">{icon}</div>
      ) : (
        <div className="empty-icon">📭</div>
      )}
      
      <Heading size="medium" color="warmNeutral800">
        {title}
      </Heading>
      
      <Text color="warmNeutral600" size="medium">
        {description}
      </Text>
      
      {action && (
        <Button
          appearance={action.appearance || 'primary'}
          onClick={action.onClick}
          size="large"
        >
          {action.label}
        </Button>
      )}
    </div>
  </Card>
);
```

---

## Responsive Patterns

### Breakpoint System
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Responsive hook
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('lg');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};
```

### Mobile-First Grid
```css
.responsive-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Accessibility Guidelines

### Focus Management
```css
.focus-visible {
  outline: 3px solid var(--color-primary-200);
  outline-offset: 2px;
  border-radius: var(--radius-small);
}

.focus-visible:focus-visible {
  outline: 3px solid var(--color-primary-300);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .focus-visible:focus-visible {
    outline-color: var(--color-primary-600);
    outline-width: 4px;
  }
}
```

### Screen Reader Support
```typescript
// Screen reader only content
const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">
    {children}
  </span>
);

// Accessible button with proper labeling
const AccessibleButton: React.FC<{
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}> = ({ children, ariaLabel, ariaDescribedBy, ...props }) => (
  <Button
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    {...props}
  >
    {children}
  </Button>
);
```

### Color Contrast Utilities
```typescript
// Color contrast checker utility
const checkContrast = (foreground: string, background: string): boolean => {
  // Implementation would calculate WCAG contrast ratio
  // Return true if ratio meets AA standards (4.5:1)
  return true;
};

// High contrast theme toggle
const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
};
```

This comprehensive component library provides the foundation for building a consistent, accessible, and user-friendly interface that maintains Claude's warm aesthetic while serving the complex needs of content creators.