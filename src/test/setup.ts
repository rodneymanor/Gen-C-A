import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock framer-motion to avoid animation-related issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out Framer Motion specific props
      const { whileHover, whileTap, initial, animate, transition, exit, ...htmlProps } = props;
      return React.createElement('div', { ...htmlProps, ref }, children);
    }),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out Framer Motion specific props
      const { whileHover, whileTap, initial, animate, transition, exit, ...htmlProps } = props;
      return React.createElement('button', { ...htmlProps, ref }, children);
    }),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => {
      // Filter out Framer Motion specific props
      const { whileHover, whileTap, initial, animate, transition, exit, ...htmlProps } = props;
      return React.createElement('span', { ...htmlProps, ref }, children);
    }),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock CSS variables used throughout the app
import { css } from '@emotion/react';

const mockCSSVariables = css`
  :root {
    /* Colors */
    --color-neutral-50: #fafafa;
    --color-neutral-100: #f5f5f5;
    --color-neutral-200: #e5e5e5;
    --color-neutral-300: #d4d4d4;
    --color-neutral-400: #a3a3a3;
    --color-neutral-500: #737373;
    --color-neutral-600: #525252;
    --color-neutral-700: #404040;
    --color-neutral-800: #262626;
    --color-neutral-900: #171717;

    --color-primary-50: #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-200: #bfdbfe;
    --color-primary-300: #93c5fd;
    --color-primary-400: #60a5fa;
    --color-primary-500: #0B5CFF;
    --color-primary-600: #2563eb;
    --color-primary-700: #1d4ed8;
    --color-primary-800: #1e40af;
    --color-primary-900: #1e3a8a;

    --color-error-400: #f87171;
    --color-error-500: #ef4444;
    --color-warning-50: #fffbeb;
    --color-warning-100: #fef3c7;
    --color-warning-200: #fde68a;
    --color-warning-400: #fbbf24;
    --color-warning-500: #f59e0b;
    --color-warning-800: #92400e;

    --color-creative-purple: #8b5cf6;
    --color-creative-blue: #3b82f6;
    --color-creative-green: #10b981;
    --color-creative-pink: #ec4899;

    --color-ai-gradient-start: #667eea;
    --color-ai-gradient-end: #764ba2;

    /* Button colors */
    --button-primary-bg: var(--color-primary-500);
    --button-primary-bg-hover: var(--color-primary-600);
    --button-primary-text: white;
    --button-primary-shadow: 0 2px 8px rgba(11, 92, 255, 0.3);

    --button-secondary-bg: white;
    --button-secondary-text: var(--color-neutral-700);
    --button-secondary-border: var(--color-neutral-300);
    --button-secondary-bg-hover: var(--color-neutral-50);

    /* Spacing */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-7: 1.75rem;
    --space-8: 2rem;

    /* Typography */
    --font-family-primary: system-ui, -apple-system, sans-serif;
    --font-size-body-small: 0.875rem;
    --font-size-body: 1rem;
    --font-size-body-large: 1.125rem;
    --font-size-h5: 1.25rem;
    --font-size-h4: 1.5rem;
    --font-size-h3: 1.875rem;
    --font-size-h2: 2.25rem;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;

    /* Borders and shadows */
    --radius-small: 0.25rem;
    --radius-medium: 0.5rem;
    --radius-large: 0.75rem;

    --shadow-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-elevated: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --shadow-ai: 0 4px 14px 0 rgba(102, 126, 234, 0.39);

    --focus-ring: 0 0 0 3px rgba(11, 92, 255, 0.3);

    /* Transitions */
    --transition-all: all 0.2s ease-in-out;
  }
`;

// Apply mock CSS variables to the document
const styleElement = document.createElement('style');
styleElement.textContent = mockCSSVariables.styles;
document.head.appendChild(styleElement);