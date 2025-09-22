import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor } from './styleUtils';

export interface GcDashPlanChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  planName: string;
  info?: string;
  highlighted?: boolean;
}

export const GcDashPlanChip: React.FC<GcDashPlanChipProps> = ({
  planName,
  info,
  highlighted = false,
  className,
  ...props
}) => (
  <span
    className={clsx('gc-dash-plan-chip', className)}
    css={css`
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid ${highlighted ? gcDashColor.primary : 'rgba(9, 30, 66, 0.18)'};
      background: ${highlighted ? 'rgba(11, 92, 255, 0.08)' : 'transparent'};
      color: ${gcDashColor.textPrimary};
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    `}
    {...props}
  >
    <span>{planName}</span>
    {info && (
      <span
        css={css`
          font-size: 12px;
          font-weight: 500;
          color: rgba(9, 30, 66, 0.6);
        `}
      >
        {info}
      </span>
    )}
  </span>
);

GcDashPlanChip.displayName = 'GcDashPlanChip';
