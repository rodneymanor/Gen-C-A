import React from 'react';
import { cn } from '@/lib/utils';

interface ClarityLoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'inline' | 'sm' | 'md' | 'lg';
}

export function ClarityLoader({ size = 'md', className, ...props }: ClarityLoaderProps) {
  const dimension = size === 'inline' ? 16 : size === 'sm' ? 20 : size === 'lg' ? 32 : 24;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('clarity-loader', className)}
      style={{
        display: 'inline-block',
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        opacity: 0.8,
      }}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </span>
  );
}
