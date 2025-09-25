import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs>');
  }
  return context;
}

interface TabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ children, value, defaultValue, onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? 'tab-1');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value! : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const contextValue = useMemo(() => ({ value: currentValue, setValue }), [currentValue]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="tablist" className={cn('tabs__list', className)} {...props}>
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, className, onClick, ...props },
  ref,
) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      aria-selected={isActive}
      className={cn('tabs__trigger', isActive && 'tabs__trigger--active', className)}
      onClick={(event) => {
        onClick?.(event);
        setValue(value);
      }}
      {...props}
    />
  );
});

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, children, ...props },
  ref,
) {
  const { value: activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return (
    <div ref={ref} role="tabpanel" className={cn('tabs__content', className)} {...props}>
      {children}
    </div>
  );
});
