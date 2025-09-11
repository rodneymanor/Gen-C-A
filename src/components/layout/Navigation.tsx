import React, { useState } from 'react';
import { css } from '@emotion/react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useResponsive } from '../../hooks/useResponsive';
import type { NavigationItem, NavigationSection, User } from '../../types';

export interface NavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user: User;
}

const navigationData: NavigationSection[] = [
  {
    section: 'Content',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '🏠', badge: '' },
      { path: '/collections', label: 'Collections', icon: '📁', badge: '12' },
      { path: '/library', label: 'Library', icon: '📚', badge: '247' },
      { path: '/write', label: 'Write', icon: '✍️', badge: '' },
    ]
  },
  {
    section: 'Brand',
    items: [
      { path: '/brand-hub', label: 'Brand Hub', icon: '👥', badge: '5' }
    ]
  },
  {
    section: 'Tools',
    items: [
      { path: '/extensions', label: 'Extensions', icon: '🔌', badge: '' },
      { path: '/mobile', label: 'Mobile Shortcuts', icon: '📱', badge: '' }
    ]
  }
];

const sidebarStyles = (isCollapsed: boolean, isMobile: boolean) => css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-neutral-0);
  border-right: 1px solid var(--color-neutral-200);
  transition: var(--transition-all);
  position: relative;
  z-index: 100;
  
  ${isMobile ? css`
    position: fixed;
    left: 0;
    top: 0;
    width: ${isCollapsed ? '0' : 'var(--sidebar-width)'};
    overflow: hidden;
    box-shadow: ${!isCollapsed ? 'var(--shadow-elevated)' : 'none'};
  ` : css`
    width: ${isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'};
    min-width: ${isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'};
  `}
`;

const headerStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  min-height: 64px;
  
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    
    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--color-ai-gradient-start), var(--color-ai-gradient-end));
      border-radius: var(--radius-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: var(--font-weight-bold);
      flex-shrink: 0;
    }
    
    h1 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-800);
      margin: 0;
    }
  }
`;

const contentStyles = css`
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  
  .nav-section {
    margin-bottom: var(--space-6);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: var(--font-size-caption);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: var(--space-3);
      padding: 0 var(--space-2);
    }
  }
`;

const navItemStyles = (isActive: boolean, isCollapsed: boolean) => css`
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-medium);
  text-decoration: none;
  color: ${isActive ? 'var(--color-primary-600)' : 'var(--color-neutral-700)'};
  background: ${isActive ? 'var(--color-primary-50)' : 'transparent'};
  border: ${isActive ? '1px solid var(--color-primary-200)' : '1px solid transparent'};
  transition: var(--transition-all);
  margin-bottom: var(--space-1);
  position: relative;
  
  &:hover {
    background: ${isActive ? 'var(--color-primary-100)' : 'var(--color-neutral-100)'};
    color: ${isActive ? 'var(--color-primary-700)' : 'var(--color-neutral-800)'};
  }
  
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  
  .nav-icon {
    font-size: 18px;
    margin-right: ${isCollapsed ? '0' : 'var(--space-3)'};
    flex-shrink: 0;
    width: 20px;
    text-align: center;
  }
  
  .nav-label {
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    overflow: hidden;
    opacity: ${isCollapsed ? '0' : '1'};
    transform: ${isCollapsed ? 'translateX(-10px)' : 'translateX(0)'};
    transition: var(--transition-all);
  }
  
  .nav-badge {
    margin-left: auto;
    background: var(--color-neutral-200);
    color: var(--color-neutral-700);
    padding: 2px 6px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-medium);
    min-width: 20px;
    text-align: center;
    opacity: ${isCollapsed ? '0' : '1'};
    
    ${isActive && css`
      background: var(--color-primary-200);
      color: var(--color-primary-700);
    `}
  }
  
  ${isCollapsed && css`
    justify-content: center;
    padding: var(--space-3);
    
    .collapsed-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--color-primary-500);
      color: white;
      border-radius: var(--radius-full);
      font-size: 10px;
      padding: 2px 4px;
      min-width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
    }
  `}
`;

const footerStyles = css`
  padding: var(--space-4);
  border-top: 1px solid var(--color-neutral-200);
  
  .user-menu {
    margin-top: var(--space-3);
  }
`;

const userMenuStyles = (isCollapsed: boolean) => css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-medium);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
  transition: var(--transition-all);
  
  &:hover {
    background: var(--color-neutral-100);
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--font-weight-semibold);
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    opacity: ${isCollapsed ? '0' : '1'};
    transform: ${isCollapsed ? 'translateX(-10px)' : 'translateX(0)'};
    transition: var(--transition-all);
    
    .user-name {
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);
      color: var(--color-neutral-800);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-plan {
      font-size: var(--font-size-caption);
      color: var(--color-neutral-600);
      margin: 0;
    }
  }
`;

const overlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
`;

const NavItem: React.FC<{
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
}> = ({ item, isActive, isCollapsed }) => (
  <Link
    to={item.path}
    css={navItemStyles(isActive, isCollapsed)}
    className={clsx('nav-item', { active: isActive })}
  >
    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
    <span className="nav-label">{item.label}</span>
    {item.badge && !isCollapsed && (
      <span className="nav-badge">{item.badge}</span>
    )}
    {item.badge && isCollapsed && (
      <span className="collapsed-badge">{item.badge}</span>
    )}
  </Link>
);

const UserMenu: React.FC<{ user: User; isCollapsed: boolean }> = ({ user, isCollapsed }) => {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div css={userMenuStyles(isCollapsed)} className="user-menu-trigger">
      <div className="user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          initials
        )}
      </div>
      <div className="user-info">
        <p className="user-name">{user.name}</p>
        <p className="user-plan">{user.plan} Plan</p>
      </div>
    </div>
  );
};

export const Navigation: React.FC<NavigationProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  user
}) => {
  const location = useLocation();
  const { isMobile } = useResponsive();

  return (
    <>
      {isMobile && !isCollapsed && (
        <div css={overlayStyles} onClick={onToggleCollapse} />
      )}
      
      <motion.nav
        css={sidebarStyles(isCollapsed, isMobile)}
        initial={false}
        animate={{
          width: isMobile ? (isCollapsed ? 0 : 280) : (isCollapsed ? 64 : 280)
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="main-navigation"
        role="navigation"
        aria-label="Main navigation"
      >
        <div css={headerStyles}>
          <div className="brand">
            <div className="logo" aria-hidden="true">G</div>
            {!isCollapsed && <h1>Gen.C Alpha</h1>}
          </div>
          
          <Button
            variant="subtle"
            size="small"
            onClick={onToggleCollapse}
            iconBefore={isCollapsed ? '→' : '←'}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          />
        </div>
        
        <div css={contentStyles}>
          {navigationData.map(section => (
            <div key={section.section} className="nav-section">
              {!isCollapsed && (
                <div className="section-title">
                  {section.section}
                </div>
              )}
              
              {section.items.map(item => (
                <NavItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          ))}
        </div>
        
        <div css={footerStyles}>
          <NavItem
            item={{ path: '/settings', label: 'Settings', icon: '⚙️', badge: '' }}
            isActive={location.pathname === '/settings'}
            isCollapsed={isCollapsed}
          />
          
          <div className="user-menu">
            <UserMenu user={user} isCollapsed={isCollapsed} />
          </div>
        </div>
      </motion.nav>
    </>
  );
};