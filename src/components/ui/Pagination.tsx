import React from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  showNavigation?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  testId?: string;
}

const paginationStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4) 0;
  
  @media (max-width: 768px) {
    gap: var(--space-1);
  }
`;

const pageButtonStyles = css`
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-neutral-300);
  background: var(--color-neutral-0);
  color: var(--color-neutral-700);
  border-radius: var(--radius-medium);
  cursor: pointer;
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-all);
  
  &:hover:not(:disabled) {
    background: var(--color-neutral-100);
    border-color: var(--color-neutral-400);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &[data-current="true"] {
    background: var(--color-primary-500);
    color: white;
    border-color: var(--color-primary-500);
    
    &:hover {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
    }
  }
  
  /* Dark theme styles */
  .theme-dark & {
    background: var(--color-neutral-800);
    color: var(--color-neutral-300);
    border-color: var(--color-neutral-600);
    
    &:hover:not(:disabled) {
      background: var(--color-neutral-700);
      border-color: var(--color-neutral-500);
    }
    
    &[data-current="true"] {
      background: var(--color-primary-600);
      border-color: var(--color-primary-600);
      
      &:hover {
        background: var(--color-primary-500);
        border-color: var(--color-primary-500);
      }
    }
  }
  
  @media (max-width: 768px) {
    min-width: 36px;
    height: 36px;
    font-size: var(--font-size-caption);
  }
`;

const ellipsisStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  color: var(--color-neutral-600);
  font-weight: var(--font-weight-medium);
  
  .theme-dark & {
    color: var(--color-neutral-400);
  }
  
  @media (max-width: 768px) {
    min-width: 36px;
    height: 36px;
    font-size: var(--font-size-caption);
  }
`;

const navigationStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  .nav-text {
    font-size: var(--font-size-body-small);
    color: var(--color-neutral-600);
    
    .theme-dark & {
      color: var(--color-neutral-400);
    }
  }
  
  @media (max-width: 768px) {
    gap: var(--space-2);
    
    .nav-text {
      display: none;
    }
  }
`;

const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | 'ellipsis')[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(1);

  if (currentPage <= halfVisible + 1) {
    // Show pages from 2 to maxVisible - 1
    for (let i = 2; i < maxVisible; i++) {
      pages.push(i);
    }
    if (totalPages > maxVisible - 1) {
      pages.push('ellipsis');
    }
  } else if (currentPage >= totalPages - halfVisible) {
    // Show ellipsis and last few pages
    pages.push('ellipsis');
    for (let i = totalPages - maxVisible + 3; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show ellipsis, current page area, ellipsis
    pages.push('ellipsis');
    for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 7,
  showNavigation = true,
  size = 'medium',
  className,
  testId,
  ...props
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = showPageNumbers 
    ? generatePageNumbers(currentPage, totalPages, maxVisiblePages)
    : [];

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      css={paginationStyles}
      className={clsx('gen-pagination', className)}
      data-testid={testId}
      aria-label="Pagination navigation"
      {...props}
    >
      {showNavigation && (
        <div css={navigationStyles}>
          <motion.button
            css={pageButtonStyles}
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            whileHover={canGoPrevious ? { scale: 1.05 } : undefined}
            whileTap={canGoPrevious ? { scale: 0.95 } : undefined}
            aria-label="Go to previous page"
            data-testid={`${testId}-previous`}
          >
            <ChevronLeft size={16} />
            <span className="nav-text">Back</span>
          </motion.button>
        </div>
      )}

      {showPageNumbers && (
        <div css={css`display: flex; align-items: center; gap: var(--space-1);`}>
          {pageNumbers.map((pageNum, index) => (
            pageNum === 'ellipsis' ? (
              <div
                key={`ellipsis-${index}`}
                css={ellipsisStyles}
                aria-hidden="true"
              >
                ...
              </div>
            ) : (
              <motion.button
                key={pageNum}
                css={pageButtonStyles}
                onClick={() => onPageChange(pageNum)}
                data-current={pageNum === currentPage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Go to page ${pageNum}`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
                data-testid={`${testId}-page-${pageNum}`}
              >
                {pageNum}
              </motion.button>
            )
          ))}
        </div>
      )}

      {showNavigation && (
        <div css={navigationStyles}>
          <motion.button
            css={pageButtonStyles}
            onClick={handleNext}
            disabled={!canGoNext}
            whileHover={canGoNext ? { scale: 1.05 } : undefined}
            whileTap={canGoNext ? { scale: 0.95 } : undefined}
            aria-label="Go to next page"
            data-testid={`${testId}-next`}
          >
            <span className="nav-text">Next</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      )}
    </nav>
  );
};

// Alternative dot-style pagination (like in the mockup)
export const DotPagination: React.FC<Omit<PaginationProps, 'showPageNumbers' | 'maxVisiblePages'>> = ({
  currentPage,
  totalPages,
  onPageChange,
  showNavigation = true,
  className,
  testId,
  ...props
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const dotStyles = css`
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-neutral-300);
    cursor: pointer;
    transition: var(--transition-all);
    
    &:hover {
      background: var(--color-neutral-400);
    }
    
    &[data-current="true"] {
      background: var(--color-primary-500);
      
      &:hover {
        background: var(--color-primary-600);
      }
    }
    
    .theme-dark & {
      background: var(--color-neutral-600);
      
      &:hover {
        background: var(--color-neutral-500);
      }
      
      &[data-current="true"] {
        background: var(--color-primary-400);
        
        &:hover {
          background: var(--color-primary-500);
        }
      }
    }
  `;

  const navLinkStyles = css`
    font-size: var(--font-size-body-small);
    color: var(--color-primary-500);
    text-decoration: none;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    
    &:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }
    
    &:disabled,
    &[data-disabled="true"] {
      color: var(--color-neutral-400);
      cursor: not-allowed;
      text-decoration: none;
    }
    
    .theme-dark & {
      color: var(--color-primary-400);
      
      &:hover {
        color: var(--color-primary-300);
      }
      
      &:disabled,
      &[data-disabled="true"] {
        color: var(--color-neutral-600);
      }
    }
  `;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      css={[paginationStyles, css`justify-content: space-between; max-width: 400px; margin: 0 auto;`]}
      className={clsx('gen-dot-pagination', className)}
      data-testid={testId}
      aria-label="Pagination navigation"
      {...props}
    >
      {showNavigation && (
        <button
          css={[css`background: none; border: none; padding: 0;`, navLinkStyles]}
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          data-disabled={!canGoPrevious}
          aria-label="Go to previous page"
          data-testid={`${testId}-previous`}
        >
          Back
        </button>
      )}

      <div css={css`display: flex; align-items: center; gap: var(--space-2);`}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <motion.button
            key={pageNum}
            css={[css`background: none; border: none; padding: var(--space-1);`, dotStyles]}
            onClick={() => onPageChange(pageNum)}
            data-current={pageNum === currentPage}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to page ${pageNum}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
            data-testid={`${testId}-dot-${pageNum}`}
          />
        ))}
      </div>

      {showNavigation && (
        <button
          css={[css`background: none; border: none; padding: 0;`, navLinkStyles]}
          onClick={handleNext}
          disabled={!canGoNext}
          data-disabled={!canGoNext}
          aria-label="Go to next page"
          data-testid={`${testId}-next`}
        >
          Next
        </button>
      )}
    </nav>
  );
};

Pagination.displayName = 'Pagination';
DotPagination.displayName = 'DotPagination';