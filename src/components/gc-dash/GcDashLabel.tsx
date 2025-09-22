import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashShape, gcDashSpacing } from './styleUtils';

export type GcDashLabelTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type GcDashLabelVariant = 'solid' | 'soft' | 'outline';

export interface GcDashLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: GcDashLabelTone;
  variant?: GcDashLabelVariant;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  uppercase?: boolean;
  interactive?: boolean;
}

const toneStyles: Record<GcDashLabelTone, {
  text: string;
  softBg: string;
  outline: string;
  solidText: string;
}> = {
  neutral: {
    text: gcDashColor.textSecondary,
    softBg: 'rgba(9, 30, 66, 0.1)',
    outline: 'rgba(9, 30, 66, 0.26)',
    solidText: gcDashColor.surface,
  },
  primary: {
    text: gcDashColor.primary,
    softBg: 'rgba(11, 92, 255, 0.12)',
    outline: 'rgba(11, 92, 255, 0.35)',
    solidText: gcDashColor.surface,
  },
  success: {
    text: gcDashColor.success,
    softBg: 'rgba(0, 134, 83, 0.12)',
    outline: 'rgba(0, 134, 83, 0.35)',
    solidText: gcDashColor.surface,
  },
  warning: {
    text: gcDashColor.warning,
    softBg: 'rgba(255, 139, 0, 0.14)',
    outline: 'rgba(255, 139, 0, 0.35)',
    solidText: gcDashColor.surface,
  },
  danger: {
    text: gcDashColor.danger,
    softBg: 'rgba(191, 38, 0, 0.14)',
    outline: 'rgba(191, 38, 0, 0.35)',
    solidText: gcDashColor.surface,
  },
  info: {
    text: gcDashColor.info,
    softBg: 'rgba(0, 82, 204, 0.14)',
    outline: 'rgba(0, 82, 204, 0.35)',
    solidText: gcDashColor.surface,
  },
};

export const GcDashLabel: React.FC<GcDashLabelProps> = ({
  tone = 'neutral',
  variant = 'soft',
  leadingIcon,
  trailingIcon,
  uppercase = true,
  interactive = false,
  className,
  children,
  onKeyDown,
  ...props
}) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.currentTarget.click();
    }
    onKeyDown?.(event);
  };
  const palette = toneStyles[tone];
  const background =
    variant === 'soft'
      ? palette.softBg
      : variant === 'solid'
      ? palette.text
      : 'transparent';
  const color = variant === 'solid' ? palette.solidText : palette.text;
  const border = variant === 'outline' ? `1px solid ${palette.outline}` : '1px solid transparent';

  return (
    <span
      className={clsx('gc-dash-label', className)}
      role={interactive ? 'button' : undefined}
      onKeyDown={handleKeyDown}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: ${gcDashSpacing.xs};
        padding: 4px 12px;
        border-radius: ${gcDashShape.radiusSm};
        font-size: 12px;
        font-weight: 600;
        letter-spacing: ${uppercase ? '0.08em' : 'normal'};
        text-transform: ${uppercase ? 'uppercase' : 'none'};
        color: ${color};
        background: ${background};
        border: ${border};
        transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        cursor: ${interactive ? 'pointer' : 'default'};
        user-select: none;
        white-space: nowrap;
        --focus-ring-primary: none;
        --focus-visible-offset: 0;

        &:focus-visible {
          outline: none;
          border-color: ${gcDashColor.primary};
        }

        ${interactive
          ? `
        &:hover {
          filter: brightness(0.95);
        }
      `
          : ''}
      `}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {leadingIcon && <span aria-hidden>{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span aria-hidden>{trailingIcon}</span>}
    </span>
  );
};

GcDashLabel.displayName = 'GcDashLabel';
