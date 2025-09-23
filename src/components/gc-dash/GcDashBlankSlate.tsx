import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashSpacing, gcDashShape } from './styleUtils';

export interface GcDashBlankSlateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  centerContent?: boolean;
}

export const GcDashBlankSlate: React.FC<GcDashBlankSlateProps> = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  centerContent = true,
  className,
  children,
  ...props
}) => {
  return (
    <section
      className={clsx('gc-dash-blank-slate', className)}
      css={css`
        display: flex;
        flex-direction: column;
        align-items: ${centerContent ? 'center' : 'flex-start'};
        text-align: ${centerContent ? 'center' : 'left'};
        gap: ${gcDashSpacing.md};
        padding: 48px;
        border-radius: ${gcDashShape.radiusLg};
        border: 1px dashed rgba(9, 30, 66, 0.16);
        background: rgba(9, 30, 66, 0.02);
        color: ${gcDashColor.textPrimary};
      `}
      {...props}
    >
      {icon && (
        <span
          css={css`
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(11, 92, 255, 0.08);
            color: ${gcDashColor.primary};
          `}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {(title || description) && (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: ${gcDashSpacing.xs};
            max-width: 520px;
          `}
        >
          {title && (
            <h2
              css={css`
                margin: 0;
                font-size: 22px;
                font-weight: 600;
                letter-spacing: -0.3px;
              `}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              css={css`
                margin: 0;
                font-size: 15px;
                line-height: 1.6;
                color: ${gcDashColor.textMuted};
              `}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {children && (
        <div
          css={css`
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: ${gcDashSpacing.sm};
            max-width: 640px;
          `}
        >
          {children}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div
          css={css`
            display: inline-flex;
            flex-wrap: wrap;
            gap: ${gcDashSpacing.sm};
            justify-content: ${centerContent ? 'center' : 'flex-start'};
          `}
        >
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </section>
  );
};

GcDashBlankSlate.displayName = 'GcDashBlankSlate';
