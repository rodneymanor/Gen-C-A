import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { User } from '../types';

// Mock user for testing
export const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: '',
  role: 'creator',
  plan: 'premium',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      frequency: 'immediate'
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      screenReaderOptimized: false
    }
  }
};

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: User;
}

const AllProviders: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/'] 
}) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, user = mockUser, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

// Helper function to create mock data
export const createMockCollection = (overrides = {}) => ({
  id: '1',
  name: 'Test Collection',
  description: 'A test collection',
  thumbnail: '',
  tags: ['test'],
  platforms: ['tiktok'] as const,
  videoCount: 5,
  created: new Date('2024-01-01'),
  updated: new Date('2024-01-02'),
  isPrivate: false,
  previewVideos: [],
  ...overrides,
});

export const createMockContentItem = (overrides = {}) => ({
  id: '1',
  title: 'Test Video',
  description: 'A test video',
  type: 'video' as const,
  platform: 'tiktok' as const,
  thumbnail: '',
  duration: 30,
  tags: ['test'],
  creator: 'Test Creator',
  created: new Date('2024-01-01'),
  updated: new Date('2024-01-01'),
  status: 'published' as const,
  metadata: {},
  ...overrides,
});

export const createMockScript = (overrides = {}) => ({
  id: '1',
  title: 'Test Script',
  content: 'This is a test script content',
  platform: 'tiktok' as const,
  length: 'short' as const,
  style: 'engaging' as const,
  aiModel: 'gpt-4',
  brandVoiceId: 'brand-voice-1',
  voice: {
    id: 'brand-voice-1',
    name: 'Test Voice',
    badges: ['engaging']
  },
  wordCount: 50,
  estimatedDuration: 15,
  insights: [],
  created: new Date('2024-01-01'),
  updated: new Date('2024-01-01'),
  ...overrides,
});

export const createMockActivity = (overrides = {}) => ({
  id: '1',
  type: 'created' as const,
  description: 'Created test item',
  entityType: 'video' as const,
  entityId: '1',
  timestamp: new Date('2024-01-01'),
  user: mockUser,
  ...overrides,
});

// Helper to wait for async operations
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      try {
        callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - start > timeout) {
          throw error;
        }
        setTimeout(check, 10);
      }
    };
    check();
  });
};

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Replace the default render with our custom render
export { customRender as render };