import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashSpacing } from './styleUtils';

export interface GcDashFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

export const GcDashFeatureCard: React.FC<GcDashFeatureCardProps> = ({
  icon,
  title,
  description,
  highlight = false,
  className,
  ...props
}) => (
  <section
    className={clsx('gc-dash-feature-card', className)}
    css={css`
      display: flex;
      flex-direction: column;
      gap: ${gcDashSpacing.sm};
      padding: 16px;
      min-width: 220px;
      max-width: 260px;
      border: 1px solid ${highlight ? gcDashColor.primary : 'rgba(9, 30, 66, 0.18)'};
      border-radius: 12px;
      background: ${highlight ? 'rgba(11, 92, 255, 0.06)' : 'rgba(9, 30, 66, 0.02)'};
      color: ${gcDashColor.textPrimary};
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

      &:hover {
        transform: scale(1.02);
        border-color: ${gcDashColor.primary};
        background: rgba(11, 92, 255, 0.08);
      }

      &:focus-within {
        outline: none;
        border-color: ${gcDashColor.primary};
        background: rgba(11, 92, 255, 0.1);
      }
    `}
    {...props}
  >
    {icon && (
      <span
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(9, 30, 66, 0.08);
          color: rgba(9, 30, 66, 0.6);
          margin-bottom: 12px;
        `}
        aria-hidden="true"
      >
        {icon}
      </span>
    )}
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 4px;
      `}
    >
      <h4
        css={css`
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: ${gcDashColor.textPrimary};
        `}
      >
        {title}
      </h4>
      <p
        css={css`
          margin: 0;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: -0.2px;
          color: ${gcDashColor.textMuted};
        `}
      >
        {description}
      </p>
    </div>
  </section>
);

GcDashFeatureCard.displayName = 'GcDashFeatureCard';
