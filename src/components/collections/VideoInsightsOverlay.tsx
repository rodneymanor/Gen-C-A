import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/react';
import {
  GcDashButton,
  GcDashIconButton,
  GcDashLabel,
  GcDashTabs,
  gcDashShape,
  gcDashTypography,
} from '../gc-dash';
import type { GcDashLabelTone, GcDashTabItem } from '../gc-dash';
import { formatDate, formatDuration, formatRelativeTime, formatViewCount } from '../../utils/format';
import type { ContentItem } from '../../types';
import { Clock, Copy, ExternalLink, Play, Sparkles, Wand2, ArrowDown, ArrowUp, X } from 'lucide-react';

export interface VideoOverlayMetric {
  id: string;
  label: string;
  value: string;
  helper?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface VideoOverlayAnalysis {
  hook: {
    openerPattern: string;
    frameworks: string[];
    justification: string;
  };
  structure: {
    type: string;
    description: string;
    bestFor: string[];
    justification: string;
  };
  style: {
    tone: string;
    voice: string;
    wordChoice: string;
    pacing: string;
  };
}

export interface VideoOverlayAction {
  id: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface VideoOverlayProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  video: (ContentItem & {
    metrics?: VideoOverlayMetric[];
    transcript?: string;
    actions?: VideoOverlayAction[];
    analysis: VideoOverlayAnalysis;
  }) | null;
}

const palette = {
  zoomBlue: 'var(--gc-zoom-blue, #2D8CFF)',
  zoomBlueHover: 'var(--gc-zoom-blue-hover, #1E6FE6)',
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray200: '#E2E8F0',
  gray500: '#64748B',
  gray700: '#334155',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  danger: '#DC2626',
};

const spacing = {
  xs: '8px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
};

const statusToneMap: Record<ContentItem['status'], GcDashLabelTone> = {
  draft: 'warning',
  published: 'success',
  archived: 'neutral',
};

const overlayStyles = css`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing.lg};
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 1200;
`;

const layoutStyles = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

const dialogWrapperStyles = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const navRailStyles = css`
  position: absolute;
  top: 50%;
  left: 0;
  transform: translate(calc(-100% - ${spacing.sm}), -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.xs};

  @media (max-width: 900px) {
    flex-direction: row;
    top: auto;
    bottom: calc(-1 * ${spacing.sm});
    left: 50%;
    transform: translate(-50%, 100%);
  }
`;

const navButtonStyles = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid ${palette.gray200};
  background: ${palette.white};
  color: ${palette.textSecondary};
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out;

  &:hover {
    background: ${palette.gray50};
    border-color: ${palette.zoomBlue};
    color: ${palette.zoomBlue};
  }

  &:focus-visible {
    outline: none;
    border-color: ${palette.zoomBlue};
    box-shadow: 0 0 0 3px rgba(45, 140, 255, 0.2);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    color: ${palette.textSecondary};
  }
`;

const closeButtonWrapStyles = css`
  position: absolute;
  top: calc(-1 * ${spacing.sm});
  right: calc(-1 * ${spacing.sm});

  @media (max-width: 900px) {
    top: calc(-1 * ${spacing.xs});
    right: calc(-1 * ${spacing.xs});
  }
`;

const closeButtonStyles = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid ${palette.gray200};
  background: ${palette.white};
  color: ${palette.textSecondary};
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out;

  &:hover {
    background: ${palette.gray50};
    border-color: ${palette.zoomBlue};
    color: ${palette.zoomBlue};
  }

  &:focus-visible {
    outline: none;
    border-color: ${palette.zoomBlue};
    box-shadow: 0 0 0 3px rgba(45, 140, 255, 0.2);
  }
`;

const dialogStyles = css`
  position: relative;
  width: min(900px, 100%);
  max-height: calc(100vh - ${spacing.xl});
  background: ${palette.white};
  border-radius: ${gcDashShape.radiusLg};
  border: 1px solid ${palette.gray200};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const headerStyles = css`
  padding: ${spacing.lg} ${spacing.lg} 0;
  border-bottom: none;
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.lg};
  align-items: flex-start;
`;

const infoStackStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  min-width: 0;
`;

const titleStyles = css`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  color: ${palette.textPrimary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const metaRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.xs};
  align-items: center;
`;

const controlsStackStyles = css`
  display: flex;
  gap: ${spacing.xs};
  align-items: flex-start;
`;

const bodyStyles = css`
  padding: ${spacing.lg};
  padding-bottom: calc(${spacing.lg} + 72px);
  overflow-y: auto;
  background: ${palette.white};
`;

const contentGridStyles = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${spacing.lg};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${spacing.md};
  }
`;

const previewStackStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const previewMediaStyles = css`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${palette.gray200};
  background: ${palette.gray50};
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const utilitiesRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.xs};
`;

const actionsColumnStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const actionButtonStyles = css`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.sm};
  border-radius: 8px;
  border: 1px solid ${palette.gray200};
  background: ${palette.white};
  cursor: pointer;
  transition: background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out;

  &:hover {
    background: ${palette.gray50};
    border-color: ${palette.zoomBlue};
    color: ${palette.zoomBlue};
  }
`;

const actionCopyStyles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  color: ${palette.textPrimary};

  span {
    font-size: 14px;
    font-weight: 600;
  }

  small {
    font-size: 12px;
    color: ${palette.textSecondary};
    line-height: 1.4;
  }
`;

const metricsGridStyles = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${spacing.md};
`;

const metricStyles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: ${spacing.xs};
  border-radius: 8px;
  border: 1px solid ${palette.gray200};
  background: ${palette.gray50};
`;

const metricLabelStyles = css`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${palette.textSecondary};
`;

const metricValueStyles = css`
  font-size: 20px;
  font-weight: 600;
  line-height: 1.1;
  color: ${palette.textPrimary};
`;

const sectionStyles = css`
  border: 1px solid ${palette.gray200};
  border-radius: 12px;
  background: ${palette.white};
  padding: ${spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

const softSectionStyles = css`
  border: 1px solid ${palette.gray200};
  border-radius: 12px;
  background: ${palette.gray50};
  padding: ${spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const listStyles = css`
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: ${palette.textSecondary};
`;

const scriptSectionStyles = css`
  position: relative;
  border: 1px solid ${palette.gray200};
  border-radius: 12px;
  padding: ${spacing.sm};
  background: ${palette.white};
  transition: border-color 0.15s ease-out, background 0.15s ease-out;
  outline: none;

  &:hover,
  &:focus-within {
    border-color: ${palette.zoomBlue};
    background: ${palette.gray50};
  }

  &:hover .script-section-copy,
  &:focus-within .script-section-copy {
    opacity: 1;
    visibility: visible;
  }
`;

const copyControlStyles = css`
  position: absolute;
  top: ${spacing.xs};
  right: ${spacing.xs};
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease-out, visibility 0.15s ease-out;
`;

const copyButtonStyles = css`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid ${palette.gray200};
  background: ${palette.white};
  color: ${palette.textSecondary};
  box-shadow: none;
  transition: background 0.15s ease-out, border-color 0.15s ease-out, color 0.15s ease-out;

  &:hover {
    background: ${palette.gray50};
    border-color: ${palette.zoomBlue};
    color: ${palette.zoomBlue};
  }

  &:focus-visible {
    outline: none;
    border-color: ${palette.zoomBlue};
    box-shadow: 0 0 0 3px rgba(45, 140, 255, 0.2);
  }
`;

const visuallyHiddenStyles = css`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`;

const trendingColorMap: Record<NonNullable<VideoOverlayMetric['trend']>, string> = {
  up: palette.zoomBlue,
  down: palette.danger,
  flat: palette.textSecondary,
};

interface CopyableSectionProps {
  ariaLabel: string;
  copyText: string;
  copyLabel: string;
  onCopy: (text: string, label: string) => void;
  children: React.ReactNode;
}

const CopyableSection: React.FC<CopyableSectionProps> = ({ ariaLabel, copyText, copyLabel, onCopy, children }) => (
  <div role="group" tabIndex={0} aria-label={ariaLabel} css={scriptSectionStyles}>
    <div className="script-section-copy" css={copyControlStyles}>
      <GcDashIconButton
        type="button"
        size="sm"
        aria-label={`Copy ${copyLabel.toLowerCase()}`}
        onClick={(event) => {
          event.stopPropagation();
          onCopy(copyText, copyLabel);
        }}
        css={copyButtonStyles}
      >
        <Copy size={16} strokeWidth={1.5} />
      </GcDashIconButton>
    </div>
    {children}
  </div>
);

export const VideoInsightsOverlay: React.FC<VideoOverlayProps> = ({ open, onClose, onNavigate, video }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement>(null);
  const closeButtonWrapRef = useRef<HTMLDivElement>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimeout = window.setTimeout(() => {
      const root = dialogRef.current;
      if (!root) return;
      const focusTarget = root.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusTarget?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimeout);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDescriptionExpanded(false);
      setTranscriptExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!copyMessage) return;
    const timeout = window.setTimeout(() => setCopyMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyMessage]);

  const copyScriptSection = useCallback(async (text: string, label: string) => {
    const successMessage = `${label} copied to clipboard.`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyMessage(successMessage);
        return;
      }
      throw new Error('clipboard not supported');
    } catch (error) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          setCopyMessage(successMessage);
          return;
        }
        throw new Error('execCommand failed');
      } catch {
        setCopyMessage('Copy failed. Please select the text manually.');
      }
    }
  }, []);

  const metrics = useMemo(() => {
    if (!video?.metrics?.length) {
      const views = video?.metadata?.views;
      const likes = video?.metadata?.likes;
      const comments = video?.metadata?.comments;
      const followers = video?.metadata?.followers;

      return [
        views != null ? { id: 'views', label: 'Views', value: formatViewCount(views) } : null,
        likes != null ? { id: 'likes', label: 'Likes', value: formatViewCount(likes) } : null,
        comments != null ? { id: 'comments', label: 'Comments', value: formatViewCount(comments) } : null,
        followers != null ? { id: 'followers', label: 'Channel Followers', value: formatViewCount(followers) } : null,
      ].filter(Boolean) as VideoOverlayMetric[];
    }
    return video.metrics;
  }, [video]);

  const actions = useMemo(() => {
    const defaults: VideoOverlayAction[] = [
      {
        id: 'remix',
        label: 'Remix idea',
        description: 'Write a script inspired by this video',
        icon: <Wand2 size={18} strokeWidth={1.5} />,
      },
      {
        id: 'create-hooks',
        label: 'Create hooks',
        description: 'Try different hook types based on the same concept.',
        icon: <Sparkles size={18} strokeWidth={1.5} />,
      },
    ];

    const provided = (video?.actions ?? [])
      .filter((action) => !['play', 'add', 'prompt'].includes(action.id))
      .map((action) =>
        action.id === 'create-hooks'
          ? { ...action, description: 'Try different hook types based on the same concept.' }
          : action
      );

    const combined = [...provided, ...defaults];
    const deduped = combined.filter(
      (action, index, list) => list.findIndex((item) => item.id === action.id) === index
    );

    return deduped;
  }, [video]);

  const overviewTabContent = useMemo<GcDashTabItem[]>(() => {
    if (!video) return [];
    const { analysis } = video;

    const hookCopyText = [
      `Opener pattern: ${analysis.hook.openerPattern}`,
      `Frameworks detected: ${analysis.hook.frameworks.join(', ')}`,
      `Justification: ${analysis.hook.justification}`,
    ].join('\n');

    const structureCopyText = [
      `Type: ${analysis.structure.type}`,
      `Description: ${analysis.structure.description}`,
      `Best for: ${analysis.structure.bestFor.join(', ')}`,
      `Justification: ${analysis.structure.justification}`,
    ].join('\n');

    const styleCopyText = [
      `Tone: ${analysis.style.tone}`,
      `Voice: ${analysis.style.voice}`,
      `Word choice: ${analysis.style.wordChoice}`,
      `Pacing: ${analysis.style.pacing}`,
    ].join('\n');

    return [
      {
        id: 'hook',
        label: 'Hook analysis',
        content: (
          <CopyableSection
            ariaLabel="Hook analysis script section"
            copyLabel="Hook analysis"
            copyText={hookCopyText}
            onCopy={copyScriptSection}
          >
            <div
              css={css`
                display: flex;
                flex-direction: column;
                gap: ${spacing.sm};
                font-size: 14px;
                line-height: 1.5;
                color: ${palette.textSecondary};
              `}
            >
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Opener pattern
              </span>
              <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.hook.openerPattern}</p>
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Frameworks detected
              </span>
              <ul css={listStyles}>
                {analysis.hook.frameworks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Justification
              </span>
              <p css={css`margin: 0; color: ${palette.textSecondary};`}>{analysis.hook.justification}</p>
            </div>
          </CopyableSection>
        ),
      },
      {
        id: 'structure',
        label: 'Structure analysis',
        content: (
          <CopyableSection
            ariaLabel="Structure analysis script section"
            copyLabel="Structure analysis"
            copyText={structureCopyText}
            onCopy={copyScriptSection}
          >
            <div
              css={css`
                display: flex;
                flex-direction: column;
                gap: ${spacing.sm};
                font-size: 14px;
                line-height: 1.5;
                color: ${palette.textSecondary};
              `}
            >
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Type
              </span>
              <GcDashLabel
                tone="primary"
                variant="outline"
                uppercase={false}
                css={css`border-color: ${palette.zoomBlue}; color: ${palette.zoomBlue};`}
              >
                {analysis.structure.type}
              </GcDashLabel>
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Description
              </span>
              <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.structure.description}</p>
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Best for
              </span>
              <ul css={listStyles}>
                {analysis.structure.bestFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                Justification
              </span>
              <p css={css`margin: 0; color: ${palette.textSecondary};`}>{analysis.structure.justification}</p>
            </div>
          </CopyableSection>
        ),
      },
      {
        id: 'style',
        label: 'Style analysis',
        content: (
          <CopyableSection
            ariaLabel="Style analysis script section"
            copyLabel="Style analysis"
            copyText={styleCopyText}
            onCopy={copyScriptSection}
          >
            <div
              css={css`
                display: grid;
                gap: ${spacing.sm};
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                font-size: 14px;
                line-height: 1.5;
                color: ${palette.textSecondary};
              `}
            >
              <div>
                <span css={css`display: block; font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Tone
                </span>
                <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.style.tone}</p>
              </div>
              <div>
                <span css={css`display: block; font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Voice
                </span>
                <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.style.voice}</p>
              </div>
              <div>
                <span css={css`display: block; font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Word choice
                </span>
                <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.style.wordChoice}</p>
              </div>
              <div>
                <span css={css`display: block; font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Pacing
                </span>
                <p css={css`margin: 0; color: ${palette.textPrimary};`}>{analysis.style.pacing}</p>
              </div>
            </div>
          </CopyableSection>
        ),
      },
    ];
  }, [copyScriptSection, video]);

  if (!open || !video) {
    return null;
  }

  const titleId = `video-overlay-title-${video.id}`;
  const descriptionPreview = video.description ?? 'No description provided yet.';
  const transcriptText = video.transcript ?? 'Transcript will appear here once processing completes.';

  const handleOverlayPointerDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return;
    const target = event.target as Node;
    if (dialogRef.current?.contains(target)) return;
    if (navRailRef.current?.contains(target)) return;
    if (closeButtonWrapRef.current?.contains(target)) return;
    onClose();
  };

  return createPortal(
    <div css={overlayStyles} onMouseDown={handleOverlayPointerDown} role="presentation">
      <div css={layoutStyles}>
        <div css={dialogWrapperStyles}>
          <div css={navRailStyles} ref={navRailRef}>
            <GcDashIconButton
              aria-label="View previous video"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate?.('prev');
              }}
              disabled={!onNavigate}
              css={navButtonStyles}
            >
              <ArrowUp size={18} strokeWidth={1.6} />
            </GcDashIconButton>
            <GcDashIconButton
              aria-label="View next video"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate?.('next');
              }}
              disabled={!onNavigate}
              css={navButtonStyles}
            >
              <ArrowDown size={18} strokeWidth={1.6} />
            </GcDashIconButton>
          </div>

          <div css={closeButtonWrapStyles} ref={closeButtonWrapRef}>
            <GcDashIconButton
              aria-label="Close video overlay"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              css={closeButtonStyles}
            >
              <X size={18} strokeWidth={1.6} />
            </GcDashIconButton>
          </div>

          <div
            css={dialogStyles}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={dialogRef}
          >
            <header css={headerStyles}>
              <div css={infoStackStyles}>
                <GcDashLabel
                  tone="info"
                  variant="soft"
                  uppercase={false}
                  css={css`color: ${palette.zoomBlue}; background: rgba(45, 140, 255, 0.12); border: 1px solid transparent;`}
                >
                  {video.platform ? `${video.platform.charAt(0).toUpperCase()}${video.platform.slice(1)}` : 'Video'}
                </GcDashLabel>
                <h1 id={titleId} css={titleStyles}>
                  {video.title}
                </h1>
                <div css={metaRowStyles}>
                  <GcDashLabel
                    tone={statusToneMap[video.status]}
                    variant="outline"
                    uppercase={false}
                    css={css`border-color: ${palette.gray200}; color: ${palette.textSecondary};`}
                  >
                    {video.status}
                  </GcDashLabel>
                  {video.duration && (
                    <GcDashLabel
                      tone="neutral"
                      variant="outline"
                      uppercase={false}
                      leadingIcon={<Clock size={14} strokeWidth={1.5} />}
                      css={css`border-color: ${palette.gray200}; color: ${palette.textSecondary};`}
                    >
                      {formatDuration(video.duration)} runtime
                    </GcDashLabel>
                  )}
                  <GcDashLabel
                    tone="neutral"
                    variant="outline"
                    uppercase={false}
                    css={css`border-color: ${palette.gray200}; color: ${palette.textSecondary};`}
                  >
                    Updated {formatRelativeTime(video.updated)}
                  </GcDashLabel>
                  {video.tags?.slice(0, 2).map((tag) => (
                    <GcDashLabel
                      key={tag}
                      tone="primary"
                      variant="outline"
                      uppercase={false}
                      css={css`border-color: ${palette.gray200}; color: ${palette.textSecondary};`}
                    >
                      #{tag}
                    </GcDashLabel>
                  ))}
                </div>
              </div>
              <div css={controlsStackStyles} />
            </header>
            <div css={bodyStyles}>
              <div css={contentGridStyles}>
            <section css={previewStackStyles}>
              <div css={previewMediaStyles}>
                {video.url ? (
                  <iframe
                    src={video.url}
                    title={`${video.title} preview`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.thumbnail ? (
                  <img src={video.thumbnail} alt="Video thumbnail" />
                ) : (
                  <div css={css`color: ${palette.textSecondary}; font-size: 14px; text-align: center; padding: ${spacing.sm};`}>
                    Preview unavailable
                  </div>
                )}
              </div>

              <GcDashButton
                size="md"
                leadingIcon={<Play size={18} strokeWidth={1.6} />}
                onClick={() => {
                  if (video.url) {
                    window.open(video.url, '_blank', 'noopener');
                  }
                }}
                css={css`
                  background: ${palette.zoomBlue};
                  color: ${palette.white};
                  border: 1px solid ${palette.zoomBlue};
                  border-radius: 8px;
                  padding: 12px 24px;
                  min-height: 48px;
                  box-shadow: none;
                  transition: background 0.15s ease-out, border-color 0.15s ease-out;
                  &:hover {
                    background: ${palette.zoomBlueHover};
                    border-color: ${palette.zoomBlueHover};
                  }
                `}
              >
                Play full video
              </GcDashButton>

              <div css={sectionStyles}>
                <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Creator details
                </span>
                {video.creator && (
                  <p css={css`margin: 0; font-size: 14px; color: ${palette.textPrimary};`}>Creator: {video.creator}</p>
                )}
                <p css={css`margin: 0; font-size: 14px; color: ${palette.textSecondary};`}>
                  Added {formatDate(video.created)} · Last updated {formatRelativeTime(video.updated)}
                </p>
                {video.tags?.length ? (
                  <div css={utilitiesRowStyles}>
                    {video.tags.map((tag) => (
                      <GcDashLabel
                        key={tag}
                        tone="neutral"
                        variant="outline"
                        uppercase={false}
                        css={css`border-color: ${palette.gray200}; color: ${palette.textSecondary};`}
                      >
                        #{tag}
                      </GcDashLabel>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section css={css`display: flex; flex-direction: column; gap: ${spacing.lg};`}>
              <div css={sectionStyles}>
                <div>
                  <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                    Take action
                  </span>
                  <p css={css`margin: 4px 0 0; font-size: 14px; color: ${palette.textSecondary};`}>
                    Use these shortcuts to apply the learning
                  </p>
                </div>
                <div css={actionsColumnStyles}>
                  {actions.map((action) => (
                    <button key={action.id} type="button" css={actionButtonStyles} onClick={action.onClick}>
                      <div css={actionCopyStyles}>
                        <span>{action.label}</span>
                        <small>{action.description}</small>
                      </div>
                      {action.icon}
                    </button>
                  ))}
                </div>
              </div>

              {metrics.length ? (
                <div css={sectionStyles}>
                  <div>
                    <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                      Performance metrics
                    </span>
                    <p css={css`margin: 4px 0 0; font-size: 14px; color: ${palette.textSecondary};`}>
                      What success looks like for this clip
                    </p>
                  </div>
                  <div css={metricsGridStyles}>
                    {metrics.map((metric) => (
                      <div key={metric.id} css={metricStyles}>
                        <span css={metricLabelStyles}>{metric.label}</span>
                        <span css={metricValueStyles}>{metric.value}</span>
                        {metric.helper && (
                          <span css={css`font-size: 12px; color: ${palette.textSecondary};`}>{metric.helper}</span>
                        )}
                        {metric.trend && (
                          <span css={css`font-size: 12px; font-weight: 500; color: ${trendingColorMap[metric.trend]};`}>
                            {metric.trend === 'up' && '▲ Trending up'}
                            {metric.trend === 'down' && '▼ Trending down'}
                            {metric.trend === 'flat' && '▬ Holding steady'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div css={softSectionStyles}>
                <div css={css`display: flex; align-items: center; justify-content: space-between; gap: ${spacing.xs};`}>
                  <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                    Description
                  </span>
                  <GcDashButton
                    variant="link"
                    size="sm"
                    onClick={() => setDescriptionExpanded((prev) => !prev)}
                    css={css`
                      color: ${palette.zoomBlue};
                      padding: 0;
                      min-height: auto;
                      box-shadow: none;
                      &:hover {
                        text-decoration: underline;
                      }
                    `}
                  >
                    {descriptionExpanded ? 'Show less' : 'Show more'}
                  </GcDashButton>
                </div>
                <p
                  css={css`
                    margin: 0;
                    color: ${palette.textSecondary};
                    font-size: 14px;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    ${descriptionExpanded ? 'white-space: normal;' : '-webkit-line-clamp: 4;'}
                  `}
                >
                  {descriptionPreview}
                </p>
              </div>

              <div css={sectionStyles}>
                <div css={css`display: flex; align-items: center; justify-content: space-between; gap: ${spacing.xs};`}>
                  <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                    Transcript
                  </span>
                  <GcDashButton
                    variant="link"
                    size="sm"
                    onClick={() => setTranscriptExpanded((prev) => !prev)}
                    css={css`
                      color: ${palette.zoomBlue};
                      padding: 0;
                      min-height: auto;
                      box-shadow: none;
                      &:hover {
                        text-decoration: underline;
                      }
                    `}
                  >
                    {transcriptExpanded ? 'Show less' : 'Show full transcript'}
                  </GcDashButton>
                </div>
                <p
                  css={css`
                    margin: 0;
                    color: ${palette.textSecondary};
                    font-size: 14px;
                    line-height: 1.6;
                    font-family: ${gcDashTypography.family};
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    ${transcriptExpanded ? 'white-space: normal;' : '-webkit-line-clamp: 6;'}
                  `}
                >
                  {transcriptText}
                </p>
              </div>

              <div css={sectionStyles}>
                <span css={css`font-size: 16px; font-weight: 500; color: ${palette.textPrimary};`}>
                  Analyses
                </span>
                <GcDashTabs
                  tabs={overviewTabContent}
                  variant="pill"
                  stretch
                  css={css`
                    [role='tablist'] {
                      background: ${palette.gray50};
                      padding: 4px;
                      border-radius: 12px;
                      border: 1px solid ${palette.gray200};
                    }

                    button[role='tab'] {
                      border-radius: 8px;
                      color: ${palette.textSecondary};
                      transition: background 0.15s ease-out, color 0.15s ease-out;
                    }

                    button[role='tab'][aria-selected='true'] {
                      background: ${palette.white};
                      color: ${palette.textPrimary};
                      box-shadow: none;
                      border: 1px solid ${palette.zoomBlue};
                    }

                    section[role='tabpanel'] {
                      margin-top: ${spacing.sm};
                    }
                  `}
                />
              </div>
            </section>
          </div>
        </div>

            {video.url && (
              <GcDashButton
                size="sm"
                leadingIcon={<ExternalLink size={16} strokeWidth={1.5} />}
                onClick={() => window.open(video.url as string, '_blank', 'noopener')}
                css={css`
                  position: absolute;
                  left: ${spacing.lg};
                  bottom: ${spacing.lg};
                  background: ${palette.white};
                  color: ${palette.zoomBlue};
                  border: 1px solid ${palette.zoomBlue};
                  border-radius: 8px;
                  padding: 12px 24px;
                  min-height: 44px;
                  box-shadow: none;
                  transition: all 0.15s ease-out;
                  &:hover {
                    background: ${palette.zoomBlue};
                    color: ${palette.white};
                  }
                  @media (max-width: 900px) {
                    left: ${spacing.sm};
                    bottom: ${spacing.sm};
                  }
                `}
              >
                Open source
              </GcDashButton>
            )}

            <div role="status" aria-live="polite" css={visuallyHiddenStyles}>
              {copyMessage || ''}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoInsightsOverlay;
