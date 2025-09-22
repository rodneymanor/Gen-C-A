import React from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashSpacing, gcDashTypography } from './styleUtils';

export interface GcDashFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  layout?: 'stacked' | 'horizontal';
  labelFor?: string;
}

export const GcDashFormField: React.FC<GcDashFormFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  layout = 'stacked',
  labelFor,
  children,
  className,
  ...props
}) => (
  <div
    className={className}
    css={css`
      display: flex;
      flex-direction: ${layout === 'horizontal' ? 'row' : 'column'};
      gap: ${layout === 'horizontal' ? gcDashSpacing.lg : gcDashSpacing.xs};
      align-items: ${layout === 'horizontal' ? 'center' : 'stretch'};
      width: 100%;
    `}
    {...props}
  >
    {(label || description) && (
      <div
        css={css`
          flex: ${layout === 'horizontal' ? '0 0 220px' : 'initial'};
          display: flex;
          flex-direction: column;
          gap: 4px;
        `}
      >
        {label && (
          <label
            htmlFor={labelFor}
            css={css`
              font-weight: ${gcDashTypography.labelWeight};
              font-size: 14px;
              color: ${gcDashColor.textPrimary};
              display: inline-flex;
              align-items: baseline;
              gap: 4px;
            `}
          >
            <span>{label}</span>
            {required && (
              <span
                css={css`
                  color: ${gcDashColor.danger};
                  font-size: 12px;
                `}
              >
                *
              </span>
            )}
          </label>
        )}
        {description && (
          <p
            css={css`
              margin: 0;
              font-size: 13px;
              color: ${gcDashColor.textMuted};
            `}
          >
            {description}
          </p>
        )}
      </div>
    )}
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      `}
    >
      {children}
      {hint && !error && (
        <span
          css={css`
            font-size: 12px;
            color: ${gcDashColor.textMuted};
          `}
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          css={css`
            font-size: 12px;
            color: ${gcDashColor.danger};
          `}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  </div>
);
