# Gen.C Alpha - Content Library Interface Mockup

## Design Overview

The Content Library serves as the unified repository for all content types in Gen.C Alpha. This interface embraces Claude's organized, conversational approach to information management while providing powerful search, filtering, and organizational capabilities. The design prioritizes content discoverability and efficient workflow management.

---

## Layout Structure

### Desktop Layout (1280px+)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Page Header                                                                         │
│ ┌─ Content Library ───────── [+ Add Content] [📥 Import] [📤 Export] [⚙️ Settings] ┐ │
│ │                                                                                 │ │
│ │ Your unified content repository - scripts, videos, notes, and more              │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Advanced Search & Filters                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─ Search Bar ──────────────────────────────────────────────────────────────────┐ │ │
│ │ │ 🔍 Search all content by title, description, tags, or full text...          │ │ │
│ │ │                                                              [Advanced ▼]   │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ ┌─ Filter Controls ─────────────────────────────────────────────────────────────┐ │ │
│ │ │ [All Types ▼] [All Sources ▼] [All Dates ▼] [All Tags ▼] [Sort: Recent ▼]  │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ Active filters: Type: Scripts × Source: Generated × Date: This Week ×          │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Main Content Area                                                                   │
│ ┌───────────────────────────────────┬─────────────────────────────────────────────┐ │
│ │ Content Table                     │ Content Preview Panel (Collapsible)        │ │
│ │                                   │                                             │ │
│ │ ┌─ Bulk Actions (when selected) ─┐ │ ┌─ Content Preview ─────────────────────┐   │ │
│ │ │ ✓ 3 items selected              │ │ │ Script: "Tokyo Travel Guide"          │   │ │
│ │ │ [Move] [Tag] [Export] [Delete]  │ │ │ ┌─ Tabs ──────────────────────────┐    │   │ │
│ │ └─────────────────────────────────┘ │ │ │ [👁️ View] [✏️ Edit] [📝 Notes]  │    │   │ │
│ │                                   │ │ └─────────────────────────────────┘    │   │ │
│ │ ┌─ Data Table ─────────────────────┐ │ │                                        │   │ │
│ │ │☐ Title           Type    Source │ │ │ Ready to discover Tokyo's hidden      │   │ │
│ │ │☐ Tokyo Guide     Script  AI Gen │ │ │ gems? 🏮                              │   │ │
│ │ │☐ Food Video #1   Video   TikTok │ │ │                                        │   │ │
│ │ │☐ Travel Notes    Note    Manual │ │ │ Forget the tourist traps! I'm         │   │ │
│ │ │☐ Hook Ideas      Hook    AI Gen │ │ │ about to show you the secret          │   │ │
│ │ │☐ Chat with Sam   Chat    Import │ │ │ spots where locals actually...        │   │ │
│ │ │☐ Brand Guide     Doc     Upload │ │ │                                        │   │ │
│ │ │☐ Q2 Performance  Report  Export │ │ │ [Word count: 127] [Duration: ~45s]    │   │ │
│ │ │☐ Trend Analysis  Data    API    │ │ │                                        │   │ │
│ │ │                              │ │ │ ┌─ Metadata ──────────────────────┐    │   │ │
│ │ │ [Show 25 of 156 items]        │ │ │ │ Created: 2 hours ago             │    │   │ │
│ │ │ [Load More]                   │ │ │ │ Modified: 30 minutes ago         │    │   │ │
│ │ └───────────────────────────────┘ │ │ │ Tags: travel, tokyo, guide       │    │   │ │
│ │                                   │ │ │ Source: AI Generated             │    │   │ │
│ │                                   │ │ │ Collection: Travel Content       │    │   │ │
│ │                                   │ │ └─────────────────────────────────┘    │   │ │
│ │                                   │ └─────────────────────────────────────────┘   │ │
│ └───────────────────────────────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Advanced Search Expanded
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Advanced Search Interface                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─ Search Criteria ─────────────────────────────────────────────────────────────┐ │ │
│ │ │                                                                               │ │ │
│ │ │ Search Term: [tokyo travel guide                              ] [🔍 Search]  │ │ │
│ │ │                                                                               │ │ │
│ │ │ ┌─ Content Types ───────────┬─ Sources ──────────┬─ Date Range ─────────────┐ │ │ │
│ │ │ │ ☑️ Scripts (42)            │ ☑️ AI Generated     │ From: [2024-01-01]      │ │ │ │
│ │ │ │ ☑️ Videos (156)            │ ☑️ Imported         │ To:   [2024-12-31]      │ │ │ │
│ │ │ │ ☑️ Notes (28)              │ ☑️ Manual Entry     │                         │ │ │ │
│ │ │ │ ☑️ Hooks (67)              │ ☑️ API Integration  │ ☑️ Modified in range     │ │ │ │
│ │ │ │ ☑️ Chats (34)              │ ☑️ File Upload      │ ☑️ Created in range      │ │ │ │
│ │ │ │ ☑️ Documents (12)          │                    │                         │ │ │ │
│ │ │ └─────────────────────────┴───────────────────┴─────────────────────────┘ │ │ │
│ │ │                                                                               │ │ │
│ │ │ ┌─ Tags & Collections ─────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Tags: [travel] [tokyo] [guide] [+ Add tag filter]                        │ │ │ │
│ │ │ │ Collections: [Travel Content] [Food Reviews] [+ Add collection filter]   │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ │                                                                               │ │ │
│ │ │ ┌─ Advanced Options ───────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ ☐ Search in content text    ☐ Include archived items                   │ │ │ │
│ │ │ │ ☐ Search in notes           ☐ Match exact phrase                        │ │ │ │
│ │ │ │ ☐ Search in metadata        ☐ Case sensitive                            │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ [🔍 Search] [🔄 Reset] [💾 Save Search] [📋 Load Saved Search]                 │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Search Interface
```typescript
interface SearchState {
  query: string;
  contentTypes: ContentType[];
  sources: ContentSource[];
  dateRange: {
    start: Date | null;
    end: Date | null;
    type: 'created' | 'modified' | 'both';
  };
  tags: string[];
  collections: string[];
  advancedOptions: {
    searchContent: boolean;
    searchNotes: boolean;
    searchMetadata: boolean;
    includeArchived: boolean;
    exactPhrase: boolean;
    caseSensitive: boolean;
  };
}

const ContentLibrarySearch = ({ onSearch, savedSearches }: SearchProps) => {
  const [searchState, setSearchState] = useState<SearchState>(defaultSearchState);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  return (
    <div className="content-library-search">
      <div className="search-header">
        <Heading size="md">Find Your Content</Heading>
        <Text size="sm" color="neutral-600">
          Search across all your content types with powerful filters
        </Text>
      </div>
      
      <div className="search-bar">
        <div className="main-search">
          <SearchField
            placeholder="Search all content by title, description, tags, or full text..."
            value={searchState.query}
            onChange={(query) => setSearchState(prev => ({ ...prev, query }))}
            width="100%"
            appearance="subtle"
            icon={<SearchIcon />}
            onEnterPressed={() => onSearch(searchState)}
          />
          <Button
            appearance="subtle"
            iconAfter={isAdvancedMode ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          >
            Advanced
          </Button>
        </div>
      </div>
      
      <div className="filter-controls">
        <div className="quick-filters">
          <ContentTypeFilter
            selected={searchState.contentTypes}
            onChange={(contentTypes) => setSearchState(prev => ({ ...prev, contentTypes }))}
          />
          <SourceFilter
            selected={searchState.sources}
            onChange={(sources) => setSearchState(prev => ({ ...prev, sources }))}
          />
          <DateRangeFilter
            value={searchState.dateRange}
            onChange={(dateRange) => setSearchState(prev => ({ ...prev, dateRange }))}
          />
          <SortControl
            options={sortOptions}
            value={searchState.sortBy}
            onChange={(sortBy) => setSearchState(prev => ({ ...prev, sortBy }))}
          />
        </div>
      </div>
      
      {isAdvancedMode && (
        <AdvancedSearchPanel
          searchState={searchState}
          onStateChange={setSearchState}
          savedSearches={savedSearches}
          onSaveSearch={saveCurrentSearch}
          onLoadSearch={loadSavedSearch}
        />
      )}
      
      <ActiveFilters
        searchState={searchState}
        onRemoveFilter={removeFilter}
        onClearAll={() => setSearchState(defaultSearchState)}
      />
    </div>
  );
};
```

### Content Data Table
```typescript
interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  source: ContentSource;
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];
  collection?: string;
  wordCount?: number;
  duration?: number;
  preview: string;
  metadata: Record<string, any>;
}

const ContentDataTable = ({ 
  content, 
  selectedItems, 
  onSelectionChange, 
  onItemClick, 
  isLoading 
}: ContentTableProps) => {
  const [sortConfig, setSortConfig] = useState({ key: 'modifiedAt', direction: 'desc' });
  
  const tableHead = {
    cells: [
      { 
        key: 'select', 
        content: (
          <Checkbox
            isChecked={selectedItems.length === content.length}
            isIndeterminate={selectedItems.length > 0 && selectedItems.length < content.length}
            onChange={handleSelectAll}
          />
        ),
        width: 4 
      },
      { key: 'title', content: 'Title', isSortable: true, width: 30 },
      { key: 'type', content: 'Type', isSortable: true, width: 12 },
      { key: 'source', content: 'Source', isSortable: true, width: 12 },
      { key: 'modifiedAt', content: 'Modified', isSortable: true, width: 15 },
      { key: 'tags', content: 'Tags', width: 20 },
      { key: 'actions', content: 'Actions', width: 7 }
    ]
  };
  
  const tableRows = content.map(item => ({
    key: item.id,
    onClick: () => onItemClick(item),
    cells: [
      {
        content: (
          <Checkbox
            isChecked={selectedItems.includes(item.id)}
            onChange={() => toggleSelection(item.id)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      },
      {
        content: (
          <ContentTitleCell
            title={item.title}
            preview={item.preview}
            type={item.type}
            wordCount={item.wordCount}
            duration={item.duration}
          />
        )
      },
      {
        content: (
          <ContentTypeBadge type={item.type} />
        )
      },
      {
        content: (
          <SourceBadge source={item.source} />
        )
      },
      {
        content: (
          <TimeCell
            created={item.createdAt}
            modified={item.modifiedAt}
          />
        )
      },
      {
        content: (
          <TagsList tags={item.tags} maxVisible={3} />
        )
      },
      {
        content: (
          <ContentActionsMenu
            item={item}
            onAction={handleItemAction}
          />
        )
      }
    ]
  }));

  return (
    <div className="content-data-table">
      {selectedItems.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedItems.length}
          onAction={handleBulkAction}
          onClear={() => onSelectionChange([])}
        />
      )}
      
      <DynamicTable
        head={tableHead}
        rows={tableRows}
        isLoading={isLoading}
        loadingSpinnerSize="large"
        sortKey={sortConfig.key}
        sortOrder={sortConfig.direction}
        onSort={handleSort}
        isRankable={false}
        rowsPerPage={25}
        onSetPage={handlePageChange}
      />
      
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};
```

### Content Preview Panel
```typescript
const ContentPreviewPanel = ({ 
  selectedContent, 
  isOpen, 
  onClose, 
  onSave, 
  onAction 
}: PreviewPanelProps) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'notes'>('view');
  const [editedContent, setEditedContent] = useState('');
  const [notes, setNotes] = useState('');

  if (!selectedContent || !isOpen) return null;

  const tabs = [
    {
      label: '👁️ View',
      content: (
        <ContentViewer
          content={selectedContent}
          onAction={onAction}
        />
      )
    },
    {
      label: '✏️ Edit',
      content: (
        <ContentEditor
          content={selectedContent}
          editedContent={editedContent}
          onContentChange={setEditedContent}
          onSave={() => onSave(selectedContent.id, editedContent)}
        />
      )
    },
    {
      label: '📝 Notes',
      content: (
        <NotesEditor
          notes={notes}
          onNotesChange={setNotes}
          onSave={() => saveNotes(selectedContent.id, notes)}
        />
      )
    }
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="wide" // 800px
      label="Content Preview"
    >
      <div className="preview-panel">
        <div className="panel-header">
          <div className="content-title">
            <ContentTypeIcon type={selectedContent.type} size="24" />
            <div className="title-info">
              <Heading size="md">{selectedContent.title}</Heading>
              <div className="title-metadata">
                <SourceBadge source={selectedContent.source} size="small" />
                <Text size="sm" color="neutral-600">
                  Modified {formatRelativeTime(selectedContent.modifiedAt)}
                </Text>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <ButtonGroup>
              <Button
                appearance="subtle"
                iconBefore={<ExportIcon />}
                onClick={() => onAction('export', selectedContent)}
              >
                Export
              </Button>
              <Button
                appearance="subtle"
                iconBefore={<DuplicateIcon />}
                onClick={() => onAction('duplicate', selectedContent)}
              >
                Duplicate
              </Button>
              <Button
                appearance="subtle"
                iconBefore={<MoreIcon />}
                onClick={showMoreActions}
              />
            </ButtonGroup>
            <Button
              appearance="subtle"
              iconBefore={<CrossIcon />}
              onClick={onClose}
              aria-label="Close preview"
            />
          </div>
        </div>
        
        <Tabs
          tabs={tabs}
          selected={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="panel-footer">
          <ContentMetadata content={selectedContent} />
        </div>
      </div>
    </Drawer>
  );
};
```

### Content Type Components
```typescript
const ContentTitleCell = ({ title, preview, type, wordCount, duration }: TitleCellProps) => (
  <div className="content-title-cell">
    <div className="title-row">
      <Text weight="medium" color="neutral-800" className="title-text">
        {title}
      </Text>
      <div className="content-stats">
        {wordCount && (
          <Text size="xs" color="neutral-500">
            {wordCount} words
          </Text>
        )}
        {duration && (
          <Text size="xs" color="neutral-500">
            {formatDuration(duration)}
          </Text>
        )}
      </div>
    </div>
    <Text size="sm" color="neutral-600" className="preview-text">
      {truncate(preview, 100)}
    </Text>
  </div>
);

const ContentTypeBadge = ({ type }: { type: ContentType }) => {
  const typeConfig = {
    script: { color: 'orange', icon: '📝', label: 'Script' },
    video: { color: 'blue', icon: '🎬', label: 'Video' },
    note: { color: 'green', icon: '📄', label: 'Note' },
    hook: { color: 'purple', icon: '🪝', label: 'Hook' },
    chat: { color: 'teal', icon: '💬', label: 'Chat' },
    document: { color: 'gray', icon: '📋', label: 'Document' }
  };
  
  const config = typeConfig[type];
  
  return (
    <Badge
      text={config.label}
      appearance={config.color}
      iconBefore={config.icon}
    />
  );
};

const SourceBadge = ({ source }: { source: ContentSource }) => {
  const sourceConfig = {
    'ai-generated': { color: 'discovery', label: 'AI Generated' },
    imported: { color: 'information', label: 'Imported' },
    manual: { color: 'default', label: 'Manual' },
    upload: { color: 'success', label: 'Uploaded' },
    api: { color: 'warning', label: 'API' }
  };
  
  return (
    <Badge
      text={sourceConfig[source]?.label || source}
      appearance={sourceConfig[source]?.color || 'default'}
    />
  );
};
```

---

## Responsive Design

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────────────────┐
│ [≡] Content Library [+] [Import] [Export] [⚙]      │
├─────────────────────────────────────────────────────┤
│ 🔍 Search all content...           [Advanced ▼]    │
│ [All Types ▼] [Sources ▼] [Date ▼] [Sort ▼]        │
│ Active: Scripts × Generated ×                       │
├─────────────────────────────────────────────────────┤
│ ✓ 2 selected [Move] [Tag] [Export] [Delete]        │
├─────────────────────────────────────────────────────┤
│ ☐ Tokyo Guide          Script    AI Gen    2h ago  │
│   Ready to discover Tokyo's hidden gems...         │
│                                   [travel] [tokyo]  │
│ ☐ Food Video #1        Video     TikTok    1d ago  │
│   Amazing street food in Bangkok...                │
│                                   [food] [travel]   │
│ ☐ Travel Notes         Note      Manual    3d ago  │
│   Planning notes for upcoming trip...              │
│                                   [planning]        │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────────────┐
│ [≡] Library [+] [🔍]               │
├─────────────────────────────────────┤
│ Search: [tokyo                     ]│
│ [All ▼] [Recent ▼] [🔍]            │
│ Scripts × Generated ×               │
├─────────────────────────────────────┤
│ ┌─ Tokyo Guide ───────────────────┐ │
│ │ Script • AI Generated • 2h ago  │ │
│ │ Ready to discover Tokyo's       │ │
│ │ hidden gems...                  │ │
│ │ [travel] [tokyo] [guide]        │ │
│ │ [👁️] [✏️] [⋯]                   │ │
│ └─────────────────────────────────┘ │
│ ┌─ Food Video #1 ─────────────────┐ │
│ │ Video • TikTok • 1 day ago      │ │
│ │ Amazing street food in          │ │
│ │ Bangkok...                      │ │
│ │ [food] [travel]                 │ │
│ │ [👁️] [✏️] [⋯]                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Styling Specifications

```scss
.content-library {
  min-height: 100vh;
  background: $neutral-50;
  
  .library-header {
    background: $neutral-0;
    border-bottom: 1px solid $neutral-200;
    padding: $space-6 $space-8;
  }
  
  .search-section {
    background: $neutral-0;
    border-bottom: 1px solid $neutral-200;
    padding: $space-6 $space-8;
    
    .search-header {
      margin-bottom: $space-4;
    }
    
    .search-bar {
      margin-bottom: $space-4;
      
      .main-search {
        display: flex;
        gap: $space-3;
        align-items: center;
      }
    }
    
    .filter-controls {
      .quick-filters {
        display: flex;
        gap: $space-3;
        flex-wrap: wrap;
        align-items: center;
      }
    }
  }
  
  .main-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: $space-6;
    padding: $space-6 $space-8;
    max-width: 1400px;
    margin: 0 auto;
    
    @media (max-width: $bp-lg) {
      grid-template-columns: 1fr;
      padding: $space-4;
    }
  }
}

.content-data-table {
  background: $neutral-0;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
  
  .bulk-actions-bar {
    background: $claude-orange-50;
    border-bottom: 1px solid $claude-orange-200;
    padding: $space-4 $space-6;
    display: flex;
    align-items: center;
    gap: $space-4;
    
    .selected-count {
      font-weight: $font-medium;
      color: $claude-orange-700;
    }
  }
  
  .table-row {
    &:hover {
      background: $neutral-50;
    }
    
    &.selected {
      background: $claude-orange-50;
      border-left: 3px solid $claude-orange-500;
    }
  }
}

.content-title-cell {
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $space-1;
    
    .title-text {
      flex: 1;
      margin-right: $space-2;
    }
    
    .content-stats {
      display: flex;
      gap: $space-2;
      white-space: nowrap;
    }
  }
  
  .preview-text {
    line-height: $leading-tight;
  }
}

.preview-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .panel-header {
    padding: $space-6;
    border-bottom: 1px solid $neutral-200;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .content-title {
      display: flex;
      gap: $space-4;
      align-items: flex-start;
      flex: 1;
      
      .title-info {
        flex: 1;
        
        .title-metadata {
          display: flex;
          align-items: center;
          gap: $space-3;
          margin-top: $space-2;
        }
      }
    }
  }
  
  .tabs-container {
    flex: 1;
    overflow: hidden;
  }
  
  .panel-footer {
    padding: $space-4 $space-6;
    border-top: 1px solid $neutral-200;
    background: $neutral-50;
  }
}

.advanced-search-panel {
  background: $neutral-50;
  border: 1px solid $neutral-200;
  border-radius: $radius-lg;
  padding: $space-6;
  margin-top: $space-4;
  
  .search-criteria {
    .criteria-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: $space-6;
      
      @media (max-width: $bp-lg) {
        grid-template-columns: 1fr;
      }
    }
    
    .content-types-section,
    .sources-section {
      .checkbox-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $space-2;
        
        @media (max-width: $bp-sm) {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
```

This Content Library interface provides a comprehensive, searchable repository that makes finding and managing content intuitive while maintaining Claude's warm, organized design approach.