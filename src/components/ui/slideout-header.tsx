import React from 'react';
import { cn } from '@/lib/utils';

interface SlideoutHeaderProps {
  leftContent?: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function SlideoutHeader({ leftContent, rightActions, className, onClose }: SlideoutHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        {leftContent}
      </div>
      <div className="flex items-center gap-2">
        {rightActions}
        {onClose && (
          <button type="button" onClick={onClose} className="rounded border border-neutral-200 px-2 py-1 text-xs" aria-label="Close panel">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
