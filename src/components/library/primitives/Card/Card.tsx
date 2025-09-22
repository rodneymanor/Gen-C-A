import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  appearance?: 'subtle' | 'raised' | 'elevated' | 'selected';
  spacing?: 'compact' | 'default' | 'comfortable';
  isHoverable?: boolean;
  isClickable?: boolean;
  testId?: string;
}

const getCardStyles = (
  appearance: CardProps['appearance'],
  spacing: CardProps['spacing'],
  isHoverable: boolean,
  isClickable: boolean
) => {
  const allowHover = isHoverable || isClickable;

  return css`
    background: var(--card-bg);
    border-radius: var(--card-radius);
    transition: var(--transition-all);
    position: relative;
    display: block;
    width: 100%;
    z-index: 0;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: transparent;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }

    /* Spacing variants */
    ${spacing === 'compact' && css`
      padding: var(--space-3);
    `}

    ${spacing === 'default' && css`
      padding: var(--space-4);
    `}

    ${spacing === 'comfortable' && css`
      padding: var(--space-6);
    `}

    /* Appearance variants */
    ${appearance === 'subtle' && css`
      border: 1px solid var(--card-border);
      box-shadow: none;
      background: var(--color-neutral-50);
    `}

    ${appearance === 'raised' && css`
      border: 1px solid var(--card-border);
      box-shadow: var(--card-shadow);
    `}

    ${appearance === 'elevated' && css`
      border: 1px solid var(--card-border);
      box-shadow: var(--shadow-elevated);
    `}

    ${appearance === 'selected' && css`
      border: 2px solid var(--color-primary-500);
      box-shadow: var(--shadow-primary);
      background: var(--color-primary-50);
    `}

    /* Interactive states */
    ${isClickable && css`
      cursor: pointer;

      &:focus-visible {
        outline: none;
        border-color: var(--card-focus-border);
        box-shadow: var(--card-focus-shadow);
      }

      &:focus-visible::before {
        background: var(--card-focus-overlay);
        opacity: 1;
      }
    `}

    ${allowHover && css`
      &:hover {
        border-color: var(--card-hover-border);
        box-shadow: var(--card-hover-shadow);
      }

      &:hover::before {
        background: var(--card-hover-overlay);
        opacity: 1;
      }
    `}

    /* Ensure proper focus management */
    &[tabindex]:focus-visible {
      outline: none;
      border-color: var(--card-focus-border);
      box-shadow: var(--card-focus-shadow);
    }

    &[tabindex]:focus-visible::before {
      background: var(--card-focus-overlay);
      opacity: 1;
    }
  `;
};

const cardHeaderStyles = css`
  margin-bottom: var(--space-4);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const cardContentStyles = css`
  flex: 1;
`;

const cardFooterStyles = css`
  margin-top: var(--space-4);
  
  &:first-child {
    margin-top: 0;
  }
`;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  children,
  appearance = 'raised',
  spacing = 'default',
  isHoverable = false,
  isClickable = false,
  testId,
  className,
  onClick,
  ...props
}, ref) => {
  const computedClickable = isClickable || Boolean(onClick);

  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileHover: isHoverable ? { y: -4 } : undefined,
    whileTap: computedClickable ? { scale: 0.98 } : undefined,
  };

  // Separate motion-specific props from HTML div props
  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDrag,
    onDragEnd,
    ...divProps
  } = props;

  return (
    <motion.div
      ref={ref}
      css={getCardStyles(appearance, spacing, isHoverable, computedClickable)}
      className={clsx('gen-card', className)}
      onClick={onClick}
      data-testid={testId}
      tabIndex={computedClickable ? 0 : undefined}
      role={computedClickable ? 'button' : undefined}
      onKeyDown={computedClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as any);
        }
      } : undefined}
      {...motionProps}
      {...divProps}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

// Card sub-components
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div css={cardHeaderStyles} className={clsx('gen-card-header', className)}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div css={cardContentStyles} className={clsx('gen-card-content', className)}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div css={cardFooterStyles} className={clsx('gen-card-footer', className)}>
    {children}
  </div>
);
