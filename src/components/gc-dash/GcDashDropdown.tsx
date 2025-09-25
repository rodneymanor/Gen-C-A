import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { gcDashColor, gcDashShape, gcDashSpacing } from './styleUtils';

export interface GcDashDropdownOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type GcDashDropdownAlign = 'start' | 'end';

export interface GcDashDropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  label: string;
  placeholder?: React.ReactNode;
  options: GcDashDropdownOption[];
  selectedValue?: string;
  defaultValue?: string;
  onSelect?: (value: string, option: GcDashDropdownOption) => void;
  disabled?: boolean;
  align?: GcDashDropdownAlign;
  maxVisibleOptions?: number;
  closeOnSelect?: boolean;
}

const OPTION_HEIGHT = 40;

export const GcDashDropdown: React.FC<GcDashDropdownProps> = ({
  label,
  placeholder = 'Select…',
  options,
  selectedValue,
  defaultValue,
  onSelect,
  disabled,
  align = 'start',
  maxVisibleOptions = 6,
  closeOnSelect = true,
  className,
  ...props
}) => {
  const triggerId = useId();
  const listboxId = `${triggerId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isControlled = typeof selectedValue !== 'undefined';
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const startIndex = options.findIndex((option) => option.value === (selectedValue ?? defaultValue));
    return startIndex >= 0 ? startIndex : 0;
  });

  const resolvedValue = isControlled ? selectedValue : internalValue;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === resolvedValue),
    [options, resolvedValue]
  );

  const openDropdown = useCallback(() => {
    if (disabled || isOpen) return;
    const nextIndex = options.findIndex((option) => option.value === resolvedValue);
    setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    setIsOpen(true);
  }, [disabled, isOpen, options, resolvedValue]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      closeDropdown();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeDropdown();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    if (!isOpen) return;
    const listNode = listRef.current;
    if (!listNode) return;

    const activeOption = listNode.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    activeOption?.focus();
  }, [isOpen, activeIndex]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const nextIndex = options.findIndex((option) => option.value === resolvedValue);
        setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
      }
      return next;
    });
  };

  const handleSelect = useCallback(
    (option: GcDashDropdownOption) => {
      if (option.disabled) return;
      if (!isControlled) {
        setInternalValue(option.value);
      }
      onSelect?.(option.value, option);
      if (closeOnSelect) {
        closeDropdown();
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    },
    [closeOnSelect, closeDropdown, isControlled, onSelect]
  );

  const navigate = (direction: 1 | -1) => {
    setActiveIndex((current) => {
      let nextIndex = current;
      for (let i = 0; i < options.length; i += 1) {
        nextIndex = (nextIndex + direction + options.length) % options.length;
        if (!options[nextIndex]?.disabled) {
          break;
        }
      }
      return nextIndex;
    });
  };

  const handleTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        openDropdown();
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        handleToggle();
        break;
      }
      default:
    }
  };

  const handleOptionKeyDown: React.KeyboardEventHandler<HTMLLIElement> = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        navigate(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        navigate(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) {
          handleSelect(option);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        closeDropdown();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        closeDropdown();
        break;
      default:
    }
  };

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setViewportHeight(window.innerHeight);

    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const calculatedHeight = options.length * OPTION_HEIGHT;
  const viewportMax = viewportHeight ? Math.max(OPTION_HEIGHT * 3, viewportHeight * 0.6) : Infinity;
  const menuHeight = Math.min(calculatedHeight, viewportMax);
  const triggerLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div
      className={clsx('gc-dash-dropdown', className)}
      css={css`
        position: relative;
        width: 100%;
      `}
      {...props}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        css={css`
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: ${gcDashSpacing.xs};
          padding: 8px 12px;
          min-height: 36px;
          background: transparent;
          border: 1px solid rgba(9, 30, 66, 0.18);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: ${gcDashColor.textPrimary};
          transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          text-align: left;
          --focus-ring-primary: none;
          --focus-visible-offset: 0;

          &:hover:not(:disabled) {
            background: rgba(9, 30, 66, 0.06);
            border-color: rgba(9, 30, 66, 0.26);
          }

          &:focus-visible {
            outline: none;
            border-color: ${gcDashColor.primary};
            background: rgba(11, 92, 255, 0.08);
          }

          &:disabled {
            opacity: 0.5;
          }
        `}
      >
        <span
          css={css`
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            color: ${selectedOption ? gcDashColor.textPrimary : gcDashColor.textMuted};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          `}
        >
          {triggerLabel}
        </span>
        <span
          aria-hidden="true"
          css={css`
            display: inline-flex;
            align-items: center;
            color: rgba(9, 30, 66, 0.55);
            transition: transform 0.16s ease;
            transform: rotate(${isOpen ? '180deg' : '0deg'});
          `}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 6l3.5 3.5L11.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          id={listboxId}
          tabIndex={-1}
          aria-labelledby={triggerId}
          css={css`
            position: absolute;
            ${align === 'end' ? 'right: 0;' : 'left: 0;'}
            top: calc(100% + 6px);
            min-width: 100%;
            max-height: ${menuHeight}px;
            overflow-y: auto;
            background: ${gcDashColor.surface};
            border: 1px solid rgba(9, 30, 66, 0.16);
            border-radius: 12px;
            box-shadow: none;
            padding: 6px;
            margin: 0;
            list-style: none;
            z-index: 20;
            backdrop-filter: blur(18px);
            animation: dropdown-in 0.14s ease-out;

            @keyframes dropdown-in {
              from {
                opacity: 0;
                transform: translateY(-4px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        >
          {options.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.value === resolvedValue;

            return (
              <li
                key={option.value}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                tabIndex={-1}
                onKeyDown={handleOptionKeyDown}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                onClick={() => handleSelect(option)}
                css={css`
                  display: grid;
                  grid-template-columns: minmax(0, 1fr) auto;
                  align-items: center;
                  gap: 8px;
                  padding: 6px 8px;
                  border-radius: 8px;
                  cursor: ${option.disabled ? 'not-allowed' : 'pointer'};
                  color: ${option.disabled ? 'rgba(9, 30, 66, 0.45)' : gcDashColor.textPrimary};
                  transition: background 0.12s ease, color 0.12s ease;
                  background: ${isActive ? 'rgba(9, 30, 66, 0.08)' : 'transparent'};
                  opacity: ${option.disabled ? 0.5 : 1};

                  &:focus-visible {
                    outline: none;
                  }
                `}
              >
                <span
                  css={css`
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                  `}
                >
                  {option.icon && (
                    <span
                      aria-hidden="true"
                      css={css`
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 20px;
                        height: 20px;
                        color: rgba(9, 30, 66, 0.6);
                      `}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span
                    css={css`
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
                      min-width: 0;
                    `}
                  >
                    <span
                      css={css`
                        font-weight: 500;
                        color: ${gcDashColor.textPrimary};
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                      `}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span
                        css={css`
                          font-size: 12px;
                          color: rgba(9, 30, 66, 0.6);
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        `}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  css={css`
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                    min-width: 0;
                    color: rgba(9, 30, 66, 0.45);
                    font-size: 12px;
                  `}
                >
                  {isSelected ? (
                    <svg
                      aria-hidden="true"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6.5l1.8 1.8L9 4.1"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    option.meta ?? ''
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

GcDashDropdown.displayName = 'GcDashDropdown';
