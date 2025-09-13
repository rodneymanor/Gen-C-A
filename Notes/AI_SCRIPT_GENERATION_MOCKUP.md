# Gen.C Alpha - AI Script Generation Workspace Mockup

## Design Overview

The AI Script Generation Workspace serves as the creative heart of Gen.C Alpha, where users transform ideas into polished scripts through AI assistance. The interface embodies Claude's conversational design philosophy, making complex AI interactions feel natural and approachable while providing powerful customization options.

---

## Layout Structure

### Desktop Layout - Input State (1280px+)
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Page Header                                                                         │
│ ┌─ Script Writer ──────────────── [Templates ▼] [Generators ▼] [🎤 Voice] [💾] ─┐ │
│ │                                                                                 │ │
│ │ Transform your ideas into engaging scripts with AI assistance                   │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Daily Content Inspiration (Collapsible)                                            │
│ ┌─ ✨ Today's Trending Content ────────────────────────────── [Explore More ▼] ─┐ │
│ │ ┌─────┬─────┬─────┬─────┬─────┐                                                 │ │
│ │ │ 🎬  │ 🎬  │ 🎬  │ 🎬  │ 🎬  │ Quick inspiration from trending content        │ │
│ │ │Card │Card │Card │Card │Card │                                                 │ │
│ │ └─────┴─────┴─────┴─────┴─────┘                                                 │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Main Generation Workspace                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Script Generation Interface                                                     │ │
│ │                                                                                 │ │
│ │ ┌─ What would you like to create? ─────────────────────────────────────────────┐ │ │
│ │ │                                                                               │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Describe your script idea...                                            │ │ │ │
│ │ │ │                                                                         │ │ │ │
│ │ │ │ Example: "Create a fun travel guide for Tokyo highlighting            │ │ │ │
│ │ │ │ hidden gems and local food spots that most tourists miss"             │ │ │ │
│ │ │ │                                                                         │ │ │ │
│ │ │ │                                                                         │ │ │ │
│ │ │ │                             [💡 Get Ideas]                             │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ └───────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ ┌─ Customize Your Script ────────────────────────────────────────────────────┐ │ │
│ │ │                                                                             │ │ │
│ │ │ ┌─ AI Generator ───┬─ Creator Persona ──┬─ Script Length ──┬─ Style ─────┐ │ │ │
│ │ │ │                 │                     │                  │             │ │ │ │
│ │ │ │ Creative Writer │ Alex - Travel       │ Short (30-60s)   │ Engaging    │ │ │ │
│ │ │ │ GPT-4 ▼         │ Enthusiast ▼        │ ▼               │ & Fun ▼     │ │ │ │
│ │ │ │                 │                     │                  │             │ │ │ │
│ │ │ │ ✨ Best for     │ 🎭 Matches your     │ ⏱️ Perfect for  │ 🎨 Tone &   │ │ │ │
│ │ │ │   creative      │   brand voice       │   TikTok/Reels   │   approach  │ │ │ │
│ │ │ │   content       │                     │                  │             │ │ │ │
│ │ │ └─────────────────┴─────────────────────┴──────────────────┴─────────────┘ │ │ │
│ │ │                                                                             │ │ │
│ │ │ ┌─ Additional Options ──────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ ☐ Include call-to-action     ☐ Add trending hashtags                     │ │ │ │
│ │ │ │ ☐ Include hook/opener        ☐ Optimize for engagement                   │ │ │ │
│ │ │ └───────────────────────────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ ┌─ Generate ─────────────────────────────────────────────────────────────────┐ │ │
│ │ │                                                                             │ │ │
│ │ │             [🪄 Generate My Script] - Primary Action Button                │ │ │ │
│ │ │                                                                             │ │ │ │
│ │ │         [🎤 Use Voice Input]        [📄 Load Template]                     │ │ │ │
│ │ │                                                                             │ │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Generation State Layout
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Generation Progress Interface                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✨ Generating your script...                                                   │ │
│ │                                                                                 │ │
│ │                            🤖 AI Writer                                        │ │
│ │                                                                                 │ │
│ │ ┌─ Generation Progress ──────────────────────────────────────────────────────┐ │ │
│ │ │ ████████████████░░░░ 75%                                                   │ │ │
│ │ │                                                                             │ │ │
│ │ │ Currently: Applying your brand voice and style preferences                 │ │ │
│ │ │ Estimated time: 15-30 seconds remaining                                    │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ ┌─ Generation Stages ────────────────────────────────────────────────────────┐ │ │
│ │ │ ✅ Analyzing your prompt                                                   │ │ │
│ │ │ ✅ Researching content ideas                                               │ │ │
│ │ │ ⏳ Generating creative content                                             │ │ │
│ │ │ ⏸️  Applying brand voice                                                   │ │ │
│ │ │ ⏸️  Final polish & optimization                                            │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ ┌─ Preview of Generated Content ─────────────────────────────────────────────┐ │ │
│ │ │ "Ready to discover Tokyo's hidden gems? 🏮                                 │ │ │
│ │ │                                                                             │ │ │
│ │ │ Forget the tourist traps! I'm about to show you the secret spots         │ │ │
│ │ │ where locals actually eat, shop, and explore..."                           │ │ │
│ │ │                                                                             │ │ │
│ │ │ [Content continues to generate in real-time...]                           │ │ │
│ │ └─────────────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │ [⏹️ Stop Generation] [🔄 Generate Different Version]                          │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Script Editor State Layout
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Script Editor Interface                                                             │
│ ┌─ Script Editor ─────────────────────────── [Save] [Export] [New Version] [📄] ─┐ │
│ │                                                                                 │ │
│ │ Your script is ready! Make any adjustments you'd like.                         │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Editor Toolbar ────────────────────────────────────────────────────────────────┐ │
│ │ [↶] [↷] | [B] [I] [U] | [🎬] [⏱️] [📝] [💬] | Word count: 127 | Duration: ~45s  │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Script Content Editor                                                           │ │
│ │ ┌───────────────────────────────────────────────────────────────────────────┐   │ │
│ │ │ HOOK (0-3s)                                                               │   │ │
│ │ │ Ready to discover Tokyo's hidden gems? 🏮                                 │   │ │
│ │ │                                                                           │   │ │
│ │ │ INTRODUCTION (3-8s)                                                       │   │ │
│ │ │ Forget the tourist traps! I'm about to show you the secret spots        │   │ │
│ │ │ where locals actually eat, shop, and explore. These are the places      │   │ │
│ │ │ you won't find in any guidebook.                                         │   │ │
│ │ │                                                                           │   │ │
│ │ │ MAIN CONTENT (8-35s)                                                     │   │ │
│ │ │ First stop: Omoide Yokocho - this tiny alley in Shinjuku looks like     │   │ │
│ │ │ something from a movie. Duck under the red lanterns and try the          │   │ │
│ │ │ yakitori at Torikizoku. It's where salarymen go after work.             │   │ │
│ │ │                                                                           │   │ │
│ │ │ Next, head to Ameya-Yokocho market. This chaotic bazaar under the       │   │ │
│ │ │ train tracks has everything from vintage jeans to fresh sushi.           │   │ │
│ │ │                                                                           │   │ │
│ │ │ CALL TO ACTION (35-45s)                                                  │   │ │
│ │ │ Which hidden gem are you trying first? Drop a 🏮 if you're planning     │   │ │
│ │ │ a Tokyo trip! And follow for more insider travel tips.                  │   │ │
│ │ └───────────────────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Editor Actions ────────────────────────────────────────────────────────────────┐ │
│ │ [🔄 Regenerate Section] [➕ Add Section] [🎯 Optimize Hook] [📊 Analyze Tone]  │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Content Inspiration Section
```typescript
interface ContentInspiration {
  id: string;
  title: string;
  platform: Platform;
  engagement: number;
  thumbnail: string;
  category: string;
  trendingScore: number;
}

const ContentInspirationSection = ({ isExpanded, onToggle }: InspirationSectionProps) => {
  const [inspirationContent, setInspirationContent] = useState<ContentInspiration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="content-inspiration-section">
      <div className="section-header">
        <div className="header-content">
          <div className="header-title">
            <Icon glyph="star-filled" size="24" primaryColor="#F59E0B" />
            <Heading size="lg">Today's Trending Content</Heading>
            <Badge text="Updated 2h ago" appearance="discovery" />
          </div>
          <Button
            appearance="subtle"
            iconAfter={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
          >
            {isExpanded ? 'Show Less' : 'Explore More'}
          </Button>
        </div>
        
        <Text size="sm" color="neutral-600">
          Get inspired by what's working across platforms
        </Text>
      </div>

      <div className="inspiration-preview">
        <InspirationCarousel
          items={inspirationContent.slice(0, 5)}
          onItemClick={useInspirationForScript}
          isLoading={isLoading}
        />
      </div>

      {isExpanded && (
        <div className="expanded-inspiration">
          <div className="inspiration-filters">
            <Select
              placeholder="All Platforms"
              options={platformOptions}
              onChange={filterByPlatform}
            />
            <Select
              placeholder="All Categories"
              options={categoryOptions}
              onChange={filterByCategory}
            />
            <Button
              appearance="subtle"
              iconBefore={<RefreshIcon />}
              onClick={refreshContent}
            >
              Refresh
            </Button>
          </div>
          
          <div className="inspiration-grid">
            {inspirationContent.map(item => (
              <InspirationCard
                key={item.id}
                content={item}
                onUse={() => useInspirationForScript(item)}
                onSave={() => saveToLibrary(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Script Input Interface
```typescript
interface ScriptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  configuration: ScriptConfiguration;
  onConfigurationChange: (config: ScriptConfiguration) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ScriptInputInterface = ({
  prompt,
  onPromptChange,
  configuration,
  onConfigurationChange,
  onGenerate,
  isGenerating
}: ScriptInputProps) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const generatorOptions = [
    {
      value: 'creative-gpt4',
      label: 'Creative Writer',
      description: 'GPT-4 - Best for creative, engaging content',
      icon: '✨'
    },
    {
      value: 'strategic-claude',
      label: 'Strategic Planner',
      description: 'Claude - Excellent for structured, goal-oriented scripts',
      icon: '🎯'
    },
    {
      value: 'viral-specialist',
      label: 'Viral Content Specialist',
      description: 'Optimized for high-engagement, shareable content',
      icon: '🚀'
    }
  ];

  return (
    <div className="script-input-interface">
      <div className="input-section">
        <div className="section-header">
          <Heading size="lg" color="neutral-800">
            What would you like to create?
          </Heading>
          <Text size="md" color="neutral-600">
            Describe your script idea and we'll help bring it to life
          </Text>
        </div>
        
        <div className="prompt-input">
          <TextArea
            value={prompt}
            onChange={onPromptChange}
            placeholder="Describe your script idea..."
            rows={4}
            resize="vertical"
            maxLength={1000}
            appearance="subtle"
          />
          
          <div className="input-helpers">
            <div className="character-count">
              <Text size="xs" color="neutral-500">
                {prompt.length}/1000 characters
              </Text>
            </div>
            <Button
              appearance="subtle"
              iconBefore={<LightbulbIcon />}
              onClick={showPromptSuggestions}
              size="small"
            >
              Get Ideas
            </Button>
          </div>
          
          <div className="example-prompts">
            <Text size="sm" color="neutral-600">Examples:</Text>
            <div className="example-tags">
              {examplePrompts.map(example => (
                <Tag
                  key={example}
                  text={example}
                  onClick={() => onPromptChange(example)}
                  appearance="rounded"
                  color="neutral"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="configuration-section">
        <div className="section-header">
          <Heading size="md" color="neutral-800">
            Customize Your Script
          </Heading>
        </div>
        
        <div className="config-grid">
          <ConfigurationCard
            title="AI Generator"
            icon="🤖"
            description="Choose your AI writing assistant"
          >
            <Select
              options={generatorOptions}
              value={configuration.generator}
              onChange={(generator) => onConfigurationChange({ ...configuration, generator })}
              placeholder="Select generator"
            />
          </ConfigurationCard>
          
          <ConfigurationCard
            title="Creator Persona"
            icon="🎭"
            description="Match your brand voice"
          >
            <PersonaSelector
              personas={userPersonas}
              selected={configuration.persona}
              onSelect={(persona) => onConfigurationChange({ ...configuration, persona })}
              onCreateNew={createNewPersona}
            />
          </ConfigurationCard>
          
          <ConfigurationCard
            title="Script Length"
            icon="⏱️"
            description="Perfect for your platform"
          >
            <SegmentedControl
              options={[
                { label: 'Short', value: 'short', description: '30-60s' },
                { label: 'Medium', value: 'medium', description: '1-2min' },
                { label: 'Long', value: 'long', description: '2-5min' }
              ]}
              value={configuration.length}
              onChange={(length) => onConfigurationChange({ ...configuration, length })}
            />
          </ConfigurationCard>
          
          <ConfigurationCard
            title="Writing Style"
            icon="🎨"
            description="Tone & approach"
          >
            <Select
              options={styleOptions}
              value={configuration.style}
              onChange={(style) => onConfigurationChange({ ...configuration, style })}
            />
          </ConfigurationCard>
        </div>
        
        <div className="advanced-options">
          <Button
            appearance="subtle"
            iconBefore={showAdvancedOptions ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            Advanced Options
          </Button>
          
          {showAdvancedOptions && (
            <div className="advanced-controls">
              <div className="options-grid">
                <Checkbox
                  isChecked={configuration.includeCTA}
                  onChange={(includeCTA) => onConfigurationChange({ ...configuration, includeCTA })}
                  label="Include call-to-action"
                />
                <Checkbox
                  isChecked={configuration.addHashtags}
                  onChange={(addHashtags) => onConfigurationChange({ ...configuration, addHashtags })}
                  label="Add trending hashtags"
                />
                <Checkbox
                  isChecked={configuration.optimizeHook}
                  onChange={(optimizeHook) => onConfigurationChange({ ...configuration, optimizeHook })}
                  label="Optimize hook/opener"
                />
                <Checkbox
                  isChecked={configuration.engagementOptimization}
                  onChange={(engagementOptimization) => 
                    onConfigurationChange({ ...configuration, engagementOptimization })
                  }
                  label="Optimize for engagement"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="action-section">
        <div className="primary-action">
          <Button
            appearance="primary"
            iconBefore={<MagicWandIcon />}
            onClick={onGenerate}
            isLoading={isGenerating}
            isDisabled={!prompt.trim() || prompt.length < 10}
            size="large"
          >
            {isGenerating ? 'Generating Script...' : 'Generate My Script'}
          </Button>
        </div>
        
        <div className="secondary-actions">
          <Button
            appearance="default"
            iconBefore={<MicrophoneIcon />}
            onClick={startVoiceInput}
          >
            Use Voice Input
          </Button>
          <Button
            appearance="default"
            iconBefore={<TemplateIcon />}
            onClick={openTemplateSelector}
          >
            Load Template
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Generation Progress Interface
```typescript
const GenerationProgressInterface = ({ 
  progress, 
  currentStage, 
  generatedContent, 
  onStop, 
  onRegenerateVersion 
}: GenerationProgressProps) => {
  const stages = [
    { id: 'analyze', label: 'Analyzing your prompt', icon: '🔍' },
    { id: 'research', label: 'Researching content ideas', icon: '📚' },
    { id: 'generate', label: 'Generating creative content', icon: '✨' },
    { id: 'brand', label: 'Applying brand voice', icon: '🎭' },
    { id: 'polish', label: 'Final polish & optimization', icon: '💎' }
  ];

  return (
    <div className="generation-progress-interface">
      <div className="progress-header">
        <div className="status-indicator">
          <Spinner size="large" />
          <Heading size="xl">Generating your script...</Heading>
          <Text size="lg" color="neutral-600">
            Our AI is crafting something amazing for you
          </Text>
        </div>
      </div>
      
      <div className="progress-details">
        <div className="progress-bar-section">
          <ProgressBar 
            value={progress} 
            appearance="success" 
            isIndeterminate={false}
          />
          <div className="progress-stats">
            <Text size="sm" color="neutral-600">
              {progress}% complete
            </Text>
            <Text size="sm" color="neutral-600">
              Estimated time: {getEstimatedTime(progress)} remaining
            </Text>
          </div>
        </div>
        
        <div className="current-stage">
          <Text weight="medium">
            Currently: {stages.find(s => s.id === currentStage)?.label}
          </Text>
        </div>
      </div>
      
      <div className="generation-stages">
        <div className="stages-list">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={cn('stage-item', {
                'stage-item--completed': getStageStatus(stage.id, currentStage) === 'completed',
                'stage-item--active': getStageStatus(stage.id, currentStage) === 'active',
                'stage-item--pending': getStageStatus(stage.id, currentStage) === 'pending'
              })}
            >
              <div className="stage-icon">
                {getStageStatus(stage.id, currentStage) === 'completed' ? '✅' : 
                 getStageStatus(stage.id, currentStage) === 'active' ? '⏳' : '⏸️'}
              </div>
              <Text size="sm" color="neutral-700">
                {stage.label}
              </Text>
            </div>
          ))}
        </div>
      </div>
      
      {generatedContent && (
        <div className="preview-section">
          <div className="preview-header">
            <Heading size="md">Preview of Generated Content</Heading>
            <Badge text="Live Preview" appearance="discovery" />
          </div>
          <div className="content-preview">
            <div className="streaming-text">
              {generatedContent}
              <span className="cursor">|</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="progress-actions">
        <Button
          appearance="warning"
          iconBefore={<StopIcon />}
          onClick={onStop}
        >
          Stop Generation
        </Button>
        <Button
          appearance="default"
          iconBefore={<RefreshIcon />}
          onClick={onRegenerateVersion}
        >
          Generate Different Version
        </Button>
      </div>
    </div>
  );
};
```

### Script Editor Interface
```typescript
const ScriptEditorInterface = ({ 
  script, 
  onScriptChange, 
  onSave, 
  onExport 
}: ScriptEditorProps) => {
  const [editorView, setEditorView] = useState<'structured' | 'plain'>('structured');
  const [wordCount, setWordCount] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  return (
    <div className="script-editor-interface">
      <div className="editor-header">
        <div className="header-content">
          <Heading size="lg">Your script is ready!</Heading>
          <Text color="neutral-600">
            Make any adjustments you'd like, then save or export your script.
          </Text>
        </div>
        
        <div className="header-actions">
          <ButtonGroup>
            <Button appearance="default" iconBefore={<SaveIcon />} onClick={onSave}>
              Save to Library
            </Button>
            <Button appearance="default" iconBefore={<ExportIcon />} onClick={onExport}>
              Export
            </Button>
            <Button appearance="primary" iconBefore={<CopyIcon />}>
              Copy Script
            </Button>
          </ButtonGroup>
        </div>
      </div>
      
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <ButtonGroup>
            <Button appearance="subtle" iconBefore={<UndoIcon />} onClick={undo}>
              Undo
            </Button>
            <Button appearance="subtle" iconBefore={<RedoIcon />} onClick={redo}>
              Redo
            </Button>
          </ButtonGroup>
          
          <div className="toolbar-divider" />
          
          <ButtonGroup>
            <Button appearance="subtle" iconBefore={<BoldIcon />} onClick={toggleBold}>
              Bold
            </Button>
            <Button appearance="subtle" iconBefore={<ItalicIcon />} onClick={toggleItalic}>
              Italic
            </Button>
            <Button appearance="subtle" iconBefore={<UnderlineIcon />} onClick={toggleUnderline}>
              Underline
            </Button>
          </ButtonGroup>
          
          <div className="toolbar-divider" />
          
          <SegmentedControl
            options={[
              { label: 'Structured', value: 'structured', icon: <LayersIcon /> },
              { label: 'Plain Text', value: 'plain', icon: <TextIcon /> }
            ]}
            value={editorView}
            onChange={setEditorView}
          />
        </div>
        
        <div className="toolbar-right">
          <div className="script-stats">
            <Text size="sm" color="neutral-600">
              Word count: {wordCount}
            </Text>
            <div className="stat-divider">|</div>
            <Text size="sm" color="neutral-600">
              Duration: ~{estimatedDuration}s
            </Text>
          </div>
        </div>
      </div>
      
      <div className="editor-content">
        {editorView === 'structured' ? (
          <StructuredScriptEditor
            script={script}
            onChange={onScriptChange}
            onWordCountChange={setWordCount}
            onDurationChange={setEstimatedDuration}
          />
        ) : (
          <PlainTextEditor
            content={script.content}
            onChange={(content) => onScriptChange({ ...script, content })}
            onWordCountChange={setWordCount}
          />
        )}
      </div>
      
      <div className="editor-actions">
        <div className="action-buttons">
          <Button
            appearance="default"
            iconBefore={<RefreshIcon />}
            onClick={regenerateSection}
          >
            Regenerate Section
          </Button>
          <Button
            appearance="default"
            iconBefore={<PlusIcon />}
            onClick={addSection}
          >
            Add Section
          </Button>
          <Button
            appearance="default"
            iconBefore={<TargetIcon />}
            onClick={optimizeHook}
          >
            Optimize Hook
          </Button>
          <Button
            appearance="default"
            iconBefore={<AnalyticsIcon />}
            onClick={analyzeTone}
          >
            Analyze Tone
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

## Responsive Design

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────────────────┐
│ [≡] Script Writer  [Templates ▼] [🎤] [💾]        │
├─────────────────────────────────────────────────────┤
│ ✨ Today's Content (Collapsed by default)          │
├─────────────────────────────────────────────────────┤
│ What would you like to create?                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Describe your script idea...                    │ │
│ │                                                 │ │
│ │                    [💡 Ideas]                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─ Configuration (2x2 Grid) ───────────────────────┐ │
│ │ AI Generator     │ Creator Persona              │ │
│ │ Creative Writer ▼│ Alex - Travel ▼              │ │
│ ├─────────────────┼──────────────────────────────┤ │
│ │ Script Length   │ Writing Style                │ │
│ │ Short (30-60s) ▼│ Engaging & Fun ▼             │ │
│ └─────────────────┴──────────────────────────────┘ │
│                                                     │
│ [🪄 Generate My Script]                            │
│ [🎤 Voice] [📄 Template]                           │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)
```
┌─────────────────────────────────────┐
│ [≡] Script Writer [🎤] [💾]        │
├─────────────────────────────────────┤
│ What would you like to create?      │
│ ┌─────────────────────────────────┐ │
│ │ Describe your script idea...    │ │
│ │                                 │ │
│ │ [💡 Ideas]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ AI Generator                        │
│ [Creative Writer ▼]                 │
│                                     │
│ Creator Persona                     │
│ [Alex - Travel ▼]                   │
│                                     │
│ Length: [Short ▼] Style: [Fun ▼]    │
│                                     │
│ [🪄 Generate Script]                │
│ [🎤] [📄]                           │
└─────────────────────────────────────┘
```

This AI Script Generation Workspace creates an intuitive, conversational interface that makes AI-powered content creation feel natural and approachable while providing sophisticated customization options for power users.