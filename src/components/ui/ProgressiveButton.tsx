import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAdvancedResponsive, createProgressiveStyles } from '../../hooks/useAdvancedResponsive';
import { Button, ButtonProps } from './Button';

export interface ProgressiveButtonProps extends ButtonProps {
  adaptiveTouch?: boolean;
  respectMotionPreferences?: boolean;
  enhancedHover?: boolean;
}

const getProgressiveEnhancements = (
  viewport: ReturnType<typeof useAdvancedResponsive>,
  styles: ReturnType<typeof createProgressiveStyles>
) => css`
  /* Enhanced touch targets for touch devices */
  ${viewport.isTouchDevice && css`
    min-height: ${styles.touchTarget};
    padding: var(--space-responsive-md) var(--space-responsive-lg);
  `}
  
  /* Adaptive sizing based on viewport */
  @media (max-width: 480px) {
    min-height: 48px;
    font-size: 1rem;
    padding: var(--space-responsive-md) var(--space-responsive-lg);
  }
  
  /* Hover effects only where supported */
  ${styles.hover && css`
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }
    }
  `}
  
  /* High contrast mode support */
  ${viewport.isHighContrast && css`
    border: 2px solid currentColor;
    background: var(--color-surface);
    color: var(--color-text-primary);
    
    &:hover:not(:disabled) {
      background: var(--color-surface-elevated);
    }
  `}
  
  /* Reduced motion preference */
  ${viewport.prefersReducedMotion && css`
    transition: none;
    
    &:hover {
      transform: none;
    }
  `}
  
  /* Dark mode enhancement */
  @media (prefers-color-scheme: dark) {
    ${viewport.colorScheme === 'dark' && css`
      background-color: var(--color-surface-elevated);
      color: var(--color-text-primary);
      border-color: var(--color-border);
    `}
  }
  
  /* Safe area insets for mobile devices */
  ${viewport.isMobile && css`
    margin-left: max(0px, env(safe-area-inset-left));
    margin-right: max(0px, env(safe-area-inset-right));
  `}
  
  /* Network-aware loading states */
  ${viewport.connectionType === 'slow-2g' && css`
    /* Simplified animations for slow connections */
    animation: none;
    transition-duration: 0.1s;
  `}
  
  /* Device pixel ratio optimizations */
  ${viewport.devicePixelRatio > 2 && css`
    /* Enhanced visuals for high-DPI displays */
    box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.1);
  `}
`;

export const ProgressiveButton = forwardRef<HTMLButtonElement, ProgressiveButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  adaptiveTouch = true,
  respectMotionPreferences = true,
  enhancedHover = true,
  className,
  ...props
}, ref) => {
  const viewport = useAdvancedResponsive();
  const styles = createProgressiveStyles(viewport);
  
  // Adaptive motion props based on device capabilities
  const adaptiveMotionProps = {
    whileTap: !props.isDisabled && !props.isLoading && styles.animate ? { scale: 0.98 } : undefined,
    transition: { 
      duration: viewport.prefersReducedMotion ? 0 : 0.1,
      ease: 'easeOut'
    },
    // Disable complex animations on low-end devices or slow connections
    animate: styles.animate && styles.highPerformance,
  };

  // Determine button size based on device type
  const adaptiveSize = (() => {
    if (!adaptiveTouch) return size;
    
    if (viewport.isMobile && viewport.isTouchDevice) {
      return size === 'small' ? 'medium' : size === 'medium' ? 'large' : size;
    }
    return size;
  })();

  return (
    <motion.div
      css={getProgressiveEnhancements(viewport, styles)}
      {...(styles.animate && adaptiveMotionProps)}
    >
      <Button
        ref={ref}
        variant={variant}
        size={adaptiveSize}
        className={clsx(
          'progressive-button',
          {
            'touch-enhanced': viewport.isTouchDevice,
            'hover-effects': styles.hover && enhancedHover,
            'reduced-motion-safe': viewport.prefersReducedMotion,
            'high-contrast-enhanced': viewport.isHighContrast,
            'dark-mode-adaptive': viewport.colorScheme === 'dark',
          },
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
});

ProgressiveButton.displayName = 'ProgressiveButton';