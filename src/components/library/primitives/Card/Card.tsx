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
) => css`
  background: var(--card-bg);
  border-radius: var(--card-radius);
  transition: var(--transition-all);
  position: relative;
  display: block;
  width: 100%;
  
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
      box-shadow: var(--focus-ring);
    }
  `}
  
  ${isHoverable && css`
    &:hover {
      box-shadow: var(--shadow-elevated);
      transform: translateY(-2px);
      
      ${appearance === 'elevated' && css`
        box-shadow: var(--shadow-modal);
      `}
    }
  `}
  
  /* Ensure proper focus management */
  &[tabindex]:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

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
  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileHover: isHoverable ? { y: -4 } : undefined,
    whileTap: isClickable ? { scale: 0.98 } : undefined,
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
      css={getCardStyles(appearance, spacing, isHoverable, isClickable)}
      className={clsx('gen-card', className)}
      onClick={onClick}
      data-testid={testId}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onKeyDown={isClickable ? (e) => {
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