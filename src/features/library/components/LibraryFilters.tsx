import { css } from '@emotion/react';
import SearchIcon from '@atlaskit/icon/glyph/search';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AGENT_PRIMARY, AGENT_PRIMARY_HOVER, AGENT_TINT_20 } from '../constants/palette';
import type { ContentType, LibraryFilter } from '../types';

const filtersStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .search-container {
    flex: 1;
    max-width: 400px;
    display: flex;
    align-items: center;

    .gen-input {
      background: var(--color-neutral-100);
      border-color: transparent;
      border-radius: 16px;
      --input-border-focus: ${AGENT_PRIMARY};
    }

    @media (max-width: 768px) {
      max-width: none;
    }
  }

  .quick-filters {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }
`;

type LibraryFiltersProps = {
  filters: LibraryFilter[];
  activeFilter: ContentType;
  onFilterChange: (filter: ContentType) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function LibraryFilters({
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: LibraryFiltersProps) {
  return (
    <div css={filtersStyles}>
      <div className="search-container">
        <Input
          placeholder="Search all content..."
          iconBefore={<SearchIcon label="" />}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="quick-filters">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'secondary' : 'subtle'}
            size="small"
            onClick={() => onFilterChange(filter.key)}
            iconBefore={filter.icon}
            css={
              activeFilter === filter.key
                ? css`
                    background: transparent;
                    color: ${AGENT_PRIMARY};
                    border: var(--border-width-thin) solid ${AGENT_PRIMARY};
                    border-radius: var(--radius-medium);
                    font-weight: var(--font-weight-medium);

                    &:hover {
                      background: ${AGENT_TINT_20};
                      border-color: ${AGENT_PRIMARY_HOVER};
                    }
                  `
                : undefined
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
