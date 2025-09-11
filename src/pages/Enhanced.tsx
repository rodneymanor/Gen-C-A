import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EnhancedLibrary, EnhancedScriptGenerator, EnhancedVideoGrid } from '../components/enhanced';
import type { ContentItem, AIGenerationRequest } from '../types';

const enhancedPageStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);
  
  h1 {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0 0 var(--space-3) 0;
  }
  
  .subtitle {
    font-size: var(--font-size-body-large);
    color: var(--color-neutral-600);
    margin: 0 0 var(--space-4) 0;
  }
  
  .enhancement-badges {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    
    .badge {
      padding: var(--space-1) var(--space-3);
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-200);
      border-radius: var(--radius-full);
      font-size: var(--font-size-body-small);
      color: var(--color-primary-700);
      font-weight: var(--font-weight-medium);
    }
  }
`;

const sectionStyles = css`
  margin-bottom: var(--space-12);
  
  .section-header {
    margin-bottom: var(--space-6);
    
    h2 {
      font-size: var(--font-size-h3);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .section-description {
      font-size: var(--font-size-body);
      color: var(--color-neutral-600);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }
  }
`;

const toggleStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  
  .toggle-label {
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-neutral-700);
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    
    input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--color-neutral-300);
      transition: var(--transition-all);
      border-radius: var(--radius-full);
      
      &:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: var(--transition-all);
        border-radius: var(--radius-full);
      }
    }
    
    input:checked + .slider {
      background-color: var(--color-primary-500);
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
  }
`;

// Mock video data for enhanced grid demo
const mockVideos: ContentItem[] = [
  {
    id: '1',
    title: 'Summer Skincare Routine',
    description: 'A comprehensive guide to summer skincare',
    type: 'video',
    platform: 'tiktok',
    duration: 30,
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'published',
    tags: ['skincare', 'summer'],
    metadata: {}
  },
  {
    id: '2',
    title: 'Quick Makeup Tutorial',
    description: '5-minute makeup routine for busy mornings',
    type: 'video',
    platform: 'instagram',
    duration: 45,
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'published',
    tags: ['makeup', 'tutorial'],
    metadata: {}
  },
  {
    id: '3',
    title: 'Workout Motivation',
    description: 'Get pumped for your next workout',
    type: 'video',
    platform: 'youtube',
    duration: 120,
    creator: 'Sarah Chen',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'draft',
    tags: ['fitness', 'motivation'],
    metadata: {}
  }
];

type ComponentType = 'library' | 'scriptGenerator' | 'videoGrid';

export const Enhanced: React.FC = () => {
  const [useEnhanced, setUseEnhanced] = useState<Record<ComponentType, boolean>>({
    library: true,
    scriptGenerator: true,
    videoGrid: true
  });
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  const handleToggle = (component: ComponentType) => {
    setUseEnhanced(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  const handleScriptGenerate = (request: AIGenerationRequest) => {
    console.log('Generate script request:', request);
    // In a real app, this would call the AI service
  };

  const handleVoiceInput = () => {
    console.log('Voice input requested');
    // In a real app, this would activate voice recording
  };

  const handleVideoSelect = (video: ContentItem) => {
    console.log('Selected video:', video);
  };

  const handleVideoPlay = (video: ContentItem) => {
    console.log('Play video:', video);
  };

  return (
    <div css={enhancedPageStyles}>
      <div css={headerStyles}>
        <h1>Enhanced Components Preview</h1>
        <p className="subtitle">
          Experience the power of Atlassian Design System integration with your existing Claude-inspired components
        </p>
        <div className="enhancement-badges">
          <span className="badge">🚀 @atlaskit/dynamic-table</span>
          <span className="badge">📝 @atlaskit/form</span>
          <span className="badge">🎨 Preserved Design Tokens</span>
          <span className="badge">⚡ Enhanced UX</span>
        </div>
      </div>

      {/* Enhanced Library Section */}
      <section css={sectionStyles}>
        <div className="section-header">
          <h2>
            📚 Enhanced Library Component
          </h2>
          <p className="section-description">
            Powerful data table with sorting, filtering, and pagination. Replaces the original content list 
            with a professional data management interface while preserving your design tokens.
          </p>
        </div>
        
        <div css={toggleStyles}>
          <span className="toggle-label">Use Enhanced Version</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={useEnhanced.library}
              onChange={() => handleToggle('library')}
            />
            <span className="slider"></span>
          </label>
        </div>

        {useEnhanced.library ? (
          <EnhancedLibrary />
        ) : (
          <Card appearance="subtle" spacing="comfortable">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p>Original Library component would be shown here</p>
              <Button variant="primary" onClick={() => handleToggle('library')}>
                Try Enhanced Version
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Enhanced Script Generator Section */}
      <section css={sectionStyles}>
        <div className="section-header">
          <h2>
            ✍️ Enhanced Script Generator
          </h2>
          <p className="section-description">
            Advanced form patterns with validation, dependent fields, and better UX. 
            Uses Atlassian form components with your existing design system integration.
          </p>
        </div>
        
        <div css={toggleStyles}>
          <span className="toggle-label">Use Enhanced Version</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={useEnhanced.scriptGenerator}
              onChange={() => handleToggle('scriptGenerator')}
            />
            <span className="slider"></span>
          </label>
        </div>

        {useEnhanced.scriptGenerator ? (
          <EnhancedScriptGenerator
            onGenerate={handleScriptGenerate}
            onVoiceInput={handleVoiceInput}
            isLoading={false}
            personas={[]}
          />
        ) : (
          <Card appearance="subtle" spacing="comfortable">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p>Original Script Generator component would be shown here</p>
              <Button variant="primary" onClick={() => handleToggle('scriptGenerator')}>
                Try Enhanced Version
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Enhanced Video Grid Section */}
      <section css={sectionStyles}>
        <div className="section-header">
          <h2>
            🎥 Enhanced Video Grid
          </h2>
          <p className="section-description">
            Dual-view component with both grid and table modes. Table view provides sortable columns, 
            bulk selection, and detailed metadata display for power users.
          </p>
        </div>
        
        <div css={toggleStyles}>
          <span className="toggle-label">Use Enhanced Version</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={useEnhanced.videoGrid}
              onChange={() => handleToggle('videoGrid')}
            />
            <span className="slider"></span>
          </label>
        </div>

        {useEnhanced.videoGrid ? (
          <EnhancedVideoGrid
            videos={mockVideos}
            onVideoSelect={handleVideoSelect}
            onVideoPlay={handleVideoPlay}
            selectedVideos={selectedVideos}
            showBulkActions={true}
          />
        ) : (
          <Card appearance="subtle" spacing="comfortable">
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p>Original Video Grid component would be shown here</p>
              <Button variant="primary" onClick={() => handleToggle('videoGrid')}>
                Try Enhanced Version
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Integration Summary */}
      <section css={sectionStyles}>
        <Card appearance="elevated" spacing="comfortable">
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-h4)',
              color: 'var(--color-neutral-800)',
              marginBottom: 'var(--space-4)'
            }}>
              🎯 Integration Complete
            </h3>
            <p style={{ 
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-neutral-600)',
              marginBottom: 'var(--space-6)',
              lineHeight: 'var(--line-height-relaxed)'
            }}>
              Your existing components have been strategically enhanced with Atlassian Design System patterns 
              while preserving all your Claude-inspired design tokens and excellent accessibility features.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--color-success-50)',
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-success-200)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-2)' }}>✅</div>
                <div style={{ 
                  fontSize: 'var(--font-size-body-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-success-700)'
                }}>
                  Design Tokens Preserved
                </div>
              </div>
              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--color-info-50)',
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-info-200)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-2)' }}>🚀</div>
                <div style={{ 
                  fontSize: 'var(--font-size-body-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-info-700)'
                }}>
                  Enhanced Functionality
                </div>
              </div>
              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--color-warning-50)',
                borderRadius: 'var(--radius-medium)',
                border: '1px solid var(--color-warning-200)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-2)' }}>⚡</div>
                <div style={{ 
                  fontSize: 'var(--font-size-body-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-warning-700)'
                }}>
                  Professional UX
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};