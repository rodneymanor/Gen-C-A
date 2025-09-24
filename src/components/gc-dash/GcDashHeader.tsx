import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import SearchIcon from '@atlaskit/icon/glyph/search';

import { Input, type InputProps } from '@/components/ui/Input';
import { gcDashSpacing } from './styleUtils';

const headerRootStyles = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${gcDashSpacing.sm};
`;

const topRowStyles = css`
  display: flex;
  align-items: center;
  gap: ${gcDashSpacing.lg};
  flex-wrap: wrap;
`;

const leadingGroupStyles = css`
  display: inline-flex;
  align-items: center;
  gap: ${gcDashSpacing.md};
  flex-wrap: wrap;
`;

const toolbarBaseStyles = css`
  display: flex;
  align-items: center;
  gap: ${gcDashSpacing.sm};
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 720px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const toolbarExpandedStyles = css`
  flex: 1 1 360px;
  min-width: 280px;

  @media (max-width: 720px) {
    flex-basis: 100%;
    min-width: 0;
  }
`;

const searchContainerStyles = css`
  flex: 1 1 320px;
  min-width: 240px;

  @media (max-width: 720px) {
    flex-basis: 100%;
    min-width: 0;
  }
`;

const actionsContainerStyles = css`
  display: inline-flex;
  align-items: center;
  gap: ${gcDashSpacing.xs};
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 720px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const secondaryRowStyles = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${gcDashSpacing.sm};
  width: 100%;
`;

const searchFormStyles = css`
  width: 100%;
`;

export interface GcDashHeaderProps extends React.HTMLAttributes<HTMLElement> {
  leading?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
}

export const GcDashHeader: React.FC<GcDashHeaderProps> = ({
  leading,
  search,
  actions,
  children,
  className,
  ...rest
}) => {
  const hasToolbar = Boolean(search) || Boolean(actions);

  return (
    <header className={clsx('gc-dash-header', className)} css={headerRootStyles} {...rest}>
      <div css={topRowStyles}>
        {leading && <div css={leadingGroupStyles}>{leading}</div>}
        {hasToolbar && (
          <div css={[toolbarBaseStyles, search && toolbarExpandedStyles]}>
            {search && <div css={searchContainerStyles}>{search}</div>}
            {actions && <div css={actionsContainerStyles}>{actions}</div>}
          </div>
        )}
      </div>
      {children && <div css={secondaryRowStyles}>{children}</div>}
    </header>
  );
};

GcDashHeader.displayName = 'GcDashHeader';

type HeaderInputProps = Partial<Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'size'>> & {
  onChange?: InputProps['onChange'];
};

export interface GcDashHeaderSearchInputProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  size?: InputProps['size'];
  onValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  ariaLabel?: string;
  inputProps?: HeaderInputProps;
}

export const GcDashHeaderSearchInput = React.forwardRef<HTMLInputElement, GcDashHeaderSearchInputProps>(
  (
    {
      placeholder = 'Search the dashboard',
      value,
      defaultValue = '',
      size = 'small',
      onValueChange,
      onSearch,
      ariaLabel,
      inputProps,
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    React.useEffect(() => {
      if (!isControlled) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const currentValue = isControlled ? value : internalValue;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(event.target.value);
      }
      onValueChange?.(event.target.value);
      inputProps?.onChange?.(event);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearch?.(currentValue ?? '');
    };

    const {
      onChange: _ignoredOnChange,
      iconBefore,
      fullWidth,
      ...restInputProps
    } = inputProps ?? {};

    const mergedInputProps: HeaderInputProps & {
      ['aria-label']?: string;
      enterKeyHint?: string;
      type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
    } = { ...restInputProps };

    if (ariaLabel && mergedInputProps['aria-label'] === undefined) {
      mergedInputProps['aria-label'] = ariaLabel;
    }
    if (!mergedInputProps.enterKeyHint) {
      mergedInputProps.enterKeyHint = 'search';
    }
    if (!mergedInputProps.type) {
      mergedInputProps.type = 'search';
    }

    return (
      <form css={searchFormStyles} role="search" onSubmit={handleSubmit}>
        <Input
          ref={ref}
          placeholder={placeholder}
          value={currentValue}
          onChange={handleChange}
          size={size}
          iconBefore={iconBefore ?? <SearchIcon label="Search" size="small" />}
          fullWidth={fullWidth ?? true}
          {...mergedInputProps}
        />
      </form>
    );
  }
);

GcDashHeaderSearchInput.displayName = 'GcDashHeaderSearchInput';
