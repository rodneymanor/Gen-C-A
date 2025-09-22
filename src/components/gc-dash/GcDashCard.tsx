import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashShape, gcDashSpacing, gcDashTypography } from './styleUtils';

export interface GcDashCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bleed?: boolean;
  interactive?: boolean;
}

export const GcDashCard = React.forwardRef<HTMLDivElement, GcDashCardProps>(
  ({ bleed = false, interactive = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('gc-dash-card', className)}
      css={css`
        background: ${gcDashColor.cardBackground};
        border-radius: ${gcDashShape.radiusCard};
        border: 1px solid ${gcDashColor.cardBorder};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        cursor: ${interactive ? 'pointer' : 'default'};
        text-decoration: none;

        &:hover {
          background: ${gcDashColor.cardHoverBackground};
          border-color: ${gcDashColor.cardHoverBorder};
        }

        &:active {
          border-color: ${gcDashColor.cardActiveBorder};
          transform: ${interactive ? 'translateY(1px)' : 'none'};
        }

        &:focus-within {
          outline: 2px solid ${gcDashColor.primary};
          outline-offset: 2px;
          border-color: ${gcDashColor.primary};
        }
      `}
      data-interactive={interactive ? 'true' : undefined}
      {...props}
    >
      <div
        css={css`
          padding: ${bleed ? '0' : '16px 20px'};
          display: flex;
          flex-direction: column;
          gap: ${gcDashSpacing.md};
        `}
      >
        {children}
      </div>
    </div>
  )
);

GcDashCard.displayName = 'GcDashCard';

export interface GcDashCardSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GcDashCardHeader: React.FC<GcDashCardSectionProps> = ({ children, className, ...props }) => (
  <header
    className={clsx('gc-dash-card__header', className)}
    css={css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${gcDashSpacing.md};
    `}
    {...props}
  >
    {children}
  </header>
);

export const GcDashCardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3
    className={clsx('gc-dash-card__title', className)}
    css={css`
      font-size: 18px;
      font-weight: ${gcDashTypography.titleWeight};
      color: ${gcDashColor.textPrimary};
    `}
    {...props}
  >
    {children}
  </h3>
);

export const GcDashCardSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p
    className={clsx('gc-dash-card__subtitle', className)}
    css={css`
      margin: 0;
      font-size: 14px;
      color: ${gcDashColor.textMuted};
    `}
    {...props}
  >
    {children}
  </p>
);

export const GcDashCardBody: React.FC<GcDashCardSectionProps> = ({ children, className, ...props }) => (
  <div
    className={clsx('gc-dash-card__body', className)}
    css={css`
      display: flex;
      flex-direction: column;
      gap: ${gcDashSpacing.md};
    `}
    {...props}
  >
    {children}
  </div>
);

export const GcDashCardFooter: React.FC<GcDashCardSectionProps> = ({ children, className, ...props }) => (
  <footer
    className={clsx('gc-dash-card__footer', className)}
    css={css`
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: ${gcDashSpacing.sm};
      border-top: 1px solid rgba(9, 30, 66, 0.12);
      padding-top: ${gcDashSpacing.sm};
    `}
    {...props}
  >
    {children}
  </footer>
);

export interface GcDashMetricCardProps extends GcDashCardProps {
  metric: string;
  label: string;
  delta?: { value: number; trend?: 'up' | 'down' | 'flat'; label?: string };
  icon?: React.ReactNode;
}

export const GcDashMetricCard: React.FC<GcDashMetricCardProps> = ({
  metric,
  label,
  delta,
  icon,
  ...props
}) => (
  <GcDashCard {...props}>
    <GcDashCardHeader>
      <span
        css={css`
          display: inline-flex;
          align-items: center;
          gap: ${gcDashSpacing.sm};
          color: ${gcDashColor.textMuted};
          font-size: 14px;
        `}
      >
        {icon}
        {label}
      </span>
      {delta && (
        <span
          css={css`
            font-size: 13px;
            font-weight: 600;
            color: ${
              delta.trend === 'down'
                ? gcDashColor.danger
                : delta.trend === 'up'
                ? gcDashColor.success
                : gcDashColor.textMuted
            };
          `}
        >
          {delta.trend === 'up' && '▲'}
          {delta.trend === 'down' && '▼'}
          {delta.trend === 'flat' && '▬'}
          <span style={{ marginLeft: 4 }}>{delta.value}%</span>
          {delta.label && <span style={{ marginLeft: 4 }}>({delta.label})</span>}
        </span>
      )}
    </GcDashCardHeader>
    <GcDashCardBody>
      <span
        css={css`
          font-size: 36px;
          font-weight: 650;
          letter-spacing: -0.02em;
          color: ${gcDashColor.textPrimary};
        `}
      >
        {metric}
      </span>
    </GcDashCardBody>
  </GcDashCard>
);
