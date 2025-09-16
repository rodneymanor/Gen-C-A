import { useState, useEffect } from 'react';

export interface AdvancedViewport {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  
  // Progressive enhancement capabilities
  canHover: boolean;
  hasFinePointer: boolean;
  prefersReducedMotion: boolean;
  isHighContrast: boolean;
  colorScheme: 'light' | 'dark';
  
  // Device characteristics
  isTouchDevice: boolean;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  
  // Network information (if available)
  connectionType?: string;
  saveData?: boolean;
}

export const useAdvancedResponsive = (): AdvancedViewport => {
  const getInitialViewport = (): AdvancedViewport => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        canHover: false,
        hasFinePointer: false,
        prefersReducedMotion: false,
        isHighContrast: false,
        colorScheme: 'light',
        isTouchDevice: false,
        devicePixelRatio: 1,
        orientation: 'landscape',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isLargeDesktop: width >= 1280,
      
      // Progressive enhancement features
      canHover: window.matchMedia('(hover: hover)').matches,
      hasFinePointer: window.matchMedia('(pointer: fine)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      
      // Device characteristics
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: width > height ? 'landscape' : 'portrait',
      
      // Network information (progressive enhancement)
      connectionType: (navigator as any).connection?.effectiveType,
      saveData: (navigator as any).connection?.saveData || false,
    };
  };

  const [viewport, setViewport] = useState<AdvancedViewport>(getInitialViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      setViewport(getInitialViewport());
    };

    const mediaQueryLists = [
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
    ];

    // Add listeners for window resize
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Add listeners for media query changes
    mediaQueryLists.forEach(mql => {
      mql.addEventListener('change', updateViewport);
    });

    // Network change listener (if supported)
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', updateViewport);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      
      mediaQueryLists.forEach(mql => {
        mql.removeEventListener('change', updateViewport);
      });

      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', updateViewport);
      }
    };
  }, []);

  return viewport;
};

// Utility functions for progressive enhancement
export const createProgressiveStyles = (viewport: AdvancedViewport) => ({
  // Hover effects only where supported
  hover: viewport.canHover && viewport.hasFinePointer,
  
  // Animation preferences
  animate: !viewport.prefersReducedMotion,
  
  // Touch-friendly sizing
  touchTarget: viewport.isTouchDevice ? '46px' : '44px',
  
  // Performance considerations
  highPerformance: viewport.connectionType !== 'slow-2g' && !viewport.saveData,
  
  // Visual enhancements
  shadows: !viewport.isHighContrast,
  gradients: viewport.colorScheme === 'light' && !viewport.isHighContrast,
});

// Hook for progressive component loading
export const useProgressiveLoading = (viewport: AdvancedViewport) => {
  const shouldLoadDesktopFeatures = viewport.isDesktop && viewport.connectionType !== 'slow-2g';
  const shouldLoadAnimations = !viewport.prefersReducedMotion && viewport.devicePixelRatio <= 2;
  const shouldLoadHighResImages = viewport.devicePixelRatio > 1 && !viewport.saveData;
  
  return {
    shouldLoadDesktopFeatures,
    shouldLoadAnimations,
    shouldLoadHighResImages,
    shouldPreloadContent: !viewport.saveData && viewport.connectionType !== 'slow-2g',
  };
};