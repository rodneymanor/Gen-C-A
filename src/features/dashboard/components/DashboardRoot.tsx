import React from 'react';
import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  GcDashPlanChip,
  GcDashNavButtons,
  GcDashButton,
  GcDashCard,
  GcDashCardBody,
  GcDashCardTitle,
  GcDashCardSubtitle,
  GcDashLabel,
  GcDashBlankSlate,
} from '@/components/gc-dash';
import AddIcon from '@atlaskit/icon/glyph/add';
import EditIcon from '@atlaskit/icon/glyph/edit';
import MediaServicesPresentationIcon from '@atlaskit/icon/glyph/media-services/presentation';
import ActivityIcon from '@atlaskit/icon/glyph/activity';
import LightbulbIcon from '@atlaskit/icon/glyph/lightbulb';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import ArrowRightIcon from '@atlaskit/icon/glyph/arrow-right';

const pageContainerStyles = css`
  min-height: 100vh;
  background: rgba(9, 30, 66, 0.02);
  padding: 48px 64px 64px;

  @media (max-width: 1024px) {
    padding: 32px 32px 48px;
  }

  @media (max-width: 640px) {
    padding: 24px 20px 40px;
  }
`;

const shellStyles = css`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const headerRowStyles = css`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const headerLeftStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 16px;
`;

const heroSectionStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const heroCardStyles = css`
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(11, 92, 255, 0.08), rgba(9, 30, 66, 0.02));
  border-radius: 24px;
  padding: 32px;
  display: grid;
  gap: 24px;
`;

const heroTitleStyles = css`
  display: grid;
  gap: 12px;
  max-width: 520px;

  h1 {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.16;
    letter-spacing: -0.02em;
    color: rgba(9, 30, 66, 0.95);
  }

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: rgba(9, 30, 66, 0.7);
  }
`;

const heroHighlightsStyles = css`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const quickLaunchGridStyles = css`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const sectionTitleStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 650;
    letter-spacing: -0.01em;
    color: rgba(9, 30, 66, 0.95);
  }

  span {
    font-size: 14px;
    color: rgba(9, 30, 66, 0.6);
  }
`;

const dualColumnStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 24px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const timelineListStyles = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
`;

const timelineItemStyles = css`
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 16px;
  align-items: flex-start;
`;

const timelineMarkerStyles = css`
  width: 14px;
  position: relative;
  margin-top: 6px;

  &::before {
    content: '';
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: rgba(11, 92, 255, 0.9);
    display: block;
    box-shadow: 0 0 0 4px rgba(11, 92, 255, 0.18);
  }
`;

const timelineContentStyles = css`
  display: grid;
  gap: 8px;

  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: rgba(9, 30, 66, 0.9);
  }

  .meta-row {
    font-size: 13px;
    color: rgba(9, 30, 66, 0.55);
  }

  .summary {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(9, 30, 66, 0.7);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const quickTaskListStyles = css`
  display: grid;
  gap: 12px;
`;

const quickTaskButtonStyles = css`
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(9, 30, 66, 0.12);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  span {
    font-size: 15px;
    font-weight: 600;
    color: rgba(9, 30, 66, 0.9);
  }

  &:hover {
    border-color: rgba(11, 92, 255, 0.5);
    box-shadow: 0 14px 28px rgba(11, 92, 255, 0.14);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid rgba(11, 92, 255, 0.4);
    outline-offset: 2px;
  }
`;

const noActivityStyles = css`
  border-radius: 18px;
  border: 1px dashed rgba(9, 30, 66, 0.16);
  background: rgba(9, 30, 66, 0.02);
`;

interface TimelineEntry {
  id: string;
  title: string;
  type: 'script' | 'collection' | 'idea';
  summary: string;
  updatedLabel: string;
}

export const DashboardRoot: React.FC = () => {
  const navigate = useNavigate();

  const timelineEntries: TimelineEntry[] = [
    {
      id: 'script-refresh',
      title: 'Blend AI summaries into your draft',
      type: 'script',
      summary: 'You pulled highlights from Claude yesterday—stitch them into a polished narrative and ship the post in minutes.',
      updatedLabel: 'Updated 2h ago',
    },
    {
      id: 'collection-trend',
      title: 'Short-form hooks that converted this week',
      type: 'collection',
      summary: 'Five TikTok hooks outperforming benchmark watch time for your niche. Repurpose the beats with your tone.',
      updatedLabel: 'Updated 7h ago',
    },
    {
      id: 'idea-queue',
      title: 'Workshop the “Studio reset” storyline',
      type: 'idea',
      summary: 'Turn the studio make-over BTS into a 30s vertical with an arresting hook and CTA to the new webinar.',
      updatedLabel: 'Updated yesterday',
    },
  ];

  const quickLaunchCards = [
    {
      id: 'write',
      title: 'Launch the writer',
      description: 'Draft scripts in Claude-inspired flows with idea capsules, hooks, and brand voice guardrails.',
      icon: <MediaServicesPresentationIcon label="" />,
      action: () => navigate('/write'),
      cta: 'Start writing',
    },
    {
      id: 'collections',
      title: 'Review collections',
      description: 'See what’s pinned, trending, and ready for remix in your curated libraries.',
      icon: <ActivityIcon label="" />,
      action: () => navigate('/collections'),
      cta: 'Open collections',
    },
    {
      id: 'library',
      title: 'Audit the library',
      description: 'Surface scripts and notes to keep or ship—spot gaps before the weekly content drop.',
      icon: <LightbulbIcon label="" />,
      action: () => navigate('/library'),
      cta: 'Inspect library',
    },
  ];

  const quickTasks = [
    {
      id: 'add-idea',
      label: 'Capture a fresh idea',
      icon: <AddIcon label="" />,
      onClick: () => navigate('/library?tab=ideas'),
    },
    {
      id: 'tune-voice',
      label: 'Tune your brand voice',
      icon: <SettingsIcon label="" />,
      onClick: () => navigate('/brand-voices'),
    },
    {
      id: 'outline-session',
      label: 'Outline a batch session',
      icon: <EditIcon label="" />,
      onClick: () => navigate('/write'),
    },
  ];

  const handlePreviousNav = () => navigate('/write-redesign');
  const handleNextNav = () => navigate('/collections');

  return (
    <div css={pageContainerStyles}>
      <div css={shellStyles}>
        <header css={headerRowStyles}>
          <div css={headerLeftStyles}>
            <GcDashPlanChip planName="Creator cockpit" info="Today" highlighted />
            <GcDashNavButtons onPrevious={handlePreviousNav} onNext={handleNextNav} />
          </div>
          <GcDashButton variant="primary" leadingIcon={<AddIcon label="" />} onClick={() => navigate('/write')}>
            New script
          </GcDashButton>
        </header>

        <section css={heroSectionStyles}>
          <div css={heroCardStyles}>
            <div css={heroTitleStyles}>
              <h1>Ship content that feels on-brand every time</h1>
              <p>
                Use Claude-style workspaces, trend monitoring, and library insights to keep your pipeline full without
                sacrificing quality. Everything you need to prep today’s publish is organized right here.
              </p>
            </div>
            <div css={heroHighlightsStyles}>
              <GcDashLabel tone="primary" variant="soft" uppercase={false}>
                ✨ 3 scripts ready for polish
              </GcDashLabel>
              <GcDashLabel tone="neutral" variant="soft" uppercase={false}>
                🔁 2 drafts need remixing
              </GcDashLabel>
              <GcDashLabel tone="primary" variant="outline" uppercase={false}>
                📈 Trending: “Studio reset”
              </GcDashLabel>
            </div>
            <div>
              <GcDashButton variant="secondary" trailingIcon={<ArrowRightIcon label="" />} onClick={() => navigate('/collections')}>
                Explore collections
              </GcDashButton>
            </div>
          </div>

          <GcDashCard>
            <GcDashCardBody>
              <GcDashCardSubtitle>Quick launch</GcDashCardSubtitle>
              <GcDashCardTitle>Jump into your next move</GcDashCardTitle>
              <div css={quickLaunchGridStyles}>
                {quickLaunchCards.map((card) => (
                  <GcDashCard
                    key={card.id}
                    interactive
                    onClick={card.action}
                    css={css`
                      border-radius: 16px;
                    `}
                  >
                    <GcDashCardBody>
                      <div
                        css={css`
                          display: inline-flex;
                          align-items: center;
                          justify-content: center;
                          width: 40px;
                          height: 40px;
                          border-radius: 12px;
                          background: rgba(11, 92, 255, 0.08);
                          color: rgba(11, 92, 255, 0.9);
                        `}
                        aria-hidden
                      >
                        {card.icon}
                      </div>
                      <GcDashCardTitle>{card.title}</GcDashCardTitle>
                      <GcDashCardSubtitle>{card.description}</GcDashCardSubtitle>
                      {card.cta && (
                        <GcDashButton variant="link" trailingIcon={<ArrowRightIcon label="" />} onClick={card.action}>
                          {card.cta}
                        </GcDashButton>
                      )}
                    </GcDashCardBody>
                  </GcDashCard>
                ))}
              </div>
            </GcDashCardBody>
          </GcDashCard>
        </section>

        <section>
          <div css={sectionTitleStyles}>
            <h2>Momentum</h2>
            <span>Track what’s moving the needle in your workspace</span>
          </div>

          <div css={dualColumnStyles}>
            <GcDashCard>
              <GcDashCardBody>
                {timelineEntries.length === 0 ? (
                  <GcDashBlankSlate
                    className="dashboard-empty-timeline"
                    css={noActivityStyles}
                    title="No activity yet"
                    description="Once you start drafting or saving ideas, we’ll surface the latest here."
                    primaryAction={
                      <GcDashButton variant="primary" onClick={() => navigate('/write')}>
                        Create your first script
                      </GcDashButton>
                    }
                  />
                ) : (
                  <ul css={timelineListStyles}>
                    {timelineEntries.map((entry) => (
                      <li key={entry.id} css={timelineItemStyles}>
                        <span css={timelineMarkerStyles} aria-hidden />
                        <div css={timelineContentStyles}>
                          <div className="title-row">
                            {entry.title}
                            <GcDashLabel tone="primary" variant="soft" uppercase={false}>
                              {entry.type}
                            </GcDashLabel>
                          </div>
                          <div className="meta-row">{entry.updatedLabel}</div>
                          <p className="summary">{entry.summary}</p>
                          <GcDashButton variant="link" size="small" trailingIcon={<ArrowRightIcon label="" />} onClick={() => navigate('/collections')}>
                            Review details
                          </GcDashButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </GcDashCardBody>
            </GcDashCard>

            <GcDashCard>
              <GcDashCardBody>
                <GcDashCardSubtitle>Quick tasks</GcDashCardSubtitle>
                <GcDashCardTitle>Stay in flow</GcDashCardTitle>
                <div css={quickTaskListStyles}>
                  {quickTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      css={quickTaskButtonStyles}
                      onClick={task.onClick}
                    >
                      <span>{task.label}</span>
                      <ArrowRightIcon label="" />
                    </button>
                  ))}
                </div>
              </GcDashCardBody>
            </GcDashCard>
          </div>
        </section>
      </div>
    </div>
  );
};

DashboardRoot.displayName = 'DashboardRoot';

export default DashboardRoot;
