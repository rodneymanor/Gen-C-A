import React from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashShape, gcDashSpacing, gcDashTypography } from './styleUtils';
import { GcDashAvatar, GcDashAvatarProps } from './GcDashAvatar';
import { GcDashCard, GcDashCardBody, GcDashCardFooter, GcDashCardHeader, GcDashCardTitle } from './GcDashCard';
import { GcDashButton } from './GcDashButton';

export interface GcDashProjectMember extends Pick<GcDashAvatarProps, 'name' | 'src' | 'accentColor'> {}

export interface GcDashProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  status?: 'planning' | 'in-progress' | 'review' | 'complete' | 'blocked';
  dueDate?: string;
  progress?: number;
  members?: GcDashProjectMember[];
  tags?: string[];
}

const statusMap: Record<NonNullable<GcDashProjectCardProps['status']>, { label: string; color: string }> = {
  planning: { label: 'Planning', color: 'var(--color-info-500)' },
  'in-progress': { label: 'In Progress', color: 'var(--color-primary-500)' },
  review: { label: 'In Review', color: 'var(--color-warning-500)' },
  complete: { label: 'Complete', color: 'var(--color-success-500)' },
  blocked: { label: 'Blocked', color: 'var(--color-error-500)' },
};

export const GcDashProjectCard: React.FC<GcDashProjectCardProps> = ({
  title,
  description,
  status = 'planning',
  dueDate,
  progress = 0,
  members = [],
  tags = [],
  ...props
}) => (
  <GcDashCard interactive {...props}>
    <GcDashCardHeader>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 6px;
        `}
      >
        <GcDashCardTitle>{title}</GcDashCardTitle>
        {description && (
          <p
            css={css`
              margin: 0;
              font-size: 14px;
              color: ${gcDashColor.textMuted};
            `}
          >
            {description}
          </p>
        )}
      </div>
      <span
        css={css`
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(9, 30, 66, 0.05);
          color: ${statusMap[status].color};
          font-size: 12px;
          font-weight: 600;
        `}
      >
        ● {statusMap[status].label}
      </span>
    </GcDashCardHeader>
    <GcDashCardBody>
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${gcDashSpacing.md};
          flex-wrap: wrap;
        `}
      >
        <div
          css={css`
            flex: 1;
            min-width: 160px;
          `}
        >
          <div
            css={css`
              height: 8px;
              border-radius: 999px;
              background: rgba(9, 30, 66, 0.08);
              overflow: hidden;
            `}
          >
            <div
              css={css`
                height: 100%;
                border-radius: inherit;
                width: ${Math.min(Math.max(progress, 0), 100)}%;
                background: ${gcDashColor.primary};
                transition: width 0.4s ease;
              `}
            />
          </div>
          <span
            css={css`
              display: inline-block;
              margin-top: 8px;
              font-size: 13px;
              color: ${gcDashColor.textMuted};
            `}
          >
            {progress}% complete
          </span>
        </div>
        {dueDate && (
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 4px;
              min-width: 140px;
            `}
          >
            <span
              css={css`
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${gcDashColor.textMuted};
              `}
            >
              Due date
            </span>
            <span
              css={css`
                font-size: 16px;
                font-weight: ${gcDashTypography.titleWeight};
                color: ${gcDashColor.textPrimary};
              `}
            >
              {dueDate}
            </span>
          </div>
        )}
      </div>
      {tags.length > 0 && (
        <div
          css={css`
            display: inline-flex;
            gap: ${gcDashSpacing.xs};
            flex-wrap: wrap;
          `}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              css={css`
                padding: 4px 10px;
                border-radius: 999px;
                background: rgba(11, 92, 255, 0.1);
                color: ${gcDashColor.primary};
                font-size: 12px;
                font-weight: 600;
              `}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {members.length > 0 && (
        <div
          css={css`
            display: inline-flex;
            align-items: center;
          `}
        >
          {members.map((member, index) => (
            <span
              key={`${member.name}-${index}`}
              css={css`
                display: inline-flex;
              `}
              style={{ marginLeft: index === 0 ? 0 : -12 }}
            >
              <GcDashAvatar size="sm" {...member} />
            </span>
          ))}
        </div>
      )}
    </GcDashCardBody>
    <GcDashCardFooter>
      <GcDashButton variant="secondary">View details</GcDashButton>
      <GcDashButton variant="ghost">Share</GcDashButton>
    </GcDashCardFooter>
  </GcDashCard>
);

export interface GcDashProjectListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  owner: string;
  dueDate?: string;
  status?: GcDashProjectCardProps['status'];
  progress?: number;
  assignees?: GcDashProjectMember[];
  actions?: React.ReactNode;
  interactive?: boolean;
}

export const GcDashProjectListItem: React.FC<GcDashProjectListItemProps> = ({
  name,
  owner,
  dueDate,
  status = 'planning',
  progress = 0,
  assignees = [],
  actions,
  className,
  interactive = false,
  ...props
}) => (
  <div
    className={className}
    css={css`
      display: grid;
      grid-template-columns: minmax(160px, 1.5fr) minmax(80px, 0.8fr) minmax(80px, 0.8fr) minmax(120px, 1fr) auto;
      align-items: center;
      padding: ${gcDashSpacing.sm} ${gcDashSpacing.md};
      border-radius: ${gcDashShape.radiusCard};
      border: 1px solid ${gcDashColor.cardBorder};
      background: ${gcDashColor.cardBackground};
      gap: ${gcDashSpacing.md};
      transition: background 0.18s ease, border-color 0.18s ease;
      cursor: ${interactive ? 'pointer' : 'default'};

      &:hover {
        border-color: ${gcDashColor.cardHoverBorder};
        background: ${gcDashColor.cardHoverBackground};
      }

      &:active {
        border-color: ${gcDashColor.cardActiveBorder};
      }

      &:focus-within {
        border-color: ${gcDashColor.primary};
        outline: 2px solid ${gcDashColor.primary};
        outline-offset: 2px;
      }
    `}
    {...props}
  >
    <span>
      <strong
        css={css`
          display: block;
          font-weight: ${gcDashTypography.titleWeight};
          color: ${gcDashColor.textPrimary};
        `}
      >
        {name}
      </strong>
      <span
        css={css`
          font-size: 13px;
          color: ${gcDashColor.textMuted};
        `}
      >
        Owner: {owner}
      </span>
    </span>
    <span
      css={css`
        font-size: 13px;
        color: ${gcDashColor.textMuted};
      `}
    >
      {dueDate ?? '—'}
    </span>
    <span
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: ${statusMap[status].color};
      `}
    >
      ● {statusMap[status].label}
    </span>
    <div
      css={css`
        display: flex;
        align-items: center;
        gap: ${gcDashSpacing.xs};
      `}
    >
      <div
        css={css`
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: rgba(9, 30, 66, 0.08);
          overflow: hidden;
        `}
      >
        <div
          css={css`
            width: ${Math.min(Math.max(progress, 0), 100)}%;
            height: 100%;
            background: ${gcDashColor.primary};
            border-radius: inherit;
          `}
        />
      </div>
      <span
        css={css`
          font-size: 12px;
          min-width: 36px;
          text-align: right;
          color: ${gcDashColor.textMuted};
        `}
      >
        {progress}%
      </span>
    </div>
    <div
      css={css`
        display: inline-flex;
        align-items: center;
      `}
    >
      {assignees.map((member, index) => (
        <span
          key={`${member.name}-${index}`}
          css={css`
            display: inline-flex;
          `}
          style={{ marginLeft: index === 0 ? 0 : -12 }}
        >
          <GcDashAvatar size="xs" {...member} />
        </span>
      ))}
      {actions && <div style={{ marginLeft: gcDashSpacing.sm }}>{actions}</div>}
    </div>
  </div>
);
