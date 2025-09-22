import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';

export interface GcDashTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: 'default' | 'success' | 'warning' | 'error';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const toneBorder: Record<Required<GcDashTextAreaProps>['tone'], string> = {
  default: `1px solid ${gcDashColor.border}`,
  success: `1px solid ${gcDashColor.success}`,
  warning: `1px solid ${gcDashColor.warning}`,
  error: `1px solid ${gcDashColor.danger}`,
};

export const GcDashTextArea = forwardRef<HTMLTextAreaElement, GcDashTextAreaProps>(
  ({ tone = 'default', resize = 'vertical', style, ...props }, ref) => (
    <textarea
      ref={ref}
      {...props}
      css={css`
        width: 100%;
        min-height: 120px;
        border-radius: ${gcDashShape.radiusMd};
        border: ${toneBorder[tone]};
        padding: ${gcDashSpacing.md};
        background: ${gcDashColor.surface};
        font-size: 15px;
        line-height: 1.5;
        color: ${gcDashColor.textPrimary};
        resize: ${resize};
        transition: ${gcDashMotion.transition};
        --focus-ring-primary: none;
        --focus-visible-offset: 0;

        &::placeholder {
          color: ${gcDashColor.textMuted};
        }

        &:hover {
          border-color: ${gcDashColor.borderStrong};
        }

        &:focus-visible {
          outline: none;
          border-color: ${gcDashColor.primary};
          background: ${gcDashColor.cardHoverBackground};
        }

        &:disabled {
          background: rgba(9, 30, 66, 0.04);
          cursor: not-allowed;
        }
      `}
      style={style}
    />
  )
);

GcDashTextArea.displayName = 'GcDashTextArea';
