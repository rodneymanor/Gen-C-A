import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressiveButton } from '../ProgressiveButton';
import { ResponsiveTestUtils, TestViewports, DeviceCapabilities } from '../../../utils/responsiveTestUtils';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('ProgressiveButton', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    ResponsiveTestUtils.cleanup();
  });

  afterEach(() => {
    ResponsiveTestUtils.cleanup();
  });

  describe('Responsive Behavior', () => {
    it('should adapt button size for mobile touch devices', async () => {
      ResponsiveTestUtils.mockViewport('mobile');
      ResponsiveTestUtils.mockDeviceCapabilities('touchOnly');

      render(<ProgressiveButton size="small">Mobile Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      
      // Should upgrade to medium size on mobile
      await ResponsiveTestUtils.testTouchInteraction(button);
    });

    it('should render correctly across different viewports', async () => {
      const testCases = [
        { viewport: 'mobile' as const, expectedText: 'Mobile Button' },
        { viewport: 'tablet' as const, expectedText: 'Tablet Button' },
        { viewport: 'desktop' as const, expectedText: 'Desktop Button' },
      ];

      for (const { viewport, expectedText } of testCases) {
        ResponsiveTestUtils.mockViewport(viewport);
        
        const { unmount } = render(
          <ProgressiveButton>{expectedText}</ProgressiveButton>
        );
        
        expect(screen.getByText(expectedText)).toBeInTheDocument();
        
        unmount();
      }
    });

    it('should apply safe area insets on mobile devices', () => {
      ResponsiveTestUtils.mockViewport('mobile');
      
      render(<ProgressiveButton>Safe Button</ProgressiveButton>);
      
      const buttonContainer = screen.getByRole('button').closest('div');
      if (buttonContainer) {
        ResponsiveTestUtils.testSafeAreaInsets(buttonContainer);
      }
    });
  });

  describe('Progressive Enhancement', () => {
    it('should only show hover effects on devices that support hover', async () => {
      // Test on touch-only device (no hover)
      ResponsiveTestUtils.mockDeviceCapabilities('touchOnly');
      
      const { unmount: unmountTouch } = render(
        <ProgressiveButton enhancedHover>Touch Device Button</ProgressiveButton>
      );
      
      const touchButton = screen.getByRole('button');
      expect(touchButton).not.toHaveClass('hover-effects');
      
      unmountTouch();
      
      // Test on mouse device (with hover)
      ResponsiveTestUtils.mockDeviceCapabilities('mouseOnly');
      
      const { unmount: unmountMouse } = render(
        <ProgressiveButton enhancedHover>Mouse Device Button</ProgressiveButton>
      );
      
      const mouseButton = screen.getByRole('button');
      await ResponsiveTestUtils.testHoverInteraction(mouseButton, true);
      
      unmountMouse();
    });

    it('should respect reduced motion preferences', () => {
      ResponsiveTestUtils.mockAccessibilityPreference('reducedMotion');
      
      render(<ProgressiveButton>Reduced Motion Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      expect(button.closest('div')).toHaveClass('reduced-motion-safe');
    });

    it('should adapt to high contrast mode', () => {
      ResponsiveTestUtils.mockAccessibilityPreference('highContrast');
      
      render(<ProgressiveButton>High Contrast Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('high-contrast-enhanced');
    });

    it('should adapt to dark mode', () => {
      ResponsiveTestUtils.mockAccessibilityPreference('darkMode');
      
      render(<ProgressiveButton>Dark Mode Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('dark-mode-adaptive');
    });
  });

  describe('Performance Considerations', () => {
    it('should simplify animations on slow networks', () => {
      ResponsiveTestUtils.mockNetworkCondition('slow');
      
      render(<ProgressiveButton>Slow Network Button</ProgressiveButton>);
      
      const buttonContainer = screen.getByRole('button').closest('div');
      const computedStyle = buttonContainer ? getComputedStyle(buttonContainer) : null;
      
      if (computedStyle) {
        // Should have reduced animation duration
        expect(computedStyle.transitionDuration).toBe('0.1s');
      }
    });

    it('should render within performance budgets', async () => {
      await ResponsiveTestUtils.testPerformance(
        () => <ProgressiveButton>Performance Test</ProgressiveButton>,
        'mobile',
        { maxRenderTime: 50 }
      );
    });
  });

  describe('Touch Interactions', () => {
    it('should have appropriate touch targets', async () => {
      ResponsiveTestUtils.mockViewport('mobile');
      ResponsiveTestUtils.mockDeviceCapabilities('touchOnly');
      
      render(<ProgressiveButton>Touch Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      await ResponsiveTestUtils.testTouchInteraction(button);
    });

    it('should handle touch events correctly', async () => {
      const user = userEvent.setup();
      ResponsiveTestUtils.mockDeviceCapabilities('touchOnly');
      
      const handleClick = vi.fn();
      render(<ProgressiveButton onClick={handleClick}>Touch Click</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      
      // Simulate touch interaction
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', async () => {
      render(
        <div>
          <ProgressiveButton>First Button</ProgressiveButton>
          <ProgressiveButton>Second Button</ProgressiveButton>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      await ResponsiveTestUtils.testKeyboardNavigation(buttons);
    });

    it('should handle Enter and Space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<ProgressiveButton onClick={handleClick}>Keyboard Button</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ProgressiveButton isDisabled aria-label="Disabled Progressive Button">
          Disabled Button
        </ProgressiveButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-label', 'Disabled Progressive Button');
    });

    it('should generate proper accessibility test report', () => {
      render(<ProgressiveButton aria-label="Test Button">Test</ProgressiveButton>);
      
      const button = screen.getByRole('button');
      const report = ResponsiveTestUtils.generateA11yTestReport(button);
      
      expect(report.hasProperAriaLabels).toBe(true);
      expect(report.isFocusable).toBe(true);
    });
  });

  describe('Device Adaptation', () => {
    it('should adapt to different device pixel ratios', () => {
      // Mock high-DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 3,
      });
      
      render(<ProgressiveButton>High DPI Button</ProgressiveButton>);
      
      const buttonContainer = screen.getByRole('button').closest('div');
      const computedStyle = buttonContainer ? getComputedStyle(buttonContainer) : null;
      
      if (computedStyle) {
        // Should have enhanced box shadow for high-DPI
        expect(computedStyle.boxShadow).toContain('0.5px');
      }
    });
  });
});