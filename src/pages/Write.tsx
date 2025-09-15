import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import { TrendingIdeas } from '../components/script/TrendingIdeas';
import { ScriptGenerator } from '../components/script/ScriptGenerator';
import { ScriptEditor } from '../components/script/ScriptEditor';
import { Button } from '../components/ui/Button';
import { useScriptGeneration } from '../hooks/use-script-generation';
import type { AIGenerationRequest, AIGenerationResponse, Script, BrandPersona } from '../types';

const writeStyles = css`
  max-width: 1200px;
  margin: 0 auto;
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);
  
  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0 0 var(--space-3) 0;
  }
  
  .header-subtitle {
    font-size: var(--font-size-body-large);
    color: var(--color-neutral-600);
    line-height: var(--line-height-relaxed);
    margin: 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const contentStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
`;


const loadingOverlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .loading-content {
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-large);
    padding: var(--space-8);
    text-align: center;
    max-width: 400px;
    margin: var(--space-4);
    
    .loading-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
      animation: pulse 2s infinite;
    }
    
    .loading-title {
      font-size: var(--font-size-h4);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-2) 0;
    }
    
    .loading-stage {
      font-size: var(--font-size-body);
      color: var(--color-neutral-600);
      margin: 0 0 var(--space-4) 0;
    }
    
    .loading-progress {
      width: 100%;
      height: 8px;
      background: var(--color-neutral-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--space-2);
      
      .progress-bar {
        height: 100%;
        background: var(--color-primary-500);
        transition: width 0.3s ease;
      }
    }
    
    .loading-eta {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-500);
      margin: 0;
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

// Brand voices loaded from API; fallback to a small default list if none

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
}

export const Write: React.FC = () => {
  const navigate = useNavigate();
  const { generateScript, isLoading, error } = useScriptGeneration();
  const [view, setView] = useState<'generate' | 'edit'>('generate');
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);
  const [personas, setPersonas] = useState<BrandPersona[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: ''
  });

  const simulateGeneration = async (request: AIGenerationRequest): Promise<Script> => {
    const stages = [
      'Analyzing your prompt...',
      'Generating content structure...',
      'Applying your brand voice...',
      'Optimizing for platform...',
      'Finalizing script...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setGenerationState(prev => ({
        ...prev,
        stage: stages[i],
        progress: ((i + 1) / stages.length) * 100,
        estimatedTimeRemaining: (stages.length - i - 1) * 2
      }));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    }

    // Return a mock generated script
    return {
      id: Date.now().toString(),
      title: `Generated Script: ${request.prompt.slice(0, 50)}...`,
      content: `[HOOK - First 3 seconds]
"${request.prompt.includes('summer') ? 'Wait, you\'re missing out on the BEST summer trend! 🌞' : 'Hold up - this changes everything! 😱'}"

[PROBLEM - Seconds 3-6]
"Most people don't realize that ${request.prompt.toLowerCase().includes('skincare') ? 'heavy products in summer can actually make your skin worse' : 'they\'re making this common mistake'}..."

[SOLUTION - Seconds 6-12]
"Here's what actually works:
${request.prompt.toLowerCase().includes('skincare') ? 
  '• Lightweight, gel-based cleanser\n• Hydrating serum (not cream!)\n• SPF that won\'t clog pores' : 
  '• Step 1: Focus on the foundation\n• Step 2: Build momentum slowly\n• Step 3: Stay consistent'}"

[CALL TO ACTION - Seconds 12-15]
"Try this method for just one week and tell me your results! Follow for more ${request.platform} tips ✨"`,
      platform: request.platform,
      length: request.length,
      style: request.style as 'engaging' | 'educational' | 'promotional' | 'storytelling',
      wordCount: 95,
      estimatedDuration: request.length === 'short' ? 15 : request.length === 'medium' ? 30 : 60,
      insights: [
        {
          id: '1',
          type: 'success',
          message: 'Strong hook captures attention immediately',
          category: 'hook'
        },
        {
          id: '2',
          type: 'success',
          message: 'Clear problem-solution structure',
          category: 'structure'
        },
        {
          id: '3',
          type: 'warning',
          message: 'Consider adding trending hashtags for better reach',
          category: 'optimization'
        }
      ],
      created: new Date(),
      updated: new Date()
    };
  };

  const handleGenerate = async (request: AIGenerationRequest) => {
    console.log("🎬 [Write] handleGenerate called with request:", request);
    
    try {
      // Convert length to the format expected by the API
      const lengthMapping = {
        'short': '15',
        'medium': '30', 
        'long': '60'
      };
      
      const mappedLength = lengthMapping[request.length] as "15" | "20" | "30" | "45" | "60" | "90";
      console.log("📏 [Write] Length mapping:", { original: request.length, mapped: mappedLength });
      
      console.log("🔄 [Write] Calling generateScript...");
      const result = await generateScript(
        request.prompt,
        mappedLength,
        request.persona
      );

      console.log("📋 [Write] Generate script result:", result);

      if (result.success && result.script) {
        console.log("✅ [Write] Script generation successful, creating content...");
        
        // Create script content for Hemingway editor from components
        const scriptContent = `[HOOK - First 3 seconds]
${result.script.hook}

[BRIDGE - Transition]
${result.script.bridge}

[GOLDEN NUGGET - Main Value]
${result.script.goldenNugget}

[WTA - Call to Action]
${result.script.wta}`;

        console.log("📝 [Write] Generated script content:", scriptContent);

        // Navigate to editor with script content and metadata
        const params = new URLSearchParams({
          content: scriptContent,
          title: `Generated Script: ${request.prompt.slice(0, 50)}...`,
          platform: request.platform,
          length: request.length,
          style: request.style
        });
        
        const editorUrl = `/editor?${params.toString()}`;
        console.log("🧭 [Write] Navigating to:", editorUrl);
        
        navigate(editorUrl);
        console.log("✅ [Write] Navigation completed");
      } else {
        console.error("❌ [Write] Script generation failed or incomplete:", result);
      }
    } catch (error) {
      console.error('❌ [Write] Generation failed with exception:', error);
      // Error is already handled by the hook
    }
  };

  // Load brand voices from API on mount
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/brand-voices/list');
        const data = await res.json().catch(() => null);
        if (isMounted && res.ok && data?.success && Array.isArray(data.voices)) {
          // Map to BrandPersona
          const mapped: BrandPersona[] = data.voices.map((v: any) => ({
            id: v.id,
            name: v.name,
            description: v.description || '',
            tone: v.tone || 'Varied',
            voice: v.voice || 'Derived from analysis',
            targetAudience: v.targetAudience || 'General',
            keywords: v.keywords || [],
            platforms: v.platforms || ['tiktok'],
            created: v.created ? new Date(v.created._seconds ? v.created._seconds * 1000 : v.created) : new Date(),
          }));
          setPersonas(mapped);
        } else {
          // Silent fallback
        }
      } catch (_) {
        // Ignore errors; keep UI functional
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleVoiceInput = () => {
    console.log('Voice input requested');
    // In a real app, this would open the voice input modal
  };

  const handleUseIdea = (idea: any) => {
    console.log('Using trending idea:', idea.title);
    // In a real app, this would populate the generation form
  };

  const handleExploreMore = () => {
    console.log('Explore more trends');
    // In a real app, this would navigate to trends page
  };

  const handleSaveScript = (script: Script) => {
    console.log('Saving script:', script.title);
    // In a real app, this would save to the library
  };

  const handleExportScript = (script: Script) => {
    console.log('Exporting script:', script.title);
    // In a real app, this would handle export functionality
  };

  const handleRegenerateScript = () => {
    setView('generate');
    setGeneratedScript(null);
  };

  const handleVoicePreview = (script: Script) => {
    console.log('Voice preview for:', script.title);
    // In a real app, this would handle text-to-speech
  };

  const handleBackToGenerate = () => {
    setView('generate');
  };

  return (
    <div css={writeStyles}>
      {/* Loading Overlay */}
      {isLoading && (
        <div css={loadingOverlayStyles}>
          <div className="loading-content">
            <div className="loading-icon" aria-hidden="true">✨</div>
            <h2 className="loading-title">Generating Your Script</h2>
            <p className="loading-stage">AI is crafting your perfect script...</p>
            
            <div className="loading-progress">
              <div 
                className="progress-bar"
                style={{ width: '100%', animation: 'pulse 2s infinite' }}
              />
            </div>
            
            <p className="loading-eta">
              This usually takes a few seconds
            </p>
          </div>
        </div>
      )}

      {view === 'generate' ? (
        <>

          <div css={contentStyles}>
            <ScriptGenerator
              onGenerate={handleGenerate}
              onVoiceInput={handleVoiceInput}
              isLoading={isLoading}
              personas={personas}
            />
            
            <TrendingIdeas
              onUseIdea={handleUseIdea}
              onExploreMore={handleExploreMore}
            />
          </div>
        </>
      ) : (
        <div css={contentStyles}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-4)', 
            marginBottom: 'var(--space-6)' 
          }}>
            <Button
              variant="tertiary"
              size="medium"
              onClick={handleBackToGenerate}
            >
              ← Back to Generator
            </Button>
          </div>
          
          {generatedScript && (
            <ScriptEditor
              script={generatedScript}
              onSave={handleSaveScript}
              onExport={handleExportScript}
              onRegenerate={handleRegenerateScript}
              onVoicePreview={handleVoicePreview}
            />
          )}
        </div>
      )}
    </div>
  );
};
