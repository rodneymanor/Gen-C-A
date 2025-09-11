import React from 'react';
import { css } from '@emotion/react';
import { 
  ProgressiveComponent,
  ProgressiveWrapper,
  ProgressiveNavigation,
  ProgressiveImage,
  ProgressiveGrid
} from '../components/progressive/ProgressiveEnhancement';
import { ProgressiveButton } from '../components/ui/ProgressiveButton';
import { useAdvancedResponsive, createProgressiveStyles } from '../hooks/useAdvancedResponsive';

/**
 * Example demonstrating progressive enhancement features
 * This component showcases how to use the progressive enhancement system
 */
export const ProgressiveEnhancementExample: React.FC = () => {
  const viewport = useAdvancedResponsive();
  const styles = createProgressiveStyles(viewport);

  return (
    <div className="progressive-enhancement-demo">
      <header css={css`
        padding: var(--space-responsive-lg);
        text-align: center;
        background: var(--color-surface-elevated);
        border-radius: var(--radius-large);
        margin-bottom: var(--space-8);
      `}>
        <h1 className="fluid-typography">Progressive Enhancement Demo</h1>
        <p css={css`color: var(--color-text-secondary); margin-top: var(--space-2);`}>
          Current viewport: {viewport.width}×{viewport.height} 
          {viewport.isMobile && ' (Mobile)'} 
          {viewport.isTablet && ' (Tablet)'} 
          {viewport.isDesktop && ' (Desktop)'}
        </p>
        <p css={css`color: var(--color-text-tertiary); font-size: var(--font-size-body-small);`}>
          Device: {viewport.isTouchDevice ? 'Touch' : 'Mouse'} | 
          Hover: {viewport.canHover ? 'Yes' : 'No'} | 
          Motion: {viewport.prefersReducedMotion ? 'Reduced' : 'Normal'} |
          Theme: {viewport.colorScheme}
        </p>
      </header>

      {/* Progressive Button Examples */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Progressive Buttons</h2>
        <div className="adaptive-grid" css={css`gap: var(--space-4);`}>
          
          {/* Basic progressive button */}
          <ProgressiveButton variant="primary">
            Adaptive Primary Button
          </ProgressiveButton>
          
          {/* Button that adapts to touch devices */}
          <ProgressiveButton 
            variant="secondary" 
            adaptiveTouch={true}
            enhancedHover={true}
          >
            Touch-Adaptive Button
          </ProgressiveButton>
          
          {/* Button that respects motion preferences */}
          <ProgressiveButton 
            variant="ai-powered"
            respectMotionPreferences={true}
          >
            Motion-Aware AI Button
          </ProgressiveButton>
          
        </div>
      </section>

      {/* Progressive Component Loading */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Progressive Component Loading</h2>
        
        <ProgressiveComponent
          // Always rendered core content
          desktopFeatures={
            <div className="desktop-only-features" css={css`
              padding: var(--space-4);
              background: var(--color-primary-50);
              border-radius: var(--radius-medium);
              border: 1px solid var(--color-primary-200);
            `}>
              🖥️ Desktop-only advanced features loaded!
            </div>
          }
          
          tabletFeatures={
            <div className="tablet-enhancements" css={css`
              padding: var(--space-3);
              background: var(--color-info-50);
              border-radius: var(--radius-medium);
              border: 1px solid var(--color-info-200);
            `}>
              📱 Tablet enhancements loaded!
            </div>
          }
          
          highEndFeatures={
            <div className="high-end-features" css={css`
              padding: var(--space-4);
              background: var(--color-creative-purple);
              color: white;
              border-radius: var(--radius-medium);
            `}>
              ⚡ High-end features for capable devices!
            </div>
          }
        >
          {/* Core mobile-first content - always rendered */}
          <div className="core-content" css={css`
            padding: var(--space-4);
            background: var(--color-surface-elevated);
            border-radius: var(--radius-medium);
            border: 1px solid var(--color-border);
            margin-bottom: var(--space-4);
          `}>
            📱 Core mobile-first content (always visible)
          </div>
        </ProgressiveComponent>
      </section>

      {/* Progressive Navigation Example */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Progressive Navigation</h2>
        
        <ProgressiveNavigation css={css`
          display: flex;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-medium);
          border: 1px solid var(--color-border);
        `}>
          <a href="#home" className="nav-link">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </ProgressiveNavigation>
      </section>

      {/* Progressive Grid Example */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Adaptive Grid Layout</h2>
        
        <ProgressiveGrid minItemWidth={250} gap="var(--space-4)">
          {[1, 2, 3, 4, 5, 6].map(item => (
            <div key={item} css={css`
              padding: var(--space-6);
              background: var(--color-surface-elevated);
              border-radius: var(--radius-medium);
              border: 1px solid var(--color-border);
              text-align: center;
              
              ${styles.hover && css`
                @media (hover: hover) and (pointer: fine) {
                  &:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-elevated);
                    transition: var(--transition-card);
                  }
                }
              `}
              
              ${viewport.prefersReducedMotion && css`
                &:hover {
                  transform: none;
                }
              `}
            `}>
              <h3>Card {item}</h3>
              <p css={css`color: var(--color-text-secondary);`}>
                Adaptive content that responds to container size
              </p>
            </div>
          ))}
        </ProgressiveGrid>
      </section>

      {/* Progressive Image Example */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Progressive Image Loading</h2>
        
        <div className="image-grid" css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        `}>
          <ProgressiveImage
            src="/api/placeholder/400/300"
            lowQualitySrc="/api/placeholder/200/150"
            alt="Progressive loaded image"
            loading="lazy"
            css={css`
              width: 100%;
              height: 200px;
              object-fit: cover;
              border-radius: var(--radius-medium);
            `}
          />
          
          <ProgressiveImage
            src="/api/placeholder/400/300?2"
            lowQualitySrc="/api/placeholder/200/150?2"
            alt="Another progressive image"
            loading="lazy"
            css={css`
              width: 100%;
              height: 200px;
              object-fit: cover;
              border-radius: var(--radius-medium);
            `}
          />
        </div>
      </section>

      {/* Responsive Utilities Demo */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Responsive Utility Classes</h2>
        
        <div css={css`
          display: grid;
          gap: var(--space-4);
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        `}>
          
          {/* Progressive Enhancement Card */}
          <div className="progressive-enhancement hover-effects reduced-motion-safe high-contrast-enhanced" css={css`
            padding: var(--space-responsive-md);
            background: var(--color-surface-elevated);
            border-radius: var(--radius-medium);
            border: 1px solid var(--color-border);
          `}>
            <h3>Progressive Enhancement</h3>
            <p>Uses progressive-enhancement class with hover and accessibility support</p>
          </div>
          
          {/* Touch Enhanced Card */}
          <div className="touch-enhanced" css={css`
            padding: var(--space-responsive-md);
            background: var(--color-surface-elevated);
            border-radius: var(--radius-medium);
            border: 1px solid var(--color-border);
          `}>
            <h3>Touch Enhanced</h3>
            <p>Optimized touch targets and spacing for mobile devices</p>
          </div>
          
          {/* Fluid Typography Card */}
          <div className="fluid-spacing" css={css`
            background: var(--color-surface-elevated);
            border-radius: var(--radius-medium);
            border: 1px solid var(--color-border);
          `}>
            <h3 className="fluid-typography">Fluid Typography</h3>
            <p>Text and spacing that adapts smoothly across viewport sizes</p>
          </div>
          
          {/* Safe Area Card */}
          <div className="safe-area-insets" css={css`
            background: var(--color-primary-50);
            border-radius: var(--radius-medium);
            border: 1px solid var(--color-primary-200);
          `}>
            <h3>Safe Area Support</h3>
            <p>Respects device safe areas (notches, home indicators)</p>
          </div>
        </div>
      </section>

      {/* Device Capability Information */}
      <section css={css`margin-bottom: var(--space-8);`}>
        <h2 css={css`margin-bottom: var(--space-4);`}>Device Capabilities</h2>
        
        <div css={css`
          padding: var(--space-6);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-medium);
          border: 1px solid var(--color-border);
          font-family: var(--font-family-mono);
          font-size: var(--font-size-body-small);
        `}>
          <pre css={css`margin: 0; color: var(--color-text-secondary);`}>
{`Viewport Information:
• Size: ${viewport.width} × ${viewport.height}px
• Device Type: ${viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}
• Orientation: ${viewport.orientation}
• Device Pixel Ratio: ${viewport.devicePixelRatio}

Capabilities:
• Touch Support: ${viewport.isTouchDevice ? 'Yes' : 'No'}
• Hover Support: ${viewport.canHover ? 'Yes' : 'No'}  
• Fine Pointer: ${viewport.hasFinePointer ? 'Yes' : 'No'}

User Preferences:
• Reduced Motion: ${viewport.prefersReducedMotion ? 'Yes' : 'No'}
• High Contrast: ${viewport.isHighContrast ? 'Yes' : 'No'}
• Color Scheme: ${viewport.colorScheme}

Network (if available):
• Connection Type: ${viewport.connectionType || 'Unknown'}
• Save Data: ${viewport.saveData ? 'Yes' : 'No'}`}
          </pre>
        </div>
      </section>

      {/* CSS Utility Classes Demo */}
      <footer css={css`
        margin-top: var(--space-12);
        padding: var(--space-responsive-lg);
        background: var(--color-neutral-100);
        border-radius: var(--radius-large);
        text-align: center;
      `}>
        <h3 css={css`margin-bottom: var(--space-4);`}>Available CSS Utility Classes</h3>
        <div css={css`
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          justify-content: center;
          font-size: var(--font-size-body-small);
        `}>
          {[
            'progressive-enhancement',
            'touch-enhanced', 
            'hover-effects',
            'reduced-motion-safe',
            'high-contrast-enhanced',
            'dark-mode-adaptive',
            'fluid-typography',
            'fluid-spacing',
            'adaptive-grid',
            'safe-area-insets',
            'desktop-only',
            'mobile-only',
            'tablet-only'
          ].map(className => (
            <code key={className} css={css`
              padding: var(--space-1) var(--space-2);
              background: var(--color-primary-100);
              color: var(--color-primary-700);
              border-radius: var(--radius-small);
              font-size: var(--font-size-caption);
            `}>
              .{className}
            </code>
          ))}
        </div>
      </footer>
    </div>
  );
};