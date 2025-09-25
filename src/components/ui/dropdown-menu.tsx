import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type OpenState = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

const DropdownMenuContext = createContext<OpenState | undefined>(undefined);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within <DropdownMenu>');
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DropdownMenu({ children, defaultOpen = false }: DropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
}

interface TriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLElement, TriggerProps>(function DropdownMenuTrigger(
  { asChild = false, onClick, ...props },
  forwardedRef,
) {
  const { open, setOpen } = useDropdownMenu();
  const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    onClick?.(event);
    setOpen(!open);
  };

  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children, {
      ref: forwardedRef,
      onClick: handleClick,
    });
  }

  return (
    <button
      type="button"
      {...props}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      onClick={handleClick}
    />
  );
});

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, ContentProps>(function DropdownMenuContent(
  { className, children, ...props },
  ref,
) {
  const { open } = useDropdownMenu();
  if (!open) return null;

  return (
    <div
      role="menu"
      ref={ref}
      className={cn('dropdown-menu__content', className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DropdownMenuItem({ className, ...props }, ref) {
    return (
      <button
        type="button"
        role="menuitem"
        ref={ref}
        className={cn('dropdown-menu__item', className)}
        {...props}
      />
    );
  },
);

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('dropdown-menu__separator', className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('dropdown-menu__label', className)} {...props} />;
}

interface SubContext extends OpenState {
  toggle: () => void;
}

const DropdownSubContext = createContext<SubContext | undefined>(undefined);

function useDropdownSub() {
  const context = useContext(DropdownSubContext);
  if (!context) {
    throw new Error('DropdownMenuSub components must be used within <DropdownMenuSub>');
  }
  return context;
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, toggle: () => setOpen((prev) => !prev) }), []);
  return <DropdownSubContext.Provider value={value}>{children}</DropdownSubContext.Provider>;
}

export const DropdownMenuSubTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DropdownMenuSubTrigger({ className, onClick, ...props }, ref) {
    const { toggle } = useDropdownSub();
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event);
      toggle();
    };

    return (
      <button
        type="button"
        className={cn('dropdown-menu__sub-trigger', className)}
        onClick={handleClick}
        ref={ref}
        {...props}
      />
    );
  },
);

export const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, ContentProps>(function DropdownMenuSubContent(
  { className, children, ...props },
  ref,
) {
  const { open } = useDropdownSub();
  if (!open) return null;

  return (
    <div
      role="menu"
      ref={ref}
      className={cn('dropdown-menu__sub-content', className)}
      {...props}
    >
      {children}
    </div>
  );
});
