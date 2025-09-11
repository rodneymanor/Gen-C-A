import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * Hook for responsive design - returns current breakpoint and utilities
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      if (width < breakpoints.sm) {
        setBreakpoint('sm');
      } else if (width < breakpoints.md) {
        setBreakpoint('md');
      } else if (width < breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width < breakpoints.xl) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Add resize listener
    window.addEventListener('resize', updateBreakpoint);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Utility functions
  const isMobile = breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = ['lg', 'xl', '2xl'].includes(breakpoint);
  const isLargeDesktop = ['xl', '2xl'].includes(breakpoint);
  
  const isBelow = (bp: Breakpoint) => windowWidth < breakpoints[bp];
  const isAbove = (bp: Breakpoint) => windowWidth >= breakpoints[bp];
  const isBetween = (min: Breakpoint, max: Breakpoint) => 
    windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];

  return {
    breakpoint,
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isBelow,
    isAbove,
    isBetween,
  };
};