import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HemingwayEditor } from '../components/ui/HemingwayEditor';
import { parseInlineLabels, type ScriptElements } from '../lib/script-analysis';

const initialContent = `The sun shone brightly over the quiet village. Children played in the streets while their parents watched from nearby porches. It was a perfect day for a walk in the countryside.

Despite the beauty of the morning, Sarah felt restless. She had been working on her novel for months, but the words seemed to elude her. Every sentence she wrote felt clunky and awkward.

She decided to try a different approach. Instead of fighting against the resistance, she would embrace it. She opened her laptop and began typing, letting the words flow naturally without judgment.

The result was surprising. The sentences became clearer. The story began to take shape. Sometimes the best writing comes not from forcing creativity, but from allowing it to happen organically.

As the afternoon wore on, Sarah found herself completely absorbed in her work. The outside world faded away, leaving only her characters and their journey. This was what she had been searching for all along - that perfect state of flow where writing becomes effortless.`;

export default function HemingwayEditorPage() {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState("The Writer's Journey");
  const [scriptElements, setScriptElements] = useState<ScriptElements | null>(null);
  const [isScriptMode, setIsScriptMode] = useState(false);

  // Initialize from URL parameters if present
  useEffect(() => {
    const paramContent = searchParams.get('content');
    const paramTitle = searchParams.get('title');
    const paramPlatform = searchParams.get('platform');
    const paramLength = searchParams.get('length');
    const paramStyle = searchParams.get('style');
    
    console.log('🔍 [HemingwayEditorPage] URL parameters:', {
      content: paramContent ? paramContent.substring(0, 100) + '...' : null,
      title: paramTitle,
      platform: paramPlatform,
      length: paramLength,
      style: paramStyle
    });
    
    if (paramContent) {
      const decodedContent = decodeURIComponent(paramContent);
      console.log('📝 [HemingwayEditorPage] Decoded content:', decodedContent);
      
      setContent(decodedContent);
      
      // Try to parse script components from the content
      console.log('🧩 [HemingwayEditorPage] Attempting to parse script components...');
      const parsedElements = parseInlineLabels(decodedContent);
      
      console.log('📋 [HemingwayEditorPage] Parsed script elements:', parsedElements);
      
      // Check if we found valid script components
      if (parsedElements.hook || parsedElements.bridge || parsedElements.goldenNugget || parsedElements.wta) {
        console.log('✅ [HemingwayEditorPage] Script components detected, enabling script mode');
        setScriptElements(parsedElements);
        setIsScriptMode(true);
      } else {
        console.log('📄 [HemingwayEditorPage] No script components detected, using regular text mode');
        setIsScriptMode(false);
      }
    }
    
    if (paramTitle) {
      const decodedTitle = decodeURIComponent(paramTitle);
      console.log('📑 [HemingwayEditorPage] Setting title:', decodedTitle);
      setTitle(decodedTitle);
    }
  }, [searchParams]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    console.log('📝 [HemingwayEditorPage] Content changed:', newContent.length, 'characters');
    
    // Re-parse script components if in script mode
    if (isScriptMode) {
      const parsedElements = parseInlineLabels(newContent);
      setScriptElements(parsedElements);
      console.log('🔄 [HemingwayEditorPage] Re-parsed script elements:', parsedElements);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    console.log('📑 [HemingwayEditorPage] Title changed:', newTitle);
  };

  const handleScriptElementsChange = (newElements: ScriptElements) => {
    console.log('🧩 [HemingwayEditorPage] Script elements updated:', newElements);
    setScriptElements(newElements);
    
    // Update content to reflect changes in script elements
    const formattedContent = formatScriptElements(newElements);
    setContent(formattedContent);
  };

  // Helper function to format script elements back to content string
  const formatScriptElements = (elements: ScriptElements): string => {
    const sections = [];
    
    if (elements.hook) {
      sections.push(`[HOOK - First 3 seconds]\n${elements.hook}`);
    }
    
    if (elements.bridge) {
      sections.push(`[BRIDGE - Transition]\n${elements.bridge}`);
    }
    
    if (elements.goldenNugget) {
      sections.push(`[GOLDEN NUGGET - Main Value]\n${elements.goldenNugget}`);
    }
    
    if (elements.wta) {
      sections.push(`[WTA - Call to Action]\n${elements.wta}`);
    }
    
    return sections.join('\n\n');
  };

  return (
    <HemingwayEditor
      initialContent={content}
      initialTitle={title}
      initialSidebarCollapsed={false}
      initialFocusMode={false}
      onContentChange={handleContentChange}
      onTitleChange={handleTitleChange}
      scriptElements={scriptElements}
      isScriptMode={isScriptMode}
      onScriptElementsChange={handleScriptElementsChange}
    />
  );
}