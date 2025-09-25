import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipState {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const TooltipContext = createContext<TooltipState | undefined>(undefined);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be wrapped in <Tooltip>');
  }
  return context;
}

interface TriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLElement, TriggerProps>(function TooltipTrigger(
  { asChild = false, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props },
  ref,
) {
  const { setOpen } = useTooltip();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const bindProps = {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      onMouseEnter?.(event);
      handleOpen();
    },
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(event);
      handleClose();
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      onFocus?.(event);
      handleOpen();
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      onBlur?.(event);
      handleClose();
    },
  };

  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, { ...bindProps, ref });
  }

  return <span ref={ref as React.Ref<HTMLSpanElement>} {...props} {...bindProps} />;
});

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipContent = React.forwardRef<HTMLDivElement, ContentProps>(function TooltipContent(
  { className, children, ...props },
  ref,
) {
  const { open } = useTooltip();
  if (!open) return null;

  return (
    <div
      role="tooltip"
      ref={ref}
      className={cn('tooltip__content', className)}
      {...props}
    >
      {children}
    </div>
  );
});
