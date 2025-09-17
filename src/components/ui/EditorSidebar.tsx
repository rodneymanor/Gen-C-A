import React, { useMemo, useState } from 'react';
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
import { AnimatedCircularProgress } from './AnimatedCircularProgress';

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
  display: ${props => props.collapsed ? 'none' : 'flex'};
  flex-direction: column;
  /* Force pure white background to avoid gray fallbacks */
  background: #ffffff;
  border-left: 1px solid var(--sidebar-border, var(--color-border-subtle, ${token('color.border', '#e4e6ea')}));
  overflow: hidden;
  min-width: 0; /* Prevents grid overflow */
  height: 100%;
  /* Ensure content isn't covered by the floating toolbar */
  padding-bottom: var(--editor-toolbar-clearance, 56px);

  /* Mobile responsiveness - for grid row layout */
  @media (max-width: 768px) {
    border-left: none;
    border-top: 1px solid var(--color-border-subtle, ${token('color.border', '#e4e6ea')});
    order: -1; /* Show above editor content on mobile */
    max-height: ${props => props.collapsed ? '0' : '300px'};
    overflow-y: auto;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${token('space.200')} ${token('space.300')};
  border-bottom: 1px solid var(--sidebar-border, var(--color-border-subtle, ${token('color.border', '#e4e6ea')}));
  /* Match container: pure white */
  background: #ffffff;
  min-height: 56px; /* Uniform header height */

  h3 {
    margin: 0;
    fontSize: var(--font-size-body-large, ${token('font.size.200', '16px')});
    fontWeight: var(--font-weight-semibold, ${token('font.weight.semibold', '600')});
    color: var(--color-text-primary, ${token('color.text', '#172b4d')});
  }
`;

const SidebarTabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--sidebar-border, var(--color-border-subtle, ${token('color.border', '#e4e6ea')}));
  background: transparent; /* No background */
`;

const SidebarTab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${token('space.200')} ${token('space.300')};
  background: transparent; /* No background in all states */
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--color-primary-500, ' + token('color.background.brand.bold', '#0B5CFF') + ')' : 'transparent'}; /* Blue underline when active */
  color: ${props => props.active ? 'var(--color-text-primary, ' + token('color.text', '#172b4d') + ')' : 'var(--color-text-secondary, ' + token('color.text.subtle', '#6b778c') + ')'};
  font-weight: var(--font-weight-medium, ${token('font.weight.medium', '500')});
  cursor: pointer;
  transition: var(--transition-colors, all ${token('motion.duration.fast', '150ms')} ${token('motion.easing.standard', 'ease')});
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${token('space.100')};
  font-size: var(--font-size-body-small, ${token('font.size.075', '12px')});

  &:hover:not(:disabled) {
    background: transparent; /* Keep background transparent on hover */
    color: var(--color-text-primary, ${token('color.text', '#172b4d')});
  }

  /* Remove focus ring; rely on underline only */
  &:focus { outline: none; box-shadow: none; }
  &:focus-visible { outline: none; box-shadow: none; }
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
    background: var(--color-surface-hover, ${token('color.background.neutral.subtle', '#f4f5f7')});
    border-radius: var(--radius-medium, ${token('border.radius', '8px')});
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border, ${token('color.background.neutral.bold', '#8993a4')});
    border-radius: var(--radius-medium, ${token('border.radius', '8px')});

    &:hover {
      background: var(--color-border-strong, ${token('color.background.neutral.bolder', '#5e6c84')});
    }
  }
`;

const ReadabilityScore = styled.div<{ score: number }>`
  text-align: center;
  margin-bottom: ${token('space.400')};
  padding: ${token('space.200')};
  background: transparent; /* Remove card background */
  border-radius: ${token('border.radius.200')};
  border: none; /* No border */
  
  /* Score circle is now handled by AnimatedCircularProgress */
  
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
    /* Light transparent blue background with darker blue text */
    background: rgba(11, 92, 255, 0.08);
    color: var(--color-primary-700);
    border-radius: var(--radius-large);
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
      color: var(--color-primary-700);
      display: flex;
      align-items: center;
      gap: ${token('space.100')};
    }
    
    .issue-count {
      font-weight: ${token('font.weight.semibold')};
      color: ${props => props.count > 0 ? token('color.text.warning') : token('color.text.success')};
      background: ${props => props.count > 0 ? token('color.background.warning.subtle') : token('color.background.success.subtle')};
      padding: ${token('space.050')} ${token('space.100')};
      border-radius: var(--radius-large);
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

const ReadabilityStatsSection = styled.div`
  margin-bottom: ${token('space.400')};
  padding: ${token('space.250')} ${token('space.300')};
  background: var(--color-surface, #ffffff);
  border-radius: var(--radius-large);
  color: var(--color-text, ${token('color.text', '#172b4d')});
`;

const StatsSummaryHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${token('space.150')};
  font-weight: ${token('font.weight.semibold')};
  font-size: ${token('font.size.100')};

  .summary-label {
    font-size: ${token('font.size.075')};
    color: ${token('color.text.subtle')};
  }

  .summary-value {
    font-size: ${token('font.size.250')};
    font-weight: ${token('font.weight.semibold')};
    color: var(--color-text, ${token('color.text', '#172b4d')});
  }
`;

const StatsToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${token('space.075')};
  margin-top: ${token('space.150')};
  padding: ${token('space.050')} 0;
  background: none;
  border: none;
  color: var(--color-text, ${token('color.text', '#172b4d')});
  font-size: ${token('font.size.075')};
  font-weight: ${token('font.weight.medium')};
  cursor: pointer;

  &:hover {
    color: var(--color-text, ${token('color.text', '#172b4d')});
    opacity: 0.75;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .toggle-icon {
    transition: transform ${token('motion.duration.fast')} ${token('motion.easing.standard')};
  }
`;

const StatsDetailsGrid = styled.div`
  margin-top: ${token('space.200')};
  display: flex;
  flex-direction: column;
  gap: ${token('space.050')};
`;

const StatsDetail = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${token('space.100')};
  font-size: ${token('font.size.075')};
  color: var(--color-text, ${token('color.text', '#172b4d')});
  line-height: 1.4;

  .detail-label {
    font-weight: ${token('font.weight.medium')};
    color: ${token('color.text.subtle')};
  }

  .detail-value {
    font-weight: ${token('font.weight.semibold')};
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${token('space.300')};
  /* Match issue items: transparent blue background + darker blue text */
  background: rgba(11, 92, 255, 0.08);
  color: var(--color-primary-700);
  border-radius: var(--radius-large);
  border: 1px solid ${token('color.border.brand')};
  
  .stat-icon {
    color: var(--color-primary-700);
    margin-bottom: ${token('space.100')};
  }
  
  .stat-value {
    font-size: ${token('font.size.300')};
    font-weight: ${token('font.weight.bold')};
    color: var(--color-primary-700);
    display: block;
    margin-bottom: ${token('space.050')};
  }
  
  .stat-label {
    font-size: ${token('font.size.075')};
    color: var(--color-primary-700);
    font-weight: ${token('font.weight.medium')};
  }
`;

const ReadingTimeCard = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${token('space.300')};
  /* Use same style as other stat cards for consistency */
  background: rgba(11, 92, 255, 0.08);
  border-radius: var(--radius-large);
  border: 1px solid ${token('color.border.brand')};
  
  .reading-time-value {
    font-size: ${token('font.size.400')};
    font-weight: ${token('font.weight.bold')};
    color: var(--color-primary-700);
    display: block;
    margin-bottom: ${token('space.050')};
  }
  
  .reading-time-label {
    font-size: ${token('font.size.100')};
    color: var(--color-primary-700);
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
  const [showMoreStats, setShowMoreStats] = useState(false);

  const readingMinutes = Math.max(0, writingStats.readingTime);
  const readingTimeLabel = readingMinutes <= 0
    ? 'Less than a minute'
    : `${readingMinutes} ${readingMinutes === 1 ? 'minute' : 'minutes'}`;

  const wordsPerSecond = 200 / 60; // Matches editor reading speed baseline
  const estimatedSeconds = Math.max(0, Math.ceil(writingStats.words / wordsPerSecond));
  const formattedTime = estimatedSeconds <= 0
    ? '0s'
    : estimatedSeconds < 60
      ? `${estimatedSeconds}s`
      : `${Math.floor(estimatedSeconds / 60)}m ${String(estimatedSeconds % 60).padStart(2, '0')}s`;

  const statsDetails = useMemo(() => ([
    { key: 'letters', label: 'Letters', value: writingStats.charactersNoSpaces.toLocaleString() },
    { key: 'characters', label: 'Characters', value: writingStats.characters.toLocaleString() },
    { key: 'words', label: 'Words', value: writingStats.words.toLocaleString() },
    { key: 'sentences', label: 'Sentences', value: writingStats.sentences.toLocaleString() },
    { key: 'paragraphs', label: 'Paragraphs', value: writingStats.paragraphs.toLocaleString() },
    { key: 'reading', label: 'Reading time', value: readingTimeLabel },
    { key: 'time', label: 'Time', value: formattedTime },
  ]), [writingStats, readingTimeLabel, formattedTime]);

  return (
    <SidebarContainer collapsed={collapsed} className={className}>
      
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
              <AnimatedCircularProgress
                value={readabilityMetrics.score}
                size={96}
                strokeWidth={8}
                progressColor="var(--color-primary-500, #0B5CFF)"
                trackColor="var(--color-border, #e4e6ea)"
                label={<span style={{ fontSize: '1rem' }}>{Math.round(readabilityMetrics.score)}</span>}
              />
              <div className="grade">{readabilityMetrics.grade}</div>
            </ReadabilityScore>

            <ReadabilityStatsSection>
              <StatsSummaryHeader>
                <span className="summary-label">Words</span>
                <span className="summary-value">{writingStats.words.toLocaleString()}</span>
              </StatsSummaryHeader>
              <StatsToggleButton
                type="button"
                onClick={() => setShowMoreStats(prev => !prev)}
                aria-expanded={showMoreStats}
                aria-controls="readability-stats-details"
              >
                <ChevronRightIcon
                  label=""
                  size="small"
                  className="toggle-icon"
                  style={{ transform: showMoreStats ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
                {showMoreStats ? 'Hide stats' : 'Show more stats'}
              </StatsToggleButton>
              {showMoreStats && (
                <StatsDetailsGrid id="readability-stats-details">
                  {statsDetails.map(({ key, label, value }) => (
                    <StatsDetail key={key}>
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </StatsDetail>
                  ))}
                </StatsDetailsGrid>
              )}
            </ReadabilityStatsSection>
            
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
