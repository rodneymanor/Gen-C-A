import React from 'react';
import { css } from '@emotion/react';
import { gcDashColor, gcDashMotion, gcDashShape, gcDashSpacing } from './styleUtils';
import { GcDashButton } from './GcDashButton';
import { GcDashInput } from './GcDashInput';

export interface GcDashSearchBarProps extends React.FormHTMLAttributes<HTMLFormElement> {
  placeholder?: string;
  onSubmitSearch?: (value: string) => void;
  defaultValue?: string;
  submitLabel?: string;
  filters?: React.ReactNode;
}

export const GcDashSearchBar: React.FC<GcDashSearchBarProps> = ({
  placeholder = 'Search',
  onSubmitSearch,
  defaultValue = '',
  submitLabel = 'Search',
  filters,
  className,
  ...rest
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { onSubmit, ...formProps } = rest;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    onSubmit?.(event);
    event.preventDefault();
    if (onSubmitSearch) {
      onSubmitSearch(inputRef.current?.value ?? '');
    }
  };

  return (
    <form
      className={className}
      css={css`
        display: flex;
        align-items: center;
        gap: ${gcDashSpacing.sm};
        background: ${gcDashColor.surface};
        border-radius: ${gcDashShape.radiusLg};
        padding: ${gcDashSpacing.sm};
        border: 1px solid ${gcDashColor.border};
        box-shadow: 0 2px 12px rgba(9, 30, 66, 0.06);
      `}
      onSubmit={handleSubmit}
      {...formProps}
    >
      <GcDashInput
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        leadingIcon={<span aria-hidden="true">🔍</span>}
        style={{ flex: 1 }}
      />
      {filters && (
        <div
          css={css`
            display: inline-flex;
            gap: ${gcDashSpacing.xs};
            align-items: center;
          `}
        >
          {filters}
        </div>
      )}
      <GcDashButton type="submit" variant="primary">
        {submitLabel}
      </GcDashButton>
    </form>
  );
};
