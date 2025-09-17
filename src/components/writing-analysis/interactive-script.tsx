import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
import { Sparkles } from 'lucide-react';
import { AISuggestionPopup } from './ai-suggestion-popup';
import { Button } from '../ui/Button';
import type { ScriptElements } from '@/lib/script-analysis';

type ScriptElementKey = keyof ScriptElements;

interface ScriptSection {
  key?: ScriptElementKey;
  type: "hook" | "micro-hook" | "bridge" | "nugget" | "cta";
  title: string;
  content: string;
}

interface ScriptComponent {
  type: string;
  startIndex: number;
  endIndex: number;
  text: string;
  confidence: number;
}

interface InteractiveScriptProps {
  script?: string;
  onScriptUpdate?: (updatedScript: string) => void;
  scriptElements?: ScriptElements | null;
  onScriptElementsChange?: (updated: ScriptElements) => void;
  className?: string;
  scriptAnalysis?: {
    hasComponentAnalysis: boolean;
    componentAnalysis?: {
      components: ScriptComponent[];
    };
  };
}

// Styled Components
const ScriptContainer = styled.div`
  padding: ${token('space.400')};
  /* Use white content background */
  background: var(--color-surface, ${token('color.background.neutral', '#ffffff')});
  border-radius: ${token('border.radius.200')};
  position: relative;
`;

const HighlightToggle = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${token('space.200')};
`;

type ComplexityLevel = 'ok' | 'warning' | 'high' | 'critical';

const SectionContainer = styled.div<{
  sectionType: ScriptSection['type'];
  isHovered: boolean;
  complexity: ComplexityLevel;
  highlightEnabled: boolean;
}>`
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  padding: ${token('space.300')};
  margin-bottom: 0;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid
    ${(props) =>
      props.highlightEnabled
        ? getHighlightStyles(props.sectionType).border
        : 'transparent'};
  background:
    ${(props) =>
      props.highlightEnabled
        ? getHighlightStyles(props.sectionType).background
        : 'transparent'};

  ${(props) => {
    const highlight = getHighlightStyles(props.sectionType);
    const hoverBackground = props.highlightEnabled
      ? highlight.hoverBackground
      : getHoverBackgroundByComplexity(props.complexity);
    const hoverBorder = props.highlightEnabled
      ? highlight.border
      : getHoverBorderByComplexity(props.complexity);

    const baseStyles = css`
      &:hover {
        background: ${hoverBackground};
        border-color: ${hoverBorder};
        box-shadow: ${token('elevation.shadow.raised')};
      }
    `;

    if (props.isHovered) {
      return css`
        ${baseStyles}
        background: ${hoverBackground};
        border-color: ${hoverBorder};
        box-shadow: ${token('elevation.shadow.raised')};
      `;
    }

    return baseStyles;
  }}
`;

const SectionContent = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${token('color.text')};
  white-space: pre-wrap;
`;

const AIIndicator = styled.div<{ visible: boolean }>`
  position: absolute;
  top: ${token('space.200')};
  right: ${token('space.200')};
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 200ms ease;
  color: ${token('color.text.accent.blue')};
  background: ${token('color.background.accent.blue.subtler')};
  border-radius: ${token('border.radius')};
  padding: ${token('space.050')};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HoverTooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${token('color.background.neutral.bold')};
  color: ${token('color.text.inverse')};
  font-size: 0.75rem;
  padding: ${token('space.050')} ${token('space.100')};
  border-radius: ${token('border.radius')};
  white-space: nowrap;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'scale(1)' : 'scale(0.8)'};
  transition: all 150ms ease;
  pointer-events: none;
  z-index: 10;
`;

// Helper functions for section styling
function getHighlightStyles(type: ScriptSection['type']) {
  switch (type) {
    case 'hook':
    case 'micro-hook':
      return {
        background: 'rgba(255, 214, 102, 0.18)',
        hoverBackground: 'rgba(255, 214, 102, 0.32)',
        border: 'rgba(255, 214, 102, 0.45)',
      };
    case 'bridge':
      return {
        background: 'rgba(102, 178, 255, 0.18)',
        hoverBackground: 'rgba(102, 178, 255, 0.32)',
        border: 'rgba(102, 178, 255, 0.5)',
      };
    case 'nugget':
      return {
        background: 'rgba(102, 221, 170, 0.18)',
        hoverBackground: 'rgba(102, 221, 170, 0.32)',
        border: 'rgba(102, 221, 170, 0.45)',
      };
    case 'cta':
      return {
        background: 'rgba(255, 153, 153, 0.18)',
        hoverBackground: 'rgba(255, 153, 153, 0.32)',
        border: 'rgba(255, 153, 153, 0.5)',
      };
    default:
      return {
        background: 'rgba(116, 134, 168, 0.14)',
        hoverBackground: 'rgba(116, 134, 168, 0.26)',
        border: 'rgba(116, 134, 168, 0.35)',
      };
  }
}

function getHoverBorderByComplexity(level: ComplexityLevel): string {
  switch (level) {
    case 'ok':
      return token('color.border.accent.blue');
    case 'warning':
      return token('color.border.accent.yellow');
    case 'high':
      return token('color.border.accent.orange');
    case 'critical':
      return token('color.border.accent.red');
    default:
      return token('color.border.accent.blue');
  }
}

function getHoverBackgroundByComplexity(level: ComplexityLevel): string {
  switch (level) {
    case 'ok':
      return token('color.background.accent.blue.subtler');
    case 'warning':
      return token('color.background.accent.yellow.subtler');
    case 'high':
      return token('color.background.accent.orange.subtler');
    case 'critical':
      return token('color.background.accent.red.subtler');
    default:
      return token('color.background.accent.blue.subtler');
  }
}

function getSectionType(title: string): ScriptSection['type'] {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('hook')) {
    return lowerTitle.includes('micro') ? 'micro-hook' : 'hook';
  }
  if (lowerTitle.includes('bridge') || lowerTitle.includes('transition')) {
    return 'bridge';
  }
  if (lowerTitle.includes('nugget') || lowerTitle.includes('value') || lowerTitle.includes('insight')) {
    return 'nugget';
  }
  if (lowerTitle.includes('cta') || lowerTitle.includes('call to action') || lowerTitle.includes('why to act') || lowerTitle.includes('action')) {
    return 'cta';
  }

  return 'hook'; // Default fallback
}

const HIGHLIGHT_STORAGE_KEY = 'hemingway-script-highlight-preference';

export const InteractiveScript: React.FC<InteractiveScriptProps> = ({
  script,
  onScriptUpdate,
  scriptElements,
  onScriptElementsChange,
  className,
  scriptAnalysis
}) => {
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ScriptSection | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [highlightEnabled, setHighlightEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
    if (stored === null) {
      return true;
    }
    return stored === 'true';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        HIGHLIGHT_STORAGE_KEY,
        highlightEnabled ? 'true' : 'false'
      );
    }
  }, [highlightEnabled]);

  const toggleHighlight = useCallback(() => {
    setHighlightEnabled(prev => !prev);
  }, []);

  // Parse script sections from markdown format
  const parseScriptSections = useCallback((rawScript: string): ScriptSection[] => {
    const sections: ScriptSection[] = [];
    const lines = rawScript.split('\n');
    let currentSection: ScriptSection | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for section headers (## Header, **Header:**, or [HEADER - ...] formats)
      if (trimmedLine.startsWith('##') ||
          (trimmedLine.startsWith('**') && trimmedLine.endsWith(':**')) ||
          (trimmedLine.startsWith('[') && trimmedLine.includes(']'))) {

        // Save previous section if it has content
        if (currentSection?.content.trim()) {
          sections.push(currentSection);
        }

        // Extract title from different formats
        let title = '';
        if (trimmedLine.startsWith('##')) {
          title = trimmedLine.replace('##', '').trim();
        } else if (trimmedLine.startsWith('**')) {
          title = trimmedLine.replace(/\*\*/g, '').replace(':', '').trim();
        } else if (trimmedLine.startsWith('[')) {
          const match = trimmedLine.match(/\[([^\]]+)\]/);
          title = match ? match[1] : trimmedLine;
        }

        const type = getSectionType(title);
        currentSection = { type, title, content: '' };
      } else if (currentSection && trimmedLine) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
      }
    }

    // Add final section if it has content
    if (currentSection?.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }, []);

  // Rebuild script from sections after modifications
  const buildScriptFromSections = useCallback((sections: ScriptSection[]): string => {
    const baseScript = script ?? '';
    return sections.map(section => {
      // Use the original header format found in the script
      const headerFormats = [
        `[${section.title.toUpperCase()}]`,
        `## ${section.title}`,
        `**${section.title}:**`
      ];

      // Try to preserve original format by checking what's in the original script
      let headerFormat = headerFormats[0]; // Default to square brackets
      if (baseScript.includes(`## ${section.title}`)) {
        headerFormat = headerFormats[1];
      } else if (baseScript.includes(`**${section.title}:**`)) {
        headerFormat = headerFormats[2];
      }

      return `${headerFormat}\n${section.content}`;
    }).join('\n');
  }, [script]);

  const buildSectionsFromElements = useCallback((elements?: ScriptElements | null): ScriptSection[] => {
    if (!elements) {
      return [];
    }

    const mapping: { key: ScriptElementKey; type: ScriptSection['type']; title: string }[] = [
      { key: 'hook', type: 'hook', title: 'Hook' },
      { key: 'bridge', type: 'bridge', title: 'Bridge' },
      { key: 'goldenNugget', type: 'nugget', title: 'Golden Nugget' },
      { key: 'wta', type: 'cta', title: 'Call to Action' },
    ];

    return mapping
      .map(({ key, type, title }) => ({
        key,
        type,
        title,
        content: elements[key] ?? '',
      }))
      .filter(section => section.content.trim().length > 0);
  }, []);

  // Memoized sections to avoid re-parsing on every render
  const sections = useMemo(() => {
    if (scriptElements) {
      return buildSectionsFromElements(scriptElements);
    }
    if (script) {
      return parseScriptSections(script);
    }
    return [];
  }, [scriptElements, script, parseScriptSections, buildSectionsFromElements]);

  // Basic complexity assessment: defaults to blue; escalates to yellow/orange/red
  const assessComplexity = useCallback((text: string): ComplexityLevel => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length ? words.length / sentences.length : words.length;
    // Heuristic thresholds; tweak as needed
    if (avgWordsPerSentence >= 28 || words.length >= 180) return 'critical'; // red
    if (avgWordsPerSentence >= 22 || words.length >= 120) return 'high';     // orange
    if (avgWordsPerSentence >= 16 || words.length >= 80) return 'warning';   // yellow
    return 'ok';                                                             // blue
  }, []);

  const formatContentForDisplay = useCallback((text: string): string => {
    const normalized = text.replace(/\r/g, '').trim();
    if (!normalized) {
      return '';
    }

    if (/\n\s*\n/.test(normalized)) {
      return normalized;
    }

    const collapsed = normalized.replace(/\s+/g, ' ');
    const spaced = collapsed.replace(/([.!?])\s+/g, '$1\n\n');

    return spaced.trim();
  }, []);

  // Handle section clicks to open popup
  const handleSectionClick = useCallback((section: ScriptSection, index: number, event: React.MouseEvent) => {
    event.preventDefault();

    // Calculate popup position in viewport coordinates
    const rect = sectionRefs.current[index]?.getBoundingClientRect();
    if (rect) {
      const isMobile = window.innerWidth < 768;
      let x = rect.right + 10;
      let y = rect.top;

      // Adjust for mobile or when popup would go off-screen
      const popupWidth = 320;
      const popupHeight = 400;
      const margin = 10;
      if (isMobile || x + popupWidth > window.innerWidth - margin) {
        // Prefer left side if right side doesn't fit
        const leftCandidate = rect.left - popupWidth - margin;
        x = leftCandidate > margin ? leftCandidate : Math.max(margin, window.innerWidth - popupWidth - margin);
      }
      if (y + popupHeight > window.innerHeight - margin) {
        y = Math.max(margin, window.innerHeight - popupHeight - margin);
      }

      setPopupPosition({ x, y });
    }

    setSelectedSection(section);
    setSelectedSectionIndex(index);
    setShowPopup(true);
  }, []);

  // Apply AI suggestions back to script
  const handleApplySuggestion = useCallback((newText: string) => {
    if (selectedSectionIndex === null) {
      return;
    }

    const targetSection = sections[selectedSectionIndex];
    if (!targetSection) {
      setShowPopup(false);
      setSelectedSection(null);
      setSelectedSectionIndex(null);
      return;
    }

    if (scriptElements && onScriptElementsChange && targetSection.key) {
      const updatedElements: ScriptElements = {
        ...scriptElements,
        [targetSection.key]: newText,
      };
      onScriptElementsChange(updatedElements);
    } else if (script && onScriptUpdate) {
      const updatedSections = sections.map((section, index) =>
        index === selectedSectionIndex
          ? { ...section, content: newText }
          : section
      );

      const updatedScript = buildScriptFromSections(updatedSections);
      onScriptUpdate(updatedScript);
    }

    setShowPopup(false);
    setSelectedSection(null);
    setSelectedSectionIndex(null);
  }, [selectedSectionIndex, sections, scriptElements, onScriptElementsChange, script, onScriptUpdate, buildScriptFromSections]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setSelectedSection(null);
    setSelectedSectionIndex(null);
  }, []);

  if (sections.length === 0) {
    return (
      <ScriptContainer className={className}>
        <div style={{
          textAlign: 'center',
          color: token('color.text.subtle'),
          padding: token('space.400')
        }}>
          No script sections detected. Provide hook, bridge, golden nugget, and call-to-action content to enable script highlights.
        </div>
      </ScriptContainer>
    );
  }

  return (
    <ScriptContainer className={className}>
      <HighlightToggle>
        <Button
          variant="subtle"
          size="small"
          onClick={toggleHighlight}
          aria-pressed={highlightEnabled}
          aria-label={highlightEnabled ? 'Hide script highlights' : 'Show script highlights'}
        >
          {highlightEnabled ? 'Hide highlights' : 'Show highlights'}
        </Button>
      </HighlightToggle>

      {sections.map((section, index) => {
        const isHovered = hoveredSection === index;
        const displayContent = formatContentForDisplay(section.content);

        return (
          <SectionContainer
            key={index}
            ref={el => sectionRefs.current[index] = el}
            sectionType={section.type}
            isHovered={isHovered}
            complexity={assessComplexity(section.content)}
            highlightEnabled={highlightEnabled}
            onClick={(e) => handleSectionClick(section, index, e)}
            onMouseEnter={() => setHoveredSection(index)}
            onMouseLeave={() => setHoveredSection(null)}
            aria-label={section.title}
          >
            <SectionContent>
              {displayContent}
            </SectionContent>

            {/* AI Action Indicator */}
            <AIIndicator visible={isHovered}>
              <Sparkles size={12} />
            </AIIndicator>

            {/* Hover Tooltip */}
            <HoverTooltip visible={isHovered}>
              Click for AI actions
            </HoverTooltip>
          </SectionContainer>
        );
      })}

      {/* AI Suggestion Popup */}
      {showPopup && selectedSection && (
        <AISuggestionPopup
          isOpen={showPopup}
          onClose={handleClosePopup}
          sectionType={selectedSection.type as any}
          originalText={selectedSection.content}
          onApply={handleApplySuggestion}
          position={popupPosition}
        />
      )}
    </ScriptContainer>
  );
};
