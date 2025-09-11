import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { useLiveAnnouncer } from '../../hooks/useFocusManagement';
import type { User } from '../../types';

export interface LayoutProps {
  user: User;
  children?: React.ReactNode;
}

const layoutStyles = css`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const mainStyles = (isCollapsed: boolean, isMobile: boolean) => css`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--transition-all);
  margin-left: ${isMobile ? '0' : (isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)')};
  
  ${isMobile && css`
    margin-left: 0;
  `}
`;

const headerStyles = css`
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: var(--space-3) var(--space-4);
  }
`;

const contentStyles = css`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  background: var(--color-neutral-50);
  
  @media (max-width: 768px) {
    padding: var(--space-4);
  }
  
  /* Custom scrollbar for content area */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-neutral-100);
    border-radius: var(--radius-small);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-neutral-300);
    border-radius: var(--radius-small);
    
    &:hover {
      background: var(--color-neutral-400);
    }
  }
`;

const mobileHeaderStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  .page-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-800);
    margin: 0;
  }
`;

const skipLinkStyles = css`
  position: absolute;
  top: -40px;
  left: 6px;
  z-index: 1000;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-500);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-small);
  font-weight: var(--font-weight-medium);
  transition: top var(--duration-fast) var(--ease-out);
  
  &:focus {
    top: 6px;
  }
`;

// Mock user data for development
const mockUser: User = {
  id: '1',
  name: 'Sarah Chen',
  email: 'sarah@example.com',
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

export const Layout: React.FC<LayoutProps> = ({ user = mockUser, children }) => {
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const { isMobile } = useResponsive();
  const { announce } = useLiveAnnouncer();

  const handleToggleNavigation = () => {
    const newCollapsed = !isNavigationCollapsed;
    setIsNavigationCollapsed(newCollapsed);
    
    // Announce navigation state change for screen readers
    announce(
      newCollapsed 
        ? 'Navigation collapsed' 
        : 'Navigation expanded'
    );
  };

  return (
    <div css={layoutStyles} className="app-layout">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" css={skipLinkStyles}>
        Skip to main content
      </a>
      
      {/* Main Navigation */}
      <Navigation
        isCollapsed={isMobile ? false : isNavigationCollapsed}
        onToggleCollapse={handleToggleNavigation}
        user={user}
      />
      
      {/* Main Content Area */}
      <main
        css={mainStyles(isNavigationCollapsed, isMobile)}
        className="main-content"
        id="main-content"
        role="main"
      >
        {/* Mobile Header */}
        {isMobile && (
          <header css={headerStyles}>
            <div css={mobileHeaderStyles}>
              <button
                onClick={handleToggleNavigation}
                className="mobile-menu-toggle"
                aria-label="Open navigation menu"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-small)',
                }}
              >
                ☰
              </button>
              <h1 className="page-title">Dashboard</h1>
            </div>
          </header>
        )}
        
        {/* Page Content */}
        <div css={contentStyles} className="page-content">
          {children || <Outlet />}
        </div>
      </main>
      
      {/* Live announcer for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-announcer"
      />
      
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="live-announcer-assertive"
      />
    </div>
  );
};