import React, { useState, useRef, useCallback, useMemo } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
import { Sparkles } from 'lucide-react';
import { AISuggestionPopup } from './ai-suggestion-popup';

interface ScriptSection {
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
  script: string;
  onScriptUpdate: (updatedScript: string) => void;
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
  background: ${token('color.background.neutral')};
  border-radius: ${token('border.radius.200')};
  position: relative;
`;

const SectionContainer = styled.div<{ sectionType: ScriptSection['type']; isHovered: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: ${token('border.radius')};
  padding: ${token('space.300')};
  margin-bottom: ${token('space.200')};
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;

  ${(props) => {
    const baseStyles = css`
      &:hover {
        background: ${token('color.background.neutral.hovered')};
        border-color: ${getSectionBorderColor(props.sectionType)};
        box-shadow: ${token('elevation.shadow.raised')};
      }
    `;

    if (props.isHovered) {
      return css`
        ${baseStyles}
        background: ${getSectionBackgroundColor(props.sectionType)};
        border-color: ${getSectionBorderColor(props.sectionType)};
        box-shadow: ${token('elevation.shadow.raised')};
      `;
    }

    return baseStyles;
  }}
`;

const SectionHeader = styled.div<{ sectionType: ScriptSection['type'] }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${token('space.200')};

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${(props) => getSectionTextColor(props.sectionType)};
    display: flex;
    align-items: center;
    gap: ${token('space.100')};
  }
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
function getSectionIcon(type: ScriptSection['type']): string {
  switch (type) {
    case 'hook':
    case 'micro-hook':
      return '🪝';
    case 'bridge':
      return '🌉';
    case 'nugget':
      return '💎';
    case 'cta':
      return '🎯';
    default:
      return '📝';
  }
}

function getSectionBorderColor(type: ScriptSection['type']): string {
  switch (type) {
    case 'hook':
    case 'micro-hook':
      return token('color.border.accent.yellow');
    case 'bridge':
      return token('color.border.accent.blue');
    case 'nugget':
      return token('color.border.accent.green');
    case 'cta':
      return token('color.border.accent.red');
    default:
      return token('color.border');
  }
}

function getSectionBackgroundColor(type: ScriptSection['type']): string {
  switch (type) {
    case 'hook':
    case 'micro-hook':
      return token('color.background.accent.yellow.subtler');
    case 'bridge':
      return token('color.background.accent.blue.subtler');
    case 'nugget':
      return token('color.background.accent.green.subtler');
    case 'cta':
      return token('color.background.accent.red.subtler');
    default:
      return token('color.background.neutral.subtle');
  }
}

function getSectionTextColor(type: ScriptSection['type']): string {
  switch (type) {
    case 'hook':
    case 'micro-hook':
      return token('color.text.accent.yellow');
    case 'bridge':
      return token('color.text.accent.blue');
    case 'nugget':
      return token('color.text.accent.green');
    case 'cta':
      return token('color.text.accent.red');
    default:
      return token('color.text');
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
  if (lowerTitle.includes('cta') || lowerTitle.includes('call to action') || lowerTitle.includes('action')) {
    return 'cta';
  }

  return 'hook'; // Default fallback
}

export const InteractiveScript: React.FC<InteractiveScriptProps> = ({
  script,
  onScriptUpdate,
  className,
  scriptAnalysis
}) => {
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ScriptSection | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse script sections from markdown format
  const parseScriptSections = useCallback((script: string): ScriptSection[] => {
    const sections: ScriptSection[] = [];
    const lines = script.split('\n');
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
    return sections.map(section => {
      // Use the original header format found in the script
      const headerFormats = [
        `[${section.title.toUpperCase()}]`,
        `## ${section.title}`,
        `**${section.title}:**`
      ];

      // Try to preserve original format by checking what's in the original script
      let headerFormat = headerFormats[0]; // Default to square brackets
      if (script.includes(`## ${section.title}`)) {
        headerFormat = headerFormats[1];
      } else if (script.includes(`**${section.title}:**`)) {
        headerFormat = headerFormats[2];
      }

      return `${headerFormat}\n${section.content}`;
    }).join('\n\n');
  }, [script]);

  // Memoized sections to avoid re-parsing on every render
  const sections = useMemo(() => parseScriptSections(script), [script, parseScriptSections]);

  // Handle section clicks to open popup
  const handleSectionClick = useCallback((section: ScriptSection, index: number, event: React.MouseEvent) => {
    event.preventDefault();

    // Calculate popup position relative to clicked section
    const rect = sectionRefs.current[index]?.getBoundingClientRect();
    if (rect) {
      const isMobile = window.innerWidth < 768;
      let x = rect.right + 10;
      let y = rect.top;

      // Adjust for mobile or when popup would go off-screen
      if (isMobile || x + 320 > window.innerWidth) {
        x = Math.max(10, window.innerWidth - 330);
      }

      if (y + 400 > window.innerHeight) {
        y = Math.max(10, window.innerHeight - 410);
      }

      setPopupPosition({ x, y });
    }

    setSelectedSection(section);
    setShowPopup(true);
  }, []);

  // Apply AI suggestions back to script
  const handleApplySuggestion = useCallback((newText: string) => {
    if (!selectedSection) return;

    const updatedSections = sections.map(section =>
      section === selectedSection
        ? { ...section, content: newText }
        : section
    );

    const updatedScript = buildScriptFromSections(updatedSections);
    onScriptUpdate(updatedScript);
    setShowPopup(false);
    setSelectedSection(null);
  }, [selectedSection, sections, buildScriptFromSections, onScriptUpdate]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setSelectedSection(null);
  }, []);

  if (sections.length === 0) {
    return (
      <ScriptContainer className={className}>
        <div style={{
          textAlign: 'center',
          color: token('color.text.subtle'),
          padding: token('space.400')
        }}>
          No script sections detected. Add headers like [HOOK], [BRIDGE], etc. to create interactive sections.
        </div>
      </ScriptContainer>
    );
  }

  return (
    <ScriptContainer className={className}>
      {sections.map((section, index) => {
        const isHovered = hoveredSection === index;

        return (
          <SectionContainer
            key={index}
            ref={el => sectionRefs.current[index] = el}
            sectionType={section.type}
            isHovered={isHovered}
            onClick={(e) => handleSectionClick(section, index, e)}
            onMouseEnter={() => setHoveredSection(index)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <SectionHeader sectionType={section.type}>
              <h3>
                <span>{getSectionIcon(section.type)}</span>
                {section.title}
              </h3>
            </SectionHeader>

            <SectionContent>
              {section.content}
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