import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';

export interface GridProps {
  children: React.ReactNode;
  columns?: number | string | { sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
  gap?: 'small' | 'medium' | 'large' | 'xlarge';
  minItemWidth?: string;
  align?: 'start' | 'end' | 'center' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  className?: string;
  role?: string;
  'aria-label'?: string;
  testId?: string;
}

const getGridStyles = (
  columns: GridProps['columns'],
  gap: GridProps['gap'],
  minItemWidth: string | undefined,
  align: GridProps['align'],
  justify: GridProps['justify']
) => css`
  display: grid;
  
  /* Gap variants */
  ${gap === 'small' && css`gap: var(--space-2);`}
  ${gap === 'medium' && css`gap: var(--space-4);`}
  ${gap === 'large' && css`gap: var(--space-6);`}
  ${gap === 'xlarge' && css`gap: var(--space-8);`}
  
  /* Column layouts */
  ${typeof columns === 'number' && css`
    grid-template-columns: repeat(${columns}, 1fr);
  `}
  
  ${typeof columns === 'string' && css`
    grid-template-columns: ${columns};
  `}
  
  ${minItemWidth && css`
    grid-template-columns: repeat(auto-fit, minmax(${minItemWidth}, 1fr));
  `}
  
  ${typeof columns === 'object' && columns && css`
    /* Default to 1 column on mobile */
    grid-template-columns: 1fr;
    
    /* Small screens (640px+) */
    ${columns.sm && css`
      @media (min-width: 640px) {
        grid-template-columns: ${typeof columns.sm === 'number' ? `repeat(${columns.sm}, 1fr)` : columns.sm};
      }
    `}
    
    /* Medium screens (768px+) */
    ${columns.md && css`
      @media (min-width: 768px) {
        grid-template-columns: ${typeof columns.md === 'number' ? `repeat(${columns.md}, 1fr)` : columns.md};
      }
    `}
    
    /* Large screens (1024px+) */
    ${columns.lg && css`
      @media (min-width: 1024px) {
        grid-template-columns: ${typeof columns.lg === 'number' ? `repeat(${columns.lg}, 1fr)` : columns.lg};
      }
    `}
    
    /* Extra large screens (1280px+) */
    ${columns.xl && css`
      @media (min-width: 1280px) {
        grid-template-columns: ${typeof columns.xl === 'number' ? `repeat(${columns.xl}, 1fr)` : columns.xl};
      }
    `}
  `}
  
  /* Alignment */
  ${align && css`
    align-items: ${align};
  `}
  
  ${justify && css`
    justify-content: ${justify};
  `}
`;

export const Grid: React.FC<GridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 'medium',
  minItemWidth,
  align,
  justify,
  className,
  role = 'grid',
  'aria-label': ariaLabel,
  testId,
  ...props
}) => {
  return (
    <div
      css={getGridStyles(columns, gap, minItemWidth, align, justify)}
      className={clsx('gen-grid', className)}
      role={role}
      aria-label={ariaLabel}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
};

// Specialized Grid variants for common use cases
export const VideoGrid: React.FC<Omit<GridProps, 'columns' | 'minItemWidth'>> = (props) => (
  <Grid 
    columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    minItemWidth="280px"
    {...props}
  />
);

export const CollectionGrid: React.FC<Omit<GridProps, 'columns' | 'minItemWidth'>> = (props) => (
  <Grid 
    columns={{ sm: 1, md: 2, lg: 3 }}
    minItemWidth="300px"
    {...props}
  />
);

export const DashboardGrid: React.FC<GridProps> = (props) => (
  <Grid 
    columns={{ sm: 1, lg: 2 }}
    gap="large"
    {...props}
  />
);

Grid.displayName = 'Grid';