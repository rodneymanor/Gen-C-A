import { css } from '@emotion/react';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import MoreIcon from '@atlaskit/icon/glyph/more';
import type { ContentItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/format';
import { AGENT_PRIMARY, AGENT_TINT_20 } from '../constants/palette';

type LibraryContentItemProps = {
  item: ContentItem;
  isSelected: boolean;
  isChecked: boolean;
  isDeleting: boolean;
  onSelect: (item: ContentItem) => void;
  onCheckboxChange: (item: ContentItem, checked: boolean) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

const contentItemStyles = (isSelected: boolean, isChecked: boolean) => css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  padding-left: calc(var(--space-4) + 32px);
  border-radius: var(--radius-medium);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
  transition: var(--transition-all);
  position: relative;
  z-index: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: transparent;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, background-color 0.2s ease;
  }

  ${isSelected &&
  css`
    border-color: ${AGENT_PRIMARY};
    background: ${AGENT_TINT_20};
  `}

  &:hover {
    border-color: var(--card-hover-border);
  }

  &:hover::after {
    background: var(--card-hover-overlay);
    opacity: 1;
  }

  &:focus-visible {
    outline: none;
    border-color: var(--card-focus-border);
    box-shadow: var(--card-focus-shadow);
  }

  &:focus-visible::after {
    background: var(--card-focus-overlay);
    opacity: 1;
  }

  .checkbox-wrapper {
    position: absolute;
    top: 50%;
    left: var(--space-4);
    transform: translateY(-50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  &:hover .checkbox-wrapper,
  &:focus-within .checkbox-wrapper,
  .checkbox-wrapper:focus-within {
    opacity: 1;
    pointer-events: auto;
  }

  ${isChecked &&
  css`
    .checkbox-wrapper {
      opacity: 1;
      pointer-events: auto;
    }
  `}

  .content-checkbox {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .content-info {
    flex: 1;
    min-width: 0;

    .content-title {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-800);
      margin: 0 0 var(--space-1) 0;
      line-height: var(--line-height-normal);
    }

    .content-meta {
      font-size: var(--font-size-body-small);
      color: var(--color-neutral-500);
      line-height: var(--line-height-normal);
      margin: 0;
    }
  }

  .content-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  &:hover .content-actions,
  &:focus-within .content-actions {
    opacity: 1;
    pointer-events: auto;
  }
`;

export function LibraryContentItem({
  item,
  isSelected,
  isChecked,
  isDeleting,
  onSelect,
  onCheckboxChange,
  onEdit,
  onDelete,
}: LibraryContentItemProps) {
  return (
    <div
      css={contentItemStyles(isSelected, isChecked)}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
    >
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          className="content-checkbox"
          checked={isChecked}
          onChange={(event) => {
            event.stopPropagation();
            onCheckboxChange(item, event.target.checked);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      <div className="content-info">
        <h3 className="content-title">{item.title}</h3>
        <p className="content-meta">Added {formatRelativeTime(item.created)}</p>
      </div>

      <div
        className="content-actions"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenu
          placement="bottom-end"
          trigger={({ triggerRef, ...triggerProps }) => {
            const { onClick, onKeyDown, ...restProps } = triggerProps as React.ComponentProps<'button'>;

            return (
              <Button
                {...restProps}
                ref={triggerRef}
                variant="subtle"
                size="small"
                iconBefore={<MoreIcon label="More options" />}
                aria-label="More actions"
                css={css`
                  min-height: 32px;
                  height: 32px;
                  width: 32px;
                  border-radius: 8px;
                  background: var(--color-neutral-100);

                  &:hover {
                    background: var(--color-neutral-200);
                  }
                `}
                onClick={(event) => {
                  event.stopPropagation();
                  onClick?.(event);
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  onKeyDown?.(event);
                }}
              />
            );
          }}
        >
          <DropdownItemGroup>
            <DropdownItem onClick={() => onEdit(item)}>Edit</DropdownItem>
          </DropdownItemGroup>
          <DropdownItemGroup>
            <DropdownItem isDisabled={isDeleting} onClick={() => onDelete(item)}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </DropdownItem>
          </DropdownItemGroup>
        </DropdownMenu>
      </div>
    </div>
  );
}
