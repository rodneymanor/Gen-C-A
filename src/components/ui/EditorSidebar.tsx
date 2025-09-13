import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { token } from '@atlaskit/tokens';
// Atlassian Design System Icons
import ChartIcon from '@atlaskit/icon/glyph/graph-line';
import DocumentIcon from '@atlaskit/icon/glyph/document';
import ChevronRightIcon from '@atlaskit/icon/glyph/chevron-right';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import TrendingIcon from '@atlaskit/icon/glyph/arrow-up';
import ClockIcon from '@atlaskit/icon/glyph/recent';
import TypeIcon from '@atlaskit/icon/glyph/edit';
import HashIcon from '@atlaskit/icon/glyph/emoji/symbols';
import FileIcon from '@atlaskit/icon/glyph/document';
import PeopleIcon from '@atlaskit/icon/glyph/people';
import { Button } from './Button';

export interface ReadabilityMetrics {
  score: number;
  grade: string;
  issues: {
    hardToRead: number;
    veryHardToRead: number;
    adverbs: number;
    passiveVoice: number;
    complexPhrases: number;
  };
}

export interface WritingStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTime: number; // minutes
}

export interface EditorSidebarProps {
  /** Whether the sidebar is collapsed */
  collapsed: boolean;
  /** Callback to toggle sidebar visibility */
  onToggleCollapse: () => void;
  /** Current active tab */
  activeTab: 'readability' | 'writing';
  /** Callback when tab changes */
  onTabChange: (tab: 'readability' | 'writing') => void;
  /** Readability analysis metrics */
  readabilityMetrics: ReadabilityMetrics;
  /** Writing statistics */
  writingStats: WritingStats;
  /** Custom class name */
  className?: string;
}

const SidebarContainer = styled.div<{ collapsed: boolean }>`
  position: fixed;
  right: 0;
  top: 0;
  width: ${props => props.collapsed ? '0' : '320px'};
  height: 100vh;
  background: ${token('color.background.neutral.subtle')};
  border-left: 1px solid ${token('color.border')};
  transform: translateX(${props => props.collapsed ? '100%' : '0'});
  transition: all ${token('motion.duration.medium')} ${token('motion.easing.standard')};
  z-index: 20;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    width: ${props => props.collapsed ? '0' : '100vw'};
    border-left: none;
    box-shadow: ${props => props.collapsed ? 'none' : token('elevation.shadow.overlay')};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token('space.200')} ${token('space.300')};
  border-bottom: 1px solid ${token('color.border')};
  background: ${token('color.background.neutral')};
  
  h3 {
    margin: 0;
    fontSize: ${token('font.size.200')};
    fontWeight: ${token('font.weight.semibold')};
    color: ${token('color.text')};
  }
`;

const SidebarTabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${token('color.border')};
  background: ${token('color.background.neutral')};
`;

const SidebarTab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${token('space.200')} ${token('space.300')};
  background: ${props => props.active ? token('color.background.neutral.subtle') : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? token('color.border.brand') : 'transparent'};
  color: ${props => props.active ? token('color.text') : token('color.text.subtle')};
  font-weight: ${token('font.weight.medium')};
  cursor: pointer;
  transition: all ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${token('space.100')};
  font-size: ${token('font.size.075')};
  
  &:hover:not(:disabled) {
    background: ${token('color.background.neutral.subtle.hovered')};
    color: ${token('color.text')};
  }
  
  &:focus {
    outline: 2px solid ${token('color.border.focused')};
    outline-offset: -2px;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  padding: ${token('space.300')};
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${token('color.background.neutral.subtle')};
    border-radius: ${token('border.radius')};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${token('color.background.neutral.bold')};
    border-radius: ${token('border.radius')};
    
    &:hover {
      background: ${token('color.background.neutral.bolder')};
    }
  }
`;

const ReadabilityScore = styled.div<{ score: number }>`
  text-align: center;
  margin-bottom: ${token('space.400')};
  padding: ${token('space.300')};
  background: ${token('color.background.neutral')};
  border-radius: ${token('border.radius.200')};
  border: 1px solid ${token('color.border')};
  
  .score-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin: 0 auto ${token('space.200')};
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => {
      if (props.score >= 80) return token('color.background.success.bold');
      if (props.score >= 60) return token('color.background.warning.bold');
      return token('color.background.danger.bold');
    }};
    color: white;
    font-size: ${token('font.size.500')};
    font-weight: ${token('font.weight.bold')};
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        currentColor ${props => props.score * 3.6}deg,
        ${token('color.background.neutral.subtle')} ${props => props.score * 3.6}deg
      );
      mask: radial-gradient(circle at center, transparent 65%, currentColor 66%);
    }
  }
  
  .grade {
    font-size: ${token('font.size.100')};
    color: ${token('color.text.subtle')};
    font-weight: ${token('font.weight.medium')};
  }
`;

const IssuesList = styled.div`
  .issue-category {
    margin-bottom: ${token('space.300')};
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .issue-header {
    font-size: ${token('font.size.100')};
    font-weight: ${token('font.weight.semibold')};
    color: ${token('color.text')};
    margin-bottom: ${token('space.200')};
    display: flex;
    align-items: center;
    gap: ${token('space.100')};
  }
  
  .issue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${token('space.150')} ${token('space.200')};
    background: ${token('color.background.neutral')};
    border-radius: ${token('border.radius')};
    margin-bottom: ${token('space.100')};
    border-left: 3px solid transparent;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.has-issues {
      border-left-color: ${token('color.border.warning')};
    }
    
    .issue-label {
      font-size: ${token('font.size.075')};
      color: ${token('color.text')};
      display: flex;
      align-items: center;
      gap: ${token('space.100')};
    }
    
    .issue-count {
      font-weight: ${token('font.weight.semibold')};
      color: ${props => props.count > 0 ? token('color.text.warning') : token('color.text.success')};
      background: ${props => props.count > 0 ? token('color.background.warning.subtle') : token('color.background.success.subtle')};
      padding: ${token('space.050')} ${token('space.100')};
      border-radius: ${token('border.radius')};
      font-size: ${token('font.size.050')};
      min-width: 24px;
      text-align: center;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${token('space.300')};
  margin-bottom: ${token('space.400')};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${token('space.300')};
  background: ${token('color.background.neutral')};
  border-radius: ${token('border.radius.200')};
  border: 1px solid ${token('color.border')};
  
  .stat-icon {
    color: ${token('color.icon.brand')};
    margin-bottom: ${token('space.100')};
  }
  
  .stat-value {
    font-size: ${token('font.size.300')};
    font-weight: ${token('font.weight.bold')};
    color: ${token('color.text')};
    display: block;
    margin-bottom: ${token('space.050')};
  }
  
  .stat-label {
    font-size: ${token('font.size.075')};
    color: ${token('color.text.subtle')};
    font-weight: ${token('font.weight.medium')};
  }
`;

const ReadingTimeCard = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${token('space.300')};
  background: ${token('color.background.brand.subtlest')};
  border-radius: ${token('border.radius.200')};
  border: 1px solid ${token('color.border.brand')};
  
  .reading-time-value {
    font-size: ${token('font.size.400')};
    font-weight: ${token('font.weight.bold')};
    color: ${token('color.text.brand')};
    display: block;
    margin-bottom: ${token('space.050')};
  }
  
  .reading-time-label {
    font-size: ${token('font.size.100')};
    color: ${token('color.text.subtle')};
    font-weight: ${token('font.weight.medium')};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${token('space.100')};
  }
`;

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onTabChange,
  readabilityMetrics,
  writingStats,
  className,
}) => {
  const hasReadabilityIssues = Object.values(readabilityMetrics.issues).some(count => count > 0);

  return (
    <SidebarContainer collapsed={collapsed} className={className}>
      <SidebarHeader>
        <h3>Analysis</h3>
        <Button
          variant="subtle"
          size="small"
          onClick={onToggleCollapse}
          aria-label="Close sidebar"
        >
          <ChevronRightIcon label="" size="small" />
        </Button>
      </SidebarHeader>
      
      <SidebarTabs role="tablist">
        <SidebarTab
          role="tab"
          active={activeTab === 'readability'}
          onClick={() => onTabChange('readability')}
          aria-selected={activeTab === 'readability'}
          aria-controls="readability-panel"
          id="readability-tab"
        >
          <ChartIcon label="" size="small" />
          Readability
        </SidebarTab>
        <SidebarTab
          role="tab"
          active={activeTab === 'writing'}
          onClick={() => onTabChange('writing')}
          aria-selected={activeTab === 'writing'}
          aria-controls="writing-panel"
          id="writing-tab"
        >
          <DocumentIcon label="" size="small" />
          Writing
        </SidebarTab>
      </SidebarTabs>
      
      <SidebarContent>
        {activeTab === 'readability' && (
          <div
            role="tabpanel"
            id="readability-panel"
            aria-labelledby="readability-tab"
          >
            <ReadabilityScore score={readabilityMetrics.score}>
              <div className="score-circle">
                {readabilityMetrics.score}
              </div>
              <div className="grade">{readabilityMetrics.grade}</div>
            </ReadabilityScore>
            
            <IssuesList>
              <div className="issue-category">
                <div className="issue-header">
                  <WarningIcon label="" size="small" />
                  Writing Issues
                </div>
                
                <div className={`issue-item ${readabilityMetrics.issues.hardToRead > 0 ? 'has-issues' : ''}`}>
                  <span className="issue-label">
                    <TrendingIcon label="" size="small" />
                    Hard to read sentences
                  </span>
                  <span className="issue-count" count={readabilityMetrics.issues.hardToRead}>
                    {readabilityMetrics.issues.hardToRead}
                  </span>
                </div>
                
                <div className={`issue-item ${readabilityMetrics.issues.veryHardToRead > 0 ? 'has-issues' : ''}`}>
                  <span className="issue-label">
                    <WarningIcon label="" size="small" />
                    Very hard to read sentences
                  </span>
                  <span className="issue-count" count={readabilityMetrics.issues.veryHardToRead}>
                    {readabilityMetrics.issues.veryHardToRead}
                  </span>
                </div>
                
                <div className={`issue-item ${readabilityMetrics.issues.adverbs > 0 ? 'has-issues' : ''}`}>
                  <span className="issue-label">
                    <TypeIcon label="" size="small" />
                    Adverbs
                  </span>
                  <span className="issue-count" count={readabilityMetrics.issues.adverbs}>
                    {readabilityMetrics.issues.adverbs}
                  </span>
                </div>
                
                <div className={`issue-item ${readabilityMetrics.issues.passiveVoice > 0 ? 'has-issues' : ''}`}>
                  <span className="issue-label">
                    <PeopleIcon label="" size="small" />
                    Passive voice
                  </span>
                  <span className="issue-count" count={readabilityMetrics.issues.passiveVoice}>
                    {readabilityMetrics.issues.passiveVoice}
                  </span>
                </div>
                
                <div className={`issue-item ${readabilityMetrics.issues.complexPhrases > 0 ? 'has-issues' : ''}`}>
                  <span className="issue-label">
                    <HashIcon label="" size="small" />
                    Complex phrases
                  </span>
                  <span className="issue-count" count={readabilityMetrics.issues.complexPhrases}>
                    {readabilityMetrics.issues.complexPhrases}
                  </span>
                </div>
              </div>
            </IssuesList>
          </div>
        )}
        
        {activeTab === 'writing' && (
          <div
            role="tabpanel"
            id="writing-panel"
            aria-labelledby="writing-tab"
          >
            <StatsGrid>
              <StatCard>
                <FileIcon label="" size="medium" />
                <span className="stat-value">{writingStats.words.toLocaleString()}</span>
                <span className="stat-label">Words</span>
              </StatCard>
              
              <StatCard>
                <TypeIcon label="" size="medium" />
                <span className="stat-value">{writingStats.characters.toLocaleString()}</span>
                <span className="stat-label">Characters</span>
              </StatCard>
              
              <StatCard>
                <HashIcon label="" size="medium" />
                <span className="stat-value">{writingStats.sentences}</span>
                <span className="stat-label">Sentences</span>
              </StatCard>
              
              <StatCard>
                <DocumentIcon label="" size="medium" />
                <span className="stat-value">{writingStats.paragraphs}</span>
                <span className="stat-label">Paragraphs</span>
              </StatCard>
              
              <ReadingTimeCard>
                <span className="reading-time-value">
                  {writingStats.readingTime} {writingStats.readingTime === 1 ? 'minute' : 'minutes'}
                </span>
                <span className="reading-time-label">
                  <ClockIcon label="" size="small" />
                  Reading time
                </span>
              </ReadingTimeCard>
            </StatsGrid>
            
            {writingStats.charactersNoSpaces > 0 && (
              <StatCard style={{ marginTop: token('space.200') }}>
                <TypeIcon label="" size="medium" />
                <span className="stat-value">{writingStats.charactersNoSpaces.toLocaleString()}</span>
                <span className="stat-label">Characters (no spaces)</span>
              </StatCard>
            )}
          </div>
        )}
      </SidebarContent>
    </SidebarContainer>
  );
};