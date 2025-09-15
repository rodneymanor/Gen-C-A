import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { useLiveAnnouncer } from '../../hooks/useFocusManagement';
import { useAuth } from '../../contexts/AuthContext';
import { token } from '@atlaskit/tokens';

// Atlassian Design System Icons
import MenuIcon from '@atlaskit/icon/glyph/menu';

export interface LayoutProps {
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
  /* Removed margin-left since sidebar uses fixed/absolute positioning and components have their own padding */
  
  ${isMobile && css`
    /* Mobile: main content takes full width, sidebar overlays when open */
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
  padding: 0;
  background: var(--color-neutral-50);

  @media (max-width: 768px) {
    padding: 0;
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

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const { isMobile } = useResponsive();
  const { announce } = useLiveAnnouncer();
  const bypassAuth = (import.meta as any).env?.VITE_BYPASS_AUTH === '1' 
    || (typeof window !== 'undefined' && window?.localStorage?.getItem('bypassAuth') === '1');

  const stubUser = {
    id: 'bypass-user',
    name: 'Dev Tester',
    email: 'dev@example.com',
    avatar: '',
    role: 'creator' as const,
    plan: 'free' as const,
    preferences: {
      theme: 'light' as const,
      language: 'en',
      notifications: { email: true, push: false, inApp: true, frequency: 'immediate' as const },
      accessibility: { reducedMotion: false, highContrast: false, fontSize: 'medium' as const, screenReaderOptimized: false }
    }
  };
  const navUser = currentUser ?? (bypassAuth ? stubUser : currentUser);

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
        user={navUser!}
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
                <MenuIcon label="" size="medium" primaryColor={token('color.icon')} />
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
