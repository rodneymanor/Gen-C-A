import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '../../test/test-utils';
import { useResponsive } from '../../hooks/useResponsive';

describe('useResponsive Hook', () => {
  let originalInnerWidth: number;
  let resizeCallback: (() => void) | null = null;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Default desktop size
    });

    // Mock addEventListener and removeEventListener
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'resize' && typeof callback === 'function') {
        resizeCallback = callback as () => void;
      }
      return originalAddEventListener.call(window, event, callback);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, callback) => {
      if (event === 'resize' && callback === resizeCallback) {
        resizeCallback = null;
      }
      return originalRemoveEventListener.call(window, event, callback);
    });
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    
    // Clean up mocks
    vi.restoreAllMocks();
    resizeCallback = null;
  });

  describe('Initial State', () => {
    it('should initialize with default values for desktop', () => {
      window.innerWidth = 1024;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.windowWidth).toBe(1024);
      expect(result.current.breakpoint).toBe('lg');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
    });

    it('should handle SSR environment (no window)', () => {
      // This test is tricky since we're already in jsdom
      // We can test the fallback logic by checking the default value
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.windowWidth).toBeGreaterThan(0);
    });
  });

  describe('Breakpoint Detection', () => {
    it('should detect small mobile breakpoint (< 640px)', () => {
      window.innerWidth = 500;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('sm');
      expect(result.current.windowWidth).toBe(500);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should detect medium tablet breakpoint (640px - 768px)', () => {
      window.innerWidth = 700;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('md');
      expect(result.current.windowWidth).toBe(700);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should detect large desktop breakpoint (768px - 1024px)', () => {
      window.innerWidth = 900;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('lg');
      expect(result.current.windowWidth).toBe(900);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isLargeDesktop).toBe(false);
    });

    it('should detect extra large breakpoint (1024px - 1280px)', () => {
      window.innerWidth = 1200;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('xl');
      expect(result.current.windowWidth).toBe(1200);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isLargeDesktop).toBe(true);
    });

    it('should detect 2xl breakpoint (>= 1280px)', () => {
      window.innerWidth = 1600;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('2xl');
      expect(result.current.windowWidth).toBe(1600);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isLargeDesktop).toBe(true);
    });
  });

  describe('Boundary Values', () => {
    it('should handle exact breakpoint boundaries', () => {
      // Test exact boundary values
      const testCases = [
        { width: 640, expectedBreakpoint: 'md' },
        { width: 639, expectedBreakpoint: 'sm' },
        { width: 768, expectedBreakpoint: 'lg' },
        { width: 767, expectedBreakpoint: 'md' },
        { width: 1024, expectedBreakpoint: 'xl' },
        { width: 1023, expectedBreakpoint: 'lg' },
        { width: 1280, expectedBreakpoint: '2xl' },
        { width: 1279, expectedBreakpoint: 'xl' },
      ];

      testCases.forEach(({ width, expectedBreakpoint }) => {
        window.innerWidth = width;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.breakpoint).toBe(expectedBreakpoint);
        expect(result.current.windowWidth).toBe(width);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('isBelow', () => {
      it('should correctly identify when below breakpoint', () => {
        window.innerWidth = 500;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isBelow('sm')).toBe(true);
        expect(result.current.isBelow('md')).toBe(true);
        expect(result.current.isBelow('lg')).toBe(true);
        expect(result.current.isBelow('xl')).toBe(true);
        expect(result.current.isBelow('2xl')).toBe(true);
      });

      it('should correctly identify when not below breakpoint', () => {
        window.innerWidth = 1000;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isBelow('sm')).toBe(false);
        expect(result.current.isBelow('md')).toBe(false);
        expect(result.current.isBelow('lg')).toBe(true);
        expect(result.current.isBelow('xl')).toBe(true);
      });
    });

    describe('isAbove', () => {
      it('should correctly identify when above breakpoint', () => {
        window.innerWidth = 1000;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isAbove('sm')).toBe(true);
        expect(result.current.isAbove('md')).toBe(true);
        expect(result.current.isAbove('lg')).toBe(false);
        expect(result.current.isAbove('xl')).toBe(false);
      });

      it('should correctly identify when not above breakpoint', () => {
        window.innerWidth = 500;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isAbove('sm')).toBe(false);
        expect(result.current.isAbove('md')).toBe(false);
        expect(result.current.isAbove('lg')).toBe(false);
      });
    });

    describe('isBetween', () => {
      it('should correctly identify when between breakpoints', () => {
        window.innerWidth = 800;
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isBetween('md', 'lg')).toBe(true);
        expect(result.current.isBetween('sm', 'xl')).toBe(true);
        expect(result.current.isBetween('lg', 'xl')).toBe(false);
        expect(result.current.isBetween('xl', '2xl')).toBe(false);
      });

      it('should handle edge cases in between function', () => {
        window.innerWidth = 768; // Exact boundary
        
        const { result } = renderHook(() => useResponsive());
        
        expect(result.current.isBetween('md', 'lg')).toBe(true); // 768 >= 768 and < 1024
        expect(result.current.isBetween('sm', 'md')).toBe(false); // 768 >= 640 but not < 768
      });
    });
  });

  describe('Resize Events', () => {
    it('should update breakpoint when window is resized', () => {
      window.innerWidth = 1024;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('xl');
      expect(result.current.windowWidth).toBe(1024);
      
      // Simulate window resize
      act(() => {
        window.innerWidth = 500;
        if (resizeCallback) {
          resizeCallback();
        }
      });
      
      expect(result.current.breakpoint).toBe('sm');
      expect(result.current.windowWidth).toBe(500);
      expect(result.current.isMobile).toBe(true);
    });

    it('should handle multiple resize events', () => {
      window.innerWidth = 1024;
      
      const { result } = renderHook(() => useResponsive());
      
      const resizeScenarios = [
        { width: 500, expectedBreakpoint: 'sm' },
        { width: 700, expectedBreakpoint: 'md' },
        { width: 1200, expectedBreakpoint: 'xl' },
        { width: 1600, expectedBreakpoint: '2xl' },
      ];
      
      resizeScenarios.forEach(({ width, expectedBreakpoint }) => {
        act(() => {
          window.innerWidth = width;
          if (resizeCallback) {
            resizeCallback();
          }
        });
        
        expect(result.current.breakpoint).toBe(expectedBreakpoint);
        expect(result.current.windowWidth).toBe(width);
      });
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useResponsive());
      
      expect(resizeCallback).not.toBeNull();
      
      unmount();
      
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', resizeCallback);
    });
  });

  describe('Utility Properties Consistency', () => {
    it('should have consistent utility properties for mobile', () => {
      window.innerWidth = 500;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('sm');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isLargeDesktop).toBe(false);
    });

    it('should have consistent utility properties for tablet', () => {
      window.innerWidth = 700;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('md');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isLargeDesktop).toBe(false);
    });

    it('should have consistent utility properties for desktop', () => {
      window.innerWidth = 900;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('lg');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isLargeDesktop).toBe(false);
    });

    it('should have consistent utility properties for large desktop', () => {
      window.innerWidth = 1600;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('2xl');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isLargeDesktop).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not create new utility functions on every render', () => {
      const { result, rerender } = renderHook(() => useResponsive());
      
      const firstRender = {
        isBelow: result.current.isBelow,
        isAbove: result.current.isAbove,
        isBetween: result.current.isBetween,
      };
      
      rerender();
      
      const secondRender = {
        isBelow: result.current.isBelow,
        isAbove: result.current.isAbove,
        isBetween: result.current.isBetween,
      };
      
      // Utility functions should be stable references
      expect(secondRender.isBelow).toBe(firstRender.isBelow);
      expect(secondRender.isAbove).toBe(firstRender.isAbove);
      expect(secondRender.isBetween).toBe(firstRender.isBetween);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small window widths', () => {
      window.innerWidth = 1;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('sm');
      expect(result.current.isMobile).toBe(true);
    });

    it('should handle very large window widths', () => {
      window.innerWidth = 5000;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.breakpoint).toBe('2xl');
      expect(result.current.isLargeDesktop).toBe(true);
    });

    it('should handle rapid resize events', () => {
      window.innerWidth = 1024;
      
      const { result } = renderHook(() => useResponsive());
      
      // Simulate rapid resizes
      const widths = [500, 800, 1200, 600, 1400, 700];
      
      widths.forEach((width) => {
        act(() => {
          window.innerWidth = width;
          if (resizeCallback) {
            resizeCallback();
          }
        });
      });
      
      // Final state should match the last width
      expect(result.current.windowWidth).toBe(700);
      expect(result.current.breakpoint).toBe('md');
    });
  });
});