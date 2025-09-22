import React, { useMemo } from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashShape, gcDashSpacing, toRgba } from './styleUtils';

export type GcDashAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type GcDashAvatarStatus = 'online' | 'offline' | 'away' | 'busy' | 'focus';

export interface GcDashAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: GcDashAvatarSize;
  status?: GcDashAvatarStatus;
  description?: string;
  accentColor?: string;
  showMeta?: boolean;
}

const sizeMap: Record<GcDashAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const statusColor: Record<GcDashAvatarStatus, string> = {
  online: 'var(--color-success-500)',
  offline: gcDashColor.border,
  away: 'var(--color-warning-500)',
  busy: 'var(--color-error-500)',
  focus: 'var(--color-primary-500)',
};

const initialsForName = (value?: string) => {
  if (!value) return '';
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

export const GcDashAvatar: React.FC<GcDashAvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  description,
  accentColor,
  showMeta = true,
  className,
  ...props
}) => {
  const dimension = sizeMap[size];

  const initials = useMemo(() => initialsForName(name), [name]);
  const background = accentColor ? toRgba(accentColor, 0.12) : 'rgba(9, 30, 66, 0.08)';
  const foreground = accentColor ?? gcDashColor.textPrimary;

  return (
    <div
      className={clsx('gc-dash-avatar', className)}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${gcDashSpacing.sm};
      `}
      {...props}
    >
      <span
        css={css`
          position: relative;
          width: ${dimension}px;
          height: ${dimension}px;
          flex: 0 0 ${dimension}px;
          border-radius: ${gcDashShape.radiusXl};
          background: ${background};
          color: ${foreground};
          font-size: ${Math.max(12, Math.round(dimension / 2.4))}px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        `}
        aria-label={name}
        role="img"
      >
        {src ? (
          <img
            src={src}
            alt={name ?? 'Avatar'}
            css={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          initials || <span aria-hidden="true">👤</span>
        )}
        {status && (
          <span
            css={css`
              position: absolute;
              right: 4px;
              bottom: 4px;
              width: ${Math.max(6, Math.round(dimension / 4))}px;
              height: ${Math.max(6, Math.round(dimension / 4))}px;
              border-radius: 50%;
              border: 2px solid ${gcDashColor.surface};
              background: ${statusColor[status]};
            `}
            aria-hidden="true"
          />
        )}
      </span>
      {showMeta && (name || description) && (
        <span
          css={css`
            display: flex;
            flex-direction: column;
            gap: 2px;
          `}
        >
          {name && (
            <strong
              css={css`
                font-size: 15px;
                font-weight: 600;
                color: ${gcDashColor.textPrimary};
              `}
            >
              {name}
            </strong>
          )}
          {description && (
            <span
              css={css`
                font-size: 13px;
                color: ${gcDashColor.textMuted};
              `}
            >
              {description}
            </span>
          )}
        </span>
      )}
    </div>
  );
};
