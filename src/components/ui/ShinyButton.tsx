import React, { forwardRef } from 'react';

export interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shine?: boolean;
  variant?: 'blue' | 'white';
}

export const ShinyButton = forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, disabled, shine = true, variant = 'blue', style, ...props }, ref) => {
    const isWhite = variant === 'white';
    const background = isWhite
      ? 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,248,250,1) 100%)'
      : 'linear-gradient(180deg, rgba(11,92,255,1) 0%, rgba(11,92,255,0.9) 100%)';
    const border = isWhite
      ? '1px solid var(--color-border, #e4e6ea)'
      : '1px solid var(--color-background-brand-bold, #0B5CFF)';
    const color = isWhite
      ? 'var(--color-primary-600, #2563eb)'
      : 'var(--color-text-inverse, #ffffff)';
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={className}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 32,
          padding: '0 10px',
          borderRadius: 'var(--radius-large, 12px)',
          border,
          color,
          background,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
        {...props}
      >
        {shine && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: -80,
              width: 80,
              height: '100%',
              background:
                'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)',
              transform: 'skewX(-20deg)',
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
              animation: 'shiny-sweep 2.2s ease-in-out infinite',
            }}
          />
        )}
        {children}
        <style>{`
          @keyframes shiny-sweep {
            0% { transform: translateX(0) skewX(-20deg); }
            60% { transform: translateX(220%) skewX(-20deg); }
            100% { transform: translateX(220%) skewX(-20deg); }
          }
          button:disabled { opacity: 0.6; }
          button:hover { filter: brightness(1.02); }
          button:active { transform: translateY(0.5px); }
        `}</style>
      </button>
    );
  }
);

ShinyButton.displayName = 'ShinyButton';
