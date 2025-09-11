import React from 'react';
import { expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdvancedViewport } from '../hooks/useAdvancedResponsive';

// Viewport configurations for testing
export const TestViewports = {
  mobile: { 
    width: 375, 
    height: 667,
    description: 'iPhone SE sized mobile device'
  },
  mobileLarge: { 
    width: 414, 
    height: 896,
    description: 'iPhone 11 Pro Max sized device'
  },
  tablet: { 
    width: 768, 
    height: 1024,
    description: 'Standard tablet portrait'
  },
  tabletLandscape: { 
    width: 1024, 
    height: 768,
    description: 'Standard tablet landscape'
  },
  desktop: { 
    width: 1440, 
    height: 900,
    description: 'Standard desktop resolution'
  },
  desktopLarge: { 
    width: 1920, 
    height: 1080,
    description: 'Large desktop resolution'
  },
  ultrawide: { 
    width: 3440, 
    height: 1440,
    description: 'Ultrawide desktop monitor'
  },
} as const;

// Device capability configurations
export const DeviceCapabilities = {
  touchOnly: {
    hover: 'none',
    pointer: 'coarse',
    description: 'Touch-only device (mobile/tablet)'
  },
  mouseOnly: {
    hover: 'hover',
    pointer: 'fine',
    description: 'Mouse-only device (desktop)'
  },
  hybrid: {
    hover: 'hover',
    pointer: 'coarse',
    description: 'Hybrid device (touch laptop)'
  },
} as const;

// Accessibility preferences
export const AccessibilityPreferences = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  normalMotion: '(prefers-reduced-motion: no-preference)',
  highContrast: '(prefers-contrast: high)',
  normalContrast: '(prefers-contrast: no-preference)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
} as const;

// Network conditions for testing
export const NetworkConditions = {
  fast: { effectiveType: '4g', saveData: false },
  slow: { effectiveType: 'slow-2g', saveData: true },
  moderate: { effectiveType: '3g', saveData: false },
} as const;

export class ResponsiveTestUtils {
  private static originalMatchMedia = window.matchMedia;
  private static originalInnerWidth = window.innerWidth;
  private static originalInnerHeight = window.innerHeight;

  /**
   * Mock a specific viewport size
   */
  static mockViewport(viewport: keyof typeof TestViewports | { width: number; height: number }) {
    const size = typeof viewport === 'string' ? TestViewports[viewport] : viewport;
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: size.width,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: size.height,
    });

    // Trigger resize event
    fireEvent(window, new Event('resize'));
  }

  /**
   * Mock device capabilities (hover, pointer)
   */
  static mockDeviceCapabilities(capability: keyof typeof DeviceCapabilities) {
    const config = DeviceCapabilities[capability];
    
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes(`hover: ${config.hover}`) || 
               query.includes(`pointer: ${config.pointer}`),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  /**
   * Mock accessibility preferences
   */
  static mockAccessibilityPreference(preference: keyof typeof AccessibilityPreferences) {
    const query = AccessibilityPreferences[preference];
    
    window.matchMedia = vi.fn().mockImplementation((mediaQuery: string) => ({
      matches: mediaQuery === query,
      media: mediaQuery,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  /**
   * Mock network conditions
   */
  static mockNetworkCondition(condition: keyof typeof NetworkConditions) {
    const config = NetworkConditions[condition];
    
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: config,
    });
  }

  /**
   * Test component behavior across multiple viewports
   */
  static async testResponsiveBehavior(
    Component: React.ComponentType<any>,
    props: any,
    tests: {
      viewport: keyof typeof TestViewports;
      test: (component: ReturnType<typeof render>) => void | Promise<void>;
    }[]
  ) {
    for (const { viewport, test } of tests) {
      ResponsiveTestUtils.mockViewport(viewport);
      const component = render(React.createElement(Component, props));
      
      await test(component);
      
      component.unmount();
    }
  }

  /**
   * Test touch interactions
   */
  static async testTouchInteraction(element: HTMLElement) {
    // Test touch events
    fireEvent.touchStart(element);
    fireEvent.touchEnd(element);
    
    // Verify touch target size (minimum 44x44px)
    const computedStyle = getComputedStyle(element);
    const height = parseFloat(computedStyle.height);
    const width = parseFloat(computedStyle.width);
    
    expect(height).toBeGreaterThanOrEqual(44);
    expect(width).toBeGreaterThanOrEqual(44);
  }

  /**
   * Test hover interactions (only on devices that support hover)
   */
  static async testHoverInteraction(element: HTMLElement, shouldSupport: boolean = true) {
    const user = userEvent.setup();
    
    if (shouldSupport) {
      await user.hover(element);
      // Add assertions for hover states
    }
  }

  /**
   * Test keyboard navigation
   */
  static async testKeyboardNavigation(elements: HTMLElement[]) {
    const user = userEvent.setup();
    
    // Test Tab navigation
    for (const element of elements) {
      await user.tab();
      expect(element).toHaveFocus();
    }
    
    // Test Shift+Tab navigation
    for (let i = elements.length - 1; i >= 0; i--) {
      await user.tab({ shift: true });
      expect(elements[i]).toHaveFocus();
    }
  }

  /**
   * Test progressive loading behavior
   */
  static async testProgressiveLoading(
    component: ReturnType<typeof render>,
    loadingTests: {
      condition: string;
      shouldLoad: boolean;
      selector: string;
    }[]
  ) {
    for (const test of loadingTests) {
      if (test.shouldLoad) {
        await waitFor(() => {
          expect(screen.queryByTestId(test.selector)).toBeInTheDocument();
        });
      } else {
        expect(screen.queryByTestId(test.selector)).not.toBeInTheDocument();
      }
    }
  }

  /**
   * Test container queries behavior
   */
  static testContainerQueries(
    container: HTMLElement,
    breakpoints: { width: number; expectedClass: string }[]
  ) {
    breakpoints.forEach(({ width, expectedClass }) => {
      // Mock container width
      Object.defineProperty(container, 'offsetWidth', {
        configurable: true,
        value: width,
      });
      
      // Trigger resize
      fireEvent(window, new Event('resize'));
      
      // Check for expected class or behavior
      expect(container).toHaveClass(expectedClass);
    });
  }

  /**
   * Test safe area insets
   */
  static testSafeAreaInsets(element: HTMLElement) {
    const computedStyle = getComputedStyle(element);
    
    // Check if safe area insets are being used
    const paddingLeft = computedStyle.paddingLeft;
    const paddingRight = computedStyle.paddingRight;
    const paddingTop = computedStyle.paddingTop;
    const paddingBottom = computedStyle.paddingBottom;
    
    // These should use max() function with env() values
    expect(paddingLeft).toMatch(/max\(.*env\(safe-area-inset-left\).*\)/);
    expect(paddingRight).toMatch(/max\(.*env\(safe-area-inset-right\).*\)/);
    expect(paddingTop).toMatch(/max\(.*env\(safe-area-inset-top\).*\)/);
    expect(paddingBottom).toMatch(/max\(.*env\(safe-area-inset-bottom\).*\)/);
  }

  /**
   * Performance testing for responsive components
   */
  static async testPerformance(
    Component: React.ComponentType,
    viewport: keyof typeof TestViewports,
    options: { maxRenderTime: number } = { maxRenderTime: 100 }
  ) {
    ResponsiveTestUtils.mockViewport(viewport);
    
    const startTime = performance.now();
    render(React.createElement(Component));
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(options.maxRenderTime);
  }

  /**
   * Cleanup all mocks
   */
  static cleanup() {
    window.matchMedia = ResponsiveTestUtils.originalMatchMedia;
    window.innerWidth = ResponsiveTestUtils.originalInnerWidth;
    window.innerHeight = ResponsiveTestUtils.originalInnerHeight;
    
    // Clean up navigator.connection mock
    delete (navigator as any).connection;
  }

  /**
   * Generate accessibility test report
   */
  static generateA11yTestReport(element: HTMLElement) {
    return {
      hasProperAriaLabels: element.getAttribute('aria-label') !== null,
      hasProperRole: element.getAttribute('role') !== null,
      isFocusable: element.tabIndex >= 0,
      hasKeyboardHandlers: !!(element as any).onKeyDown || !!(element as any).onKeyPress,
      meetsContrastRequirements: true, // Would need actual color analysis
    };
  }
}

// Custom Jest/Vitest matchers for responsive testing
export const responsiveMatchers = {
  toBeResponsive: (element: HTMLElement) => {
    const style = getComputedStyle(element);
    const hasFlexibleWidth = style.width.includes('%') || style.width.includes('vw');
    const hasMediaQueries = style.toString().includes('@media');
    
    return {
      pass: hasFlexibleWidth || hasMediaQueries,
      message: () => 'Element should be responsive with flexible sizing or media queries'
    };
  },
  
  toHaveAccessibleTouchTarget: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minTouchSize = 44; // WCAG AA standard
    
    return {
      pass: rect.width >= minTouchSize && rect.height >= minTouchSize,
      message: () => `Element should have minimum touch target of ${minTouchSize}x${minTouchSize}px`
    };
  }
};

// Type definitions for tests
export type ResponsiveTestSuite = {
  viewport: keyof typeof TestViewports;
  capability: keyof typeof DeviceCapabilities;
  accessibility: keyof typeof AccessibilityPreferences;
  network: keyof typeof NetworkConditions;
  expectedBehavior: string;
  test: () => void | Promise<void>;
};