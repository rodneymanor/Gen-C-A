import React, { lazy, Suspense, ReactNode } from 'react';
import { useAdvancedResponsive, useProgressiveLoading } from '../../hooks/useAdvancedResponsive';

interface ProgressiveWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  enhancementLevel?: 'mobile' | 'tablet' | 'desktop' | 'high-end';
  loadingStrategy?: 'eager' | 'lazy' | 'viewport';
}

export const ProgressiveWrapper: React.FC<ProgressiveWrapperProps> = ({
  children,
  fallback = null,
  enhancementLevel = 'mobile',
  loadingStrategy = 'lazy',
}) => {
  const viewport = useAdvancedResponsive();
  const loading = useProgressiveLoading(viewport);

  const shouldRender = () => {
    switch (enhancementLevel) {
      case 'mobile':
        return true;
      case 'tablet':
        return viewport.isTablet || viewport.isDesktop;
      case 'desktop':
        return viewport.isDesktop && loading.shouldLoadDesktopFeatures;
      case 'high-end':
        return viewport.isLargeDesktop && loading.shouldLoadDesktopFeatures && 
               viewport.devicePixelRatio <= 2 && !viewport.saveData;
      default:
        return true;
    }
  };

  if (!shouldRender()) {
    return <>{fallback}</>;
  }

  if (loadingStrategy === 'lazy') {
    return (
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    );
  }

  return <>{children}</>;
};

// Progressive loading components
const DesktopOnlyFeatures = lazy(() => import('./DesktopOnlyFeatures'));
const TabletEnhancements = lazy(() => import('./TabletEnhancements'));
const HighEndFeatures = lazy(() => import('./HighEndFeatures'));

interface ProgressiveComponentProps {
  children: ReactNode;
  desktopFeatures?: ReactNode;
  tabletFeatures?: ReactNode;
  highEndFeatures?: ReactNode;
}

export const ProgressiveComponent: React.FC<ProgressiveComponentProps> = ({
  children,
  desktopFeatures,
  tabletFeatures,
  highEndFeatures,
}) => {
  const viewport = useAdvancedResponsive();
  const loading = useProgressiveLoading(viewport);

  return (
    <div className="progressive-enhancement">
      {/* Always render core mobile experience */}
      {children}
      
      {/* Progressive enhancement for tablets */}
      {viewport.isTablet && tabletFeatures && (
        <ProgressiveWrapper enhancementLevel="tablet">
          {tabletFeatures}
        </ProgressiveWrapper>
      )}
      
      {/* Progressive enhancement for desktop */}
      {viewport.isDesktop && loading.shouldLoadDesktopFeatures && desktopFeatures && (
        <ProgressiveWrapper enhancementLevel="desktop">
          {desktopFeatures}
        </ProgressiveWrapper>
      )}
      
      {/* High-end features for capable devices */}
      {viewport.isLargeDesktop && loading.shouldLoadDesktopFeatures && highEndFeatures && (
        <ProgressiveWrapper enhancementLevel="high-end">
          {highEndFeatures}
        </ProgressiveWrapper>
      )}
    </div>
  );
};

// Enhanced Navigation with progressive features
interface ProgressiveNavigationProps {
  children: ReactNode;
  className?: string;
}

export const ProgressiveNavigation: React.FC<ProgressiveNavigationProps> = ({
  children,
  className = '',
}) => {
  const viewport = useAdvancedResponsive();
  
  const navClasses = [
    'progressive-navigation',
    viewport.isMobile ? 'mobile-nav' : '',
    viewport.canHover && !viewport.prefersReducedMotion ? 'hover-effects' : '',
    viewport.prefersReducedMotion ? 'reduced-motion-safe' : '',
    viewport.isHighContrast ? 'high-contrast-enhanced' : '',
    viewport.isTouchDevice ? 'touch-enhanced' : '',
    className
  ].filter(Boolean).join(' ');

  const navStyles: React.CSSProperties = {
    // Safe area insets for mobile devices
    ...(viewport.isMobile && {
      paddingBottom: `max(var(--space-4), env(safe-area-inset-bottom))`,
      paddingLeft: `max(var(--space-4), env(safe-area-inset-left))`,
      paddingRight: `max(var(--space-4), env(safe-area-inset-right))`,
    }),
  };

  return (
    <nav className={navClasses} style={navStyles}>
      {children}
    </nav>
  );
};

// Progressive Image Loading
interface ProgressiveImageProps {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  lowQualitySrc,
  className = '',
  loading = 'lazy',
}) => {
  const viewport = useAdvancedResponsive();
  const { shouldLoadHighResImages, shouldPreloadContent } = useProgressiveLoading(viewport);

  const imageSrc = shouldLoadHighResImages ? src : (lowQualitySrc || src);
  const loadingStrategy = shouldPreloadContent ? 'eager' : loading;

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={loadingStrategy}
      className={`progressive-image ${className}`}
      style={{
        // Adaptive sizing based on device capabilities
        objectFit: 'cover',
        ...(viewport.saveData && {
          filter: 'contrast(1.1) brightness(1.1)', // Enhance lower quality images
        }),
      }}
    />
  );
};

// Adaptive Grid with progressive enhancement
interface ProgressiveGridProps {
  children: ReactNode;
  minItemWidth?: number;
  gap?: string;
  className?: string;
}

export const ProgressiveGrid: React.FC<ProgressiveGridProps> = ({
  children,
  minItemWidth = 300,
  gap = 'var(--space-4)',
  className = '',
}) => {
  const viewport = useAdvancedResponsive();

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}px, 100%), 1fr))`,
    gap: viewport.isMobile ? 'var(--space-2)' : gap,
    // Container queries would be used here in CSS
  };

  return (
    <div 
      className={`adaptive-grid responsive-container ${className}`}
      style={gridStyles}
    >
      {children}
    </div>
  );
};