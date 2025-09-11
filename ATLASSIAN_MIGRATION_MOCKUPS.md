# Atlassian Design System Migration - UI Mockups & Component Mapping

## Overview

This document provides detailed UI mockups and component mapping for migrating Gen.C Alpha to Atlassian Design System. Each page includes component specifications, layout patterns, and interaction behaviors using Atlassian components.

---

## Collections Page - Atlassian Implementation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar (@atlaskit/navigation-next)                 │
├─────────────────────────────────────────────────────────────┤
│ Page Header (@atlaskit/page-header)                         │
│ ┌─ Collections / Video Library                             │
│ └─ Actions: [+ New Collection] [Import] [Settings]         │
├─────────────────────────────────────────────────────────────┤
│ Content Area                                               │
│ ┌───────────────┬─────────────────────────────────────────┐ │
│ │ Sidebar       │ Main Content                            │ │
│ │ (@atlaskit/   │ (@atlaskit/dynamic-table)               │ │
│ │ tree)         │                                         │ │
│ │               │ ┌─ Tabs: Collections | Saved Videos    │ │
│ │ Collections   │ ├─ Filter Bar (@atlaskit/textfield)    │ │
│ │ ├─ Favorites  │ │   [Search] [Platform ▼] [Sort ▼]     │ │
│ │ ├─ Recent     │ └─ Video Grid                           │ │
│ │ ├─ All        │   ┌───┬───┬───┬───┐                     │ │
│ │ └─ Trash      │   │ ▢ │ ▢ │ ▢ │ ▢ │ (@atlaskit/card)   │ │
│ │               │   ├───┼───┼───┼───┤                     │ │
│ │ Quick Actions │   │ ▢ │ ▢ │ ▢ │ ▢ │                     │ │
│ │ + Create      │   └───┴───┴───┴───┘                     │ │
│ │ ↑ Upload      │                                         │ │
│ └───────────────┴─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Video Card Component
```typescript
// Using @atlaskit/card
<Card appearance="raised" onClick={openVideoModal}>
  <CardHeader>
    <Avatar size="small" src={creator.avatar} />
    <Text weight="medium">{creator.name}</Text>
    <Badge text={platform} appearance="primary" />
  </CardHeader>
  <CardMedia>
    <VideoThumbnail src={video.thumbnail} duration={video.duration} />
  </CardMedia>
  <CardContent>
    <Text size="small" color="subtleText">{video.title}</Text>
    <Text size="xsmall" color="subtleText">{formatDate(video.created)}</Text>
  </CardContent>
  <CardActions>
    <Button appearance="subtle" iconBefore={EditIcon}>Edit</Button>
    <Button appearance="subtle" iconBefore={TrashIcon}>Delete</Button>
  </CardActions>
</Card>
```

#### Video Modal (Instagram-style)
```typescript
// Using @atlaskit/modal-dialog
<ModalDialog
  width="90vw"
  height="90vh"
  onClose={closeModal}
  appearance="chromeless"
>
  <div className="video-modal-container">
    <VideoPlayer src={currentVideo.url} />
    <NavigationControls>
      <Button iconOnly appearance="subtle" onClick={previousVideo}>
        <ChevronLeftIcon />
      </Button>
      <Button iconOnly appearance="subtle" onClick={nextVideo}>
        <ChevronRightIcon />
      </Button>
    </NavigationControls>
    <VideoMetadata>
      <Badge text={currentVideo.platform} />
      <Text>{currentVideo.description}</Text>
    </VideoMetadata>
  </div>
</ModalDialog>
```

#### Collections Sidebar
```typescript
// Using @atlaskit/tree
<Tree
  tree={collectionsTree}
  onExpand={handleExpand}
  onSelect={handleSelect}
  renderItem={({ item, provided }) => (
    <div ref={provided.innerRef} {...provided.draggableProps}>
      <TreeItem>
        <Icon glyph={item.icon} />
        <Text>{item.title}</Text>
        <Badge text={item.videoCount} />
        <DropdownMenu>
          <DropdownItemGroup>
            <DropdownItem>Rename</DropdownItem>
            <DropdownItem>Delete</DropdownItem>
          </DropdownItemGroup>
        </DropdownMenu>
      </TreeItem>
    </div>
  )}
/>
```

---

## Brand Hub Page - Atlassian Implementation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Page Header (@atlaskit/page-header)                         │
│ ┌─ Brand Hub / Creator Personas                            │
│ └─ Actions: [+ New Persona] [Import] [Export]              │
├─────────────────────────────────────────────────────────────┤
│ Filter Bar (@atlaskit/textfield + @atlaskit/select)        │
│ [Search personas...] [Platform ▼] [Category ▼] [View: Grid]│
├─────────────────────────────────────────────────────────────┤
│ Persona Grid                                               │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐   │
│ │ Persona Card│ Persona Card│ Persona Card│ + New Card  │   │
│ │(@atlaskit/  │             │             │             │   │
│ │ card)       │             │             │             │   │
│ │             │             │             │             │   │
│ │ [Avatar]    │ [Avatar]    │ [Avatar]    │ [+ Icon]    │   │
│ │ Name        │ Name        │ Name        │ Create New  │   │
│ │ Platform    │ Platform    │ Platform    │ Persona     │   │
│ │ Description │ Description │ Description │             │   │
│ │             │             │             │             │   │
│ │ [Edit][Del] │ [Edit][Del] │ [Edit][Del] │             │   │
│ └─────────────┴─────────────┴─────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Persona Card Component
```typescript
// Using @atlaskit/card
<Card appearance="elevated" isClickable onClick={editPersona}>
  <CardHeader>
    <Avatar size="large" src={persona.avatar} name={persona.name} />
    <div>
      <Heading size="medium">{persona.name}</Heading>
      <Badge text={persona.platform} appearance="primary" />
    </div>
  </CardHeader>
  <CardContent>
    <Text>{persona.description}</Text>
    <div className="persona-stats">
      <Lozenge appearance="success">{persona.videoCount} videos</Lozenge>
      <Lozenge appearance="default">{persona.category}</Lozenge>
    </div>
  </CardContent>
  <CardActions>
    <Button appearance="subtle" iconBefore={EditIcon}>Edit</Button>
    <Button appearance="subtle" iconBefore={DuplicateIcon}>Duplicate</Button>
    <Button appearance="warning" iconBefore={TrashIcon}>Delete</Button>
  </CardActions>
</Card>
```

#### Persona Creation Wizard
```typescript
// Using @atlaskit/modal-dialog with multi-step form
<ModalDialog
  width="800px"
  heading="Create New Persona"
  onClose={closeWizard}
  actions={[
    { text: 'Cancel', onClick: closeWizard },
    { text: 'Back', onClick: previousStep, isDisabled: currentStep === 0 },
    { text: currentStep === 2 ? 'Create Persona' : 'Next', onClick: nextStep, appearance: 'primary' }
  ]}
>
  <ProgressIndicator
    selectedIndex={currentStep}
    values={[
      { label: 'Upload Content' },
      { label: 'Configure Settings' },
      { label: 'Review & Create' }
    ]}
  />
  
  {currentStep === 0 && (
    <div className="upload-step">
      <Text size="large">Upload Creator Content</Text>
      <DropzoneView onDrop={handleVideoUpload}>
        <Text>Drop video files here or click to browse</Text>
      </DropzoneView>
      <SectionMessage appearance="info">
        <Text>Upload 3-5 videos to analyze creator style and generate persona</Text>
      </SectionMessage>
    </div>
  )}
  
  {currentStep === 1 && (
    <Form onSubmit={handlePersonaConfig}>
      <Field name="name" label="Persona Name" isRequired>
        {({ fieldProps }) => <Textfield {...fieldProps} />}
      </Field>
      <Field name="platform" label="Primary Platform">
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={platformOptions}
            placeholder="Select platform"
          />
        )}
      </Field>
      <Field name="category" label="Content Category">
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={categoryOptions}
            placeholder="Select category"
          />
        )}
      </Field>
    </Form>
  )}
</ModalDialog>
```

---

## Library Page - Atlassian Implementation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Page Header (@atlaskit/page-header)                         │
│ ┌─ Content Library                                          │
│ └─ Actions: [+ Add Content] [Import] [Export] [Settings]   │
├─────────────────────────────────────────────────────────────┤
│ Filter & Search Bar                                        │
│ [Search all content...] [Type ▼] [Source ▼] [Date ▼] [⚙]  │
├─────────────────────────────────────────────────────────────┤
│ Main Content Area                                          │
│ ┌───────────────────────────────┬─────────────────────────┐ │
│ │ Dynamic Table                 │ Content Panel           │ │
│ │ (@atlaskit/dynamic-table)     │ (@atlaskit/drawer)      │ │
│ │                               │                         │ │
│ │ ☐ Title        Type    Date   │ ┌─ Content Viewer      │ │
│ │ ☐ Script 1     Script  Today  │ │   [@atlaskit/tabs]   │ │
│ │ ☐ Chat 1       Chat    Yesterday│   [View] [Edit] [Notes]│ │
│ │ ☐ Hook 1       Hook    2 days │ │                       │ │
│ │ ☐ Idea 1       Idea    1 week │ │ Content Preview       │ │
│ │                               │ │ (Rich Text Editor)    │ │
│ │ [Bulk Actions]                │ │                       │ │
│ │ [Download] [Delete] [Tag]     │ │                       │ │
│ └───────────────────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Content Data Table
```typescript
// Using @atlaskit/dynamic-table
<DynamicTable
  head={{
    cells: [
      { key: 'select', content: <Checkbox />, width: 4 },
      { key: 'title', content: 'Title', isSortable: true },
      { key: 'type', content: 'Type', isSortable: true },
      { key: 'source', content: 'Source', isSortable: true },
      { key: 'created', content: 'Created', isSortable: true },
      { key: 'actions', content: 'Actions', width: 10 }
    ]
  }}
  rows={contentRows.map(item => ({
    key: item.id,
    cells: [
      { content: <Checkbox isChecked={selectedItems.includes(item.id)} /> },
      { 
        content: (
          <div>
            <Text weight="medium">{item.title}</Text>
            <Text size="small" color="subtleText">{truncate(item.preview)}</Text>
          </div>
        )
      },
      { content: <Badge text={item.type} appearance="primary" /> },
      { content: <Badge text={item.source} appearance="default" /> },
      { content: <Text size="small">{formatDate(item.created)}</Text> },
      { 
        content: (
          <div>
            <Button appearance="subtle" iconBefore={EyeIcon} onClick={() => viewContent(item)}>
              View
            </Button>
            <DropdownMenu>
              <DropdownItem>Edit</DropdownItem>
              <DropdownItem>Download</DropdownItem>
              <DropdownItem>Delete</DropdownItem>
            </DropdownMenu>
          </div>
        )
      }
    ]
  }))}
  isLoading={isLoading}
  loadingSpinnerSize="large"
/>
```

#### Content Viewer Panel
```typescript
// Using @atlaskit/drawer
<Drawer
  isOpen={isContentPanelOpen}
  onClose={closeContentPanel}
  width="narrow" // 400px
  label="Content Viewer"
>
  <div className="content-panel">
    <div className="panel-header">
      <Heading size="medium">{selectedContent.title}</Heading>
      <Button appearance="subtle" iconBefore={CrossIcon} onClick={closeContentPanel} />
    </div>
    
    <Tabs
      tabs={[
        {
          label: 'View',
          content: (
            <div className="content-preview">
              {selectedContent.type === 'video' && (
                <VideoPlayer src={selectedContent.url} />
              )}
              <Text>{selectedContent.content}</Text>
            </div>
          )
        },
        {
          label: 'Edit',
          content: (
            <div className="content-editor">
              <Editor
                appearance="comment"
                placeholder="Edit content..."
                value={selectedContent.content}
                onChange={handleContentEdit}
              />
            </div>
          )
        },
        {
          label: 'Notes',
          content: (
            <div className="content-notes">
              <TextArea
                placeholder="Add your notes..."
                value={selectedContent.notes}
                onChange={handleNotesChange}
              />
            </div>
          )
        }
      ]}
    />
  </div>
</Drawer>
```

---

## Write Page - Atlassian Implementation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Page Header (@atlaskit/page-header)                         │
│ ┌─ Script Writer                                            │
│ └─ Actions: [Templates ▼] [Generators ▼] [Voice] [Save]    │
├─────────────────────────────────────────────────────────────┤
│ Daily Picks Section (Expandable)                           │
│ ┌─ Today's Trending Content ────────────────── [Expand ▼]  │
│ │ ┌─────┬─────┬─────┬─────┬─────┐                          │
│ │ │Card │Card │Card │Card │Card │ (@atlaskit/card)        │
│ │ └─────┴─────┴─────┴─────┴─────┘                          │
│ └────────────────────────────────────────────────────────── │
├─────────────────────────────────────────────────────────────┤
│ Main Writing Interface                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Script Generation Area                                  │ │
│ │                                                         │ │
│ │ [INPUT VIEW]                                           │ │
│ │ ┌─ Prompt Input (@atlaskit/textfield)                  │ │
│ │ │  "Write a script about..."                           │ │
│ │ └─────────────────────────────────────────────────────  │ │
│ │ ┌─ Configuration                                       │ │
│ │ │  Generator: [Creative ▼] Persona: [Select ▼]         │ │
│ │ │  Length: [Short ▼] Style: [Engaging ▼]              │ │
│ │ └─────────────────────────────────────────────────────  │ │
│ │                                                         │ │
│ │ [Generate Script] - Primary Button                     │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Script Generation Interface
```typescript
// Multi-state interface using @atlaskit components
const ScriptWriter = () => {
  const [view, setView] = useState('input'); // input, generating, editing, transcribing

  return (
    <div className="script-writer">
      {view === 'input' && (
        <div className="input-view">
          <div className="prompt-section">
            <Field name="prompt" label="Script Prompt" isRequired>
              {({ fieldProps }) => (
                <TextArea
                  {...fieldProps}
                  placeholder="Describe the script you want to create..."
                  rows={4}
                />
              )}
            </Field>
          </div>
          
          <div className="configuration-grid">
            <Field name="generator" label="AI Generator">
              {({ fieldProps }) => (
                <Select
                  {...fieldProps}
                  options={generatorOptions}
                  defaultValue={generatorOptions[0]}
                />
              )}
            </Field>
            
            <Field name="persona" label="Creator Persona">
              {({ fieldProps }) => (
                <Select
                  {...fieldProps}
                  options={personaOptions}
                  placeholder="Select persona (optional)"
                />
              )}
            </Field>
            
            <Field name="length" label="Script Length">
              {({ fieldProps }) => (
                <Select
                  {...fieldProps}
                  options={lengthOptions}
                  defaultValue={lengthOptions[1]}
                />
              )}
            </Field>
            
            <Field name="style" label="Writing Style">
              {({ fieldProps }) => (
                <Select
                  {...fieldProps}
                  options={styleOptions}
                  defaultValue={styleOptions[0]}
                />
              )}
            </Field>
          </div>
          
          <div className="action-buttons">
            <ButtonGroup>
              <Button
                appearance="primary"
                iconBefore={<MagicIcon />}
                onClick={generateScript}
                isLoading={isGenerating}
              >
                Generate Script
              </Button>
              <Button
                appearance="default"
                iconBefore={<MicrophoneIcon />}
                onClick={startVoiceRecording}
              >
                Voice Input
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}
      
      {view === 'generating' && (
        <div className="generating-view">
          <div className="generation-progress">
            <Spinner size="xlarge" />
            <Heading size="large">Generating your script...</Heading>
            <ProgressBar value={generationProgress} />
            <Text color="subtleText">
              This may take 30-60 seconds depending on complexity
            </Text>
          </div>
          
          <div className="generation-stages">
            <ProgressIndicator
              selectedIndex={currentStage}
              values={[
                { label: 'Analyzing prompt' },
                { label: 'Generating content' },
                { label: 'Applying style' },
                { label: 'Finalizing script' }
              ]}
            />
          </div>
        </div>
      )}
      
      {view === 'editing' && (
        <div className="editing-view">
          <div className="editor-toolbar">
            <ButtonGroup>
              <Button appearance="subtle" iconBefore={<UndoIcon />}>Undo</Button>
              <Button appearance="subtle" iconBefore={<RedoIcon />}>Redo</Button>
              <Button appearance="subtle" iconBefore={<BoldIcon />}>Bold</Button>
              <Button appearance="subtle" iconBefore={<ItalicIcon />}>Italic</Button>
            </ButtonGroup>
            
            <div className="script-actions">
              <Button appearance="default" iconBefore={<CopyIcon />}>Copy</Button>
              <Button appearance="default" iconBefore={<DownloadIcon />}>Export</Button>
              <Button appearance="primary" iconBefore={<SaveIcon />}>Save to Library</Button>
            </div>
          </div>
          
          <div className="script-editor">
            <Editor
              appearance="full-width"
              placeholder="Your generated script will appear here..."
              value={generatedScript}
              onChange={handleScriptEdit}
              primaryToolbarComponents={[
                'heading',
                'bold',
                'italic',
                'underline',
                'bullet-list',
                'numbered-list'
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Daily Picks Expandable Section
```typescript
// Using @atlaskit/card for content picks
<Section>
  <SectionHeader>
    <Heading size="medium">Today's Trending Content</Heading>
    <Button
      appearance="subtle"
      iconAfter={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      onClick={toggleExpanded}
    >
      {isExpanded ? 'Collapse' : 'Explore'}
    </Button>
  </SectionHeader>
  
  {isExpanded && (
    <div className="daily-picks-grid">
      {dailyPicks.map(pick => (
        <Card key={pick.id} appearance="raised" onClick={() => usePick(pick)}>
          <CardHeader>
            <Badge text={pick.platform} appearance="primary" />
            <Badge text={`${pick.engagement} views`} appearance="success" />
          </CardHeader>
          <CardContent>
            <Text weight="semibold">{pick.title}</Text>
            <Text size="small" color="subtleText">{pick.description}</Text>
            <div className="trending-indicators">
              <Lozenge appearance="success">
                <TrendingUpIcon size="small" /> Trending
              </Lozenge>
            </div>
          </CardContent>
          <CardActions>
            <Button appearance="primary" size="compact">Use This Idea</Button>
            <Button appearance="subtle" size="compact" iconBefore={<BookmarkIcon />}>Save</Button>
          </CardActions>
        </Card>
      ))}
    </div>
  )}
</Section>
```

---

## Settings Page - Atlassian Implementation

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Page Header (@atlaskit/page-header)                         │
│ ┌─ Settings                                                 │
│ └─ Description: Manage your account and preferences        │
├─────────────────────────────────────────────────────────────┤
│ Tab Navigation (@atlaskit/tabs)                            │
│ [Account] [Billing] [Notifications] [API Keys] [Advanced]  │
├─────────────────────────────────────────────────────────────┤
│ Settings Content Area                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [ACCOUNT TAB ACTIVE]                                    │ │
│ │                                                         │ │
│ │ Profile Information                                     │ │
│ │ ┌─ Avatar Upload (@atlaskit/avatar)                     │ │
│ │ │  [Current Avatar] [Upload New] [Remove]               │ │
│ │ └───────────────────────────────────────────────────── │ │
│ │                                                         │ │
│ │ Account Details (@atlaskit/form)                        │ │
│ │ ┌─ Full Name      [John Doe                    ]        │ │
│ │ ├─ Email Address  [john@example.com            ]        │ │
│ │ ├─ Username       [johndoe                     ]        │ │
│ │ └─ Timezone       [UTC-5 Eastern ▼            ]        │ │
│ │                                                         │ │
│ │ [Save Changes] [Cancel]                                 │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Settings Tabs Interface
```typescript
// Using @atlaskit/tabs
<Tabs
  tabs={[
    {
      label: 'Account',
      content: <AccountSettings />
    },
    {
      label: 'Billing',
      content: <BillingSettings />
    },
    {
      label: 'Notifications',
      content: <NotificationSettings />
    },
    {
      label: 'API Keys',
      content: <ApiKeySettings />
    },
    {
      label: 'Advanced',
      content: <AdvancedSettings />
    }
  ]}
  selected={activeTab}
  onChange={handleTabChange}
/>
```

#### Account Settings Form
```typescript
// Using @atlaskit/form
<Form onSubmit={handleSaveProfile}>
  {({ formProps }) => (
    <form {...formProps}>
      <div className="profile-section">
        <Heading size="small">Profile Picture</Heading>
        <div className="avatar-upload">
          <Avatar size="xlarge" src={user.avatar} name={user.name} />
          <div className="avatar-actions">
            <Button appearance="primary">Upload New</Button>
            <Button appearance="subtle">Remove</Button>
          </div>
        </div>
      </div>
      
      <div className="form-fields">
        <Field name="fullName" label="Full Name" isRequired>
          {({ fieldProps, error }) => (
            <>
              <Textfield {...fieldProps} />
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </>
          )}
        </Field>
        
        <Field name="email" label="Email Address" isRequired>
          {({ fieldProps, error }) => (
            <>
              <Textfield {...fieldProps} type="email" />
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </>
          )}
        </Field>
        
        <Field name="username" label="Username" isRequired>
          {({ fieldProps, error }) => (
            <>
              <Textfield {...fieldProps} />
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </>
          )}
        </Field>
        
        <Field name="timezone" label="Timezone">
          {({ fieldProps }) => (
            <Select
              {...fieldProps}
              options={timezoneOptions}
              placeholder="Select timezone"
            />
          )}
        </Field>
      </div>
      
      <div className="form-actions">
        <ButtonGroup>
          <Button type="submit" appearance="primary">Save Changes</Button>
          <Button appearance="subtle" onClick={resetForm}>Cancel</Button>
        </ButtonGroup>
      </div>
    </form>
  )}
</Form>
```

#### API Keys Management
```typescript
// Using @atlaskit/dynamic-table for API keys list
<div className="api-keys-section">
  <div className="section-header">
    <Heading size="medium">API Keys</Heading>
    <Button appearance="primary" iconBefore={<AddIcon />} onClick={createApiKey}>
      Generate New Key
    </Button>
  </div>
  
  <SectionMessage appearance="info">
    <Text>
      API keys allow you to access Gen.C features programmatically. 
      Keep your keys secure and never share them publicly.
    </Text>
  </SectionMessage>
  
  <DynamicTable
    head={{
      cells: [
        { key: 'name', content: 'Key Name', isSortable: true },
        { key: 'key', content: 'API Key' },
        { key: 'created', content: 'Created', isSortable: true },
        { key: 'usage', content: 'Usage', isSortable: true },
        { key: 'actions', content: 'Actions' }
      ]
    }}
    rows={apiKeys.map(key => ({
      key: key.id,
      cells: [
        { content: <Text weight="medium">{key.name}</Text> },
        { 
          content: (
            <div className="api-key-display">
              <Text family="monospace">{maskApiKey(key.value)}</Text>
              <Button appearance="subtle" iconBefore={<CopyIcon />} onClick={() => copyApiKey(key.value)}>
                Copy
              </Button>
            </div>
          )
        },
        { content: <Text size="small">{formatDate(key.created)}</Text> },
        { 
          content: (
            <div>
              <Text size="small">{key.usage.toLocaleString()} requests</Text>
              <ProgressBar value={key.usage / key.limit * 100} />
            </div>
          )
        },
        { 
          content: (
            <DropdownMenu>
              <DropdownItem onClick={() => editApiKey(key)}>Edit</DropdownItem>
              <DropdownItem onClick={() => regenerateApiKey(key)}>Regenerate</DropdownItem>
              <DropdownItem onClick={() => deleteApiKey(key)}>Delete</DropdownItem>
            </DropdownMenu>
          )
        }
      ]
    }))}
    isLoading={isLoading}
  />
</div>
```

---

## Chrome Extension & Downloads Pages - Atlassian Implementation

### Chrome Extension Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Hero Section                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Chrome Extension                                        │ │
│ │ Capture content from any website instantly             │ │
│ │                                                         │ │
│ │ [Download Extension] - Primary CTA                      │ │
│ │ [View Setup Guide] - Secondary                          │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Feature Showcase (@atlaskit/card grid)                     │
│ ┌─────────────┬─────────────┬─────────────┐               │
│ │ Universal   │ One-Click   │ Smart       │               │
│ │ Capture     │ Save        │ Organization│               │
│ └─────────────┴─────────────┴─────────────┘               │
├─────────────────────────────────────────────────────────────┤
│ Installation Guide (@atlaskit/section-message)             │
│ Step-by-step setup instructions with screenshots           │
└─────────────────────────────────────────────────────────────┘
```

### Downloads Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│ iOS Shortcuts Section                                      │
│ ┌─────────────────────┬─────────────────────┐             │
│ │ Save Videos         │ Voice Notes         │             │
│ │ Shortcut           │ Shortcut           │             │
│ │                    │                    │             │
│ │ [Download]         │ [Download]         │             │
│ │ [Setup Guide]      │ [Setup Guide]      │             │
│ └─────────────────────┴─────────────────────┘             │
├─────────────────────────────────────────────────────────────┤
│ Setup Requirements (@atlaskit/section-message)             │
│ API Key configuration and testing instructions             │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Feature Showcase Cards
```typescript
// Using @atlaskit/card for feature display
<div className="feature-grid">
  {features.map(feature => (
    <Card key={feature.id} appearance="elevated">
      <CardHeader>
        <Icon glyph={feature.icon} size="large" primaryColor="#0052CC" />
        <Heading size="medium">{feature.title}</Heading>
      </CardHeader>
      <CardContent>
        <Text>{feature.description}</Text>
        <ul className="feature-list">
          {feature.benefits.map(benefit => (
            <li key={benefit}>
              <Icon glyph="check-circle" size="small" primaryColor="#00875A" />
              <Text size="small">{benefit}</Text>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  ))}
</div>
```

#### Installation Steps
```typescript
// Using @atlaskit/section-message and progress indicator
<div className="installation-guide">
  <Heading size="large">Installation Guide</Heading>
  
  <ProgressIndicator
    selectedIndex={currentStep}
    values={installationSteps.map(step => ({ label: step.title }))}
  />
  
  {installationSteps.map((step, index) => (
    <SectionMessage
      key={step.id}
      appearance={index === currentStep ? "discovery" : "default"}
    >
      <div className="step-content">
        <Heading size="small">Step {index + 1}: {step.title}</Heading>
        <Text>{step.description}</Text>
        {step.screenshot && (
          <div className="step-screenshot">
            <img src={step.screenshot} alt={`Step ${index + 1}`} />
          </div>
        )}
        <div className="step-actions">
          <Button
            appearance="primary"
            onClick={() => completeStep(index)}
            isDisabled={index > currentStep}
          >
            {step.actionText}
          </Button>
        </div>
      </div>
    </SectionMessage>
  ))}
</div>
```

---

## Global Navigation - Atlassian Implementation

### Navigation Structure
```typescript
// Using @atlaskit/navigation-next
<Navigation>
  <NavigationHeader>
    <div className="nav-header">
      <Logo src="/logo.svg" alt="Gen.C" />
      <Heading size="medium">Gen.C Alpha</Heading>
    </div>
  </NavigationHeader>
  
  <NavigationContent>
    <Section>
      <SectionHeading>Content</SectionHeading>
      <Item
        href="/collections"
        text="Collections"
        icon={CollectionIcon}
        isSelected={pathname === '/collections'}
      />
      <Item
        href="/library"
        text="Library"
        icon={LibraryIcon}
        isSelected={pathname === '/library'}
      />
      <Item
        href="/write"
        text="Write"
        icon={EditIcon}
        isSelected={pathname === '/write'}
      />
    </Section>
    
    <Section>
      <SectionHeading>Brand</SectionHeading>
      <Item
        href="/brand-hub"
        text="Brand Hub"
        icon={PersonIcon}
        isSelected={pathname === '/brand-hub'}
      />
    </Section>
    
    <Section>
      <SectionHeading>Tools</SectionHeading>
      <Item
        href="/chrome-extension"
        text="Chrome Extension"
        icon={ExtensionIcon}
        isSelected={pathname === '/chrome-extension'}
      />
      <Item
        href="/downloads"
        text="Downloads"
        icon={DownloadIcon}
        isSelected={pathname === '/downloads'}
      />
    </Section>
  </NavigationContent>
  
  <NavigationFooter>
    <Item
      href="/settings"
      text="Settings"
      icon={SettingsIcon}
      isSelected={pathname === '/settings'}
    />
    <UserMenu
      avatar={<Avatar src={user.avatar} name={user.name} />}
      name={user.name}
      email={user.email}
    />
  </NavigationFooter>
</Navigation>
```

---

## Responsive Design Patterns

### Mobile Adaptations
- **Navigation:** Collapsible hamburger menu using `@atlaskit/drawer`
- **Tables:** Horizontal scroll with sticky columns using `@atlaskit/dynamic-table`
- **Cards:** Single column layout on mobile, responsive grid on desktop
- **Panels:** Full-screen overlay on mobile, side panel on desktop
- **Forms:** Stacked layout with full-width inputs

### Tablet Optimizations
- **Navigation:** Condensed sidebar with icon-only items
- **Content:** 2-column layouts where appropriate
- **Touch Targets:** Larger button sizes and touch-friendly spacing
- **Panels:** Medium-width panels (500px) with responsive behavior

This comprehensive mockup specification provides the foundation for implementing Gen.C Alpha using Atlassian Design System components while maintaining all existing functionality and improving the overall user experience.