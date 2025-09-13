import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import type { NavigationItem, NavigationSection, User } from '../../types';

// Atlassian Design System Icons
import HomeIcon from '@atlaskit/icon/glyph/home';
import FolderIcon from '@atlaskit/icon/glyph/folder';
import BookIcon from '@atlaskit/icon/glyph/book';
import EditIcon from '@atlaskit/icon/glyph/edit';
import PeopleIcon from '@atlaskit/icon/glyph/people';
import AddonIcon from '@atlaskit/icon/glyph/addon';
import MobileIcon from '@atlaskit/icon/glyph/mobile';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
import ArrowLeftIcon from '@atlaskit/icon/glyph/arrow-left';
import LayoutTwoColumnsSidebarLeftIcon from '@atlaskit/icon/core/migration/layout-two-columns-sidebar-left--editor-layout-two-left-sidebar';
import VideoIcon from '@atlaskit/icon/glyph/video-filled';
import ChannelIcon from '@atlaskit/icon/glyph/people-group';
import MoreIcon from '@atlaskit/icon/glyph/more';

export interface NavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  user: User;
}

const navigationData: NavigationSection[] = [
  {
    section: 'Content',
    items: [
      { path: '/dashboard', label: 'Home', icon: <HomeIcon label="Home" /> },
      { path: '/write', label: 'Write', icon: <EditIcon label="Write" /> },
      { path: '/collections', label: 'Collections', icon: <FolderIcon label="Collections" /> },
      { path: '/library', label: 'Library', icon: <BookIcon label="Library" /> },
      { path: '/videos', label: 'Videos', icon: <VideoIcon label="Videos" /> },
      { path: '/channels', label: 'Channels', icon: <ChannelIcon label="Channels" /> },
    ]
  },
  {
    section: 'Brand',
    items: [
      { path: '/brand-hub', label: 'Brand Hub', icon: <PeopleIcon label="Brand Hub" /> }
    ]
  },
  {
    section: 'Tools',
    items: [
      { path: '/extensions', label: 'Extensions', icon: <AddonIcon label="Extensions" /> },
      { path: '/mobile', label: 'Mobile Shortcuts', icon: <MobileIcon label="Mobile Shortcuts" /> }
    ]
  }
];

const expandedLogoStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-1);

  span {
    color: var(--color-neutral-800);
    font-size: var(--font-size-h5);
    font-weight: var(--font-weight-bold);
  }

  .logo-dot {
    background: var(--color-primary-500);
    height: 8px;
    width: 8px;
    border-radius: var(--radius-pill);
  }
`;

const sidebarStyles = (isCollapsed: boolean, isMobile: boolean) => css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-neutral-0);
  border-right: 1px solid var(--color-neutral-200);
  transition: var(--transition-all);
  position: ${isMobile ? 'fixed' : 'relative'};
  z-index: 100;

  ${isMobile ? css`
    /* Mobile: fixed positioned overlay */
    left: 0;
    top: 0;
    width: ${isCollapsed ? '0' : 'var(--sidebar-width)'};
    overflow: hidden;
    /* REMOVED: Shadow for Perplexity flat design */
  ` : css`
    /* Desktop: relative positioned sidebar */
    width: ${isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'};
    min-width: ${isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'};
    flex-shrink: 0;
  `}
`;

const headerStyles = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
  min-height: 64px;

  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    justify-content: left;

    .logo {
      width: 32px;
      height: 32px;
      background: var(--color-primary-500);  /* Bloom Blue - flat design */
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
    box-shadow: var(--focus-ring);  /* Keep focus ring for accessibility */
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
    /* REMOVED: Transform for Perplexity flat design */
    transition: var(--transition-colors);
  }
  
  ${isCollapsed && css`
    justify-content: center;
    padding: var(--space-3);
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
  position: relative;
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
  
  .user-info {
    flex: 1;
    min-width: 0;
    opacity: ${isCollapsed ? '0' : '1'};
    /* REMOVED: Transform for Perplexity flat design */
    transition: var(--transition-colors);
    
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

  .more-button {
    background: none;
    border: none;
    padding: var(--space-1);
    border-radius: var(--radius-small);
    cursor: pointer;
    color: var(--color-neutral-600);
    opacity: ${isCollapsed ? '0' : '1'};
    transition: var(--transition-all);
    
    &:hover {
      background: var(--color-neutral-200);
      color: var(--color-neutral-800);
    }
    
    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }

  .dropdown-menu {
    position: absolute;
    top: -50px;
    right: 0;
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    border-radius: var(--radius-medium);
    box-shadow: var(--elevation-shadow-raised);
    padding: var(--space-1);
    min-width: 120px;
    z-index: 1000;

    .dropdown-item {
      display: block;
      width: 100%;
      padding: var(--space-2) var(--space-3);
      background: none;
      border: none;
      text-align: left;
      color: var(--color-neutral-700);
      font-size: var(--font-size-body-small);
      border-radius: var(--radius-small);
      cursor: pointer;
      transition: var(--transition-colors);

      &:hover {
        background: var(--color-neutral-100);
        color: var(--color-neutral-800);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }
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
    <span className="nav-icon">{item.icon}</span>
    <span className="nav-label">{item.label}</span>
  </Link>
);

const UserMenu: React.FC<{ user: User; isCollapsed: boolean }> = ({ user, isCollapsed }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setShowMenu(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div ref={menuRef} css={userMenuStyles(isCollapsed)} className="user-menu-trigger">
      <Avatar
        src={user.avatar}
        name={user.name}
        size="medium"
        variant="circular"
      />
      {!isCollapsed && (
        <>
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-plan">{user.plan} Plan</p>
          </div>
          <button
            className="more-button"
            onClick={toggleMenu}
            aria-label="User menu"
            aria-expanded={showMenu}
          >
            <MoreIcon label="More options" />
          </button>
          {showMenu && (
            <div className="dropdown-menu" onClick={handleMenuClick}>
              <button className="dropdown-item" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </>
      )}
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
          {!isCollapsed && (
            <Button
              variant="subtle"
              size="small"
              onClick={onToggleCollapse}
              iconBefore={<ArrowLeftIcon label="" />}
              aria-label="Collapse navigation"
            />
          )}

          <div className="brand">
            {isCollapsed ? (
              <button
                onClick={onToggleCollapse}
                aria-label="Expand navigation"
                css={css`
                  background: none;
                  border: none;
                  padding: 0;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: inherit;
                `}
              >
                <LayoutTwoColumnsSidebarLeftIcon label="Gen.C Logo" />
              </button>
            ) : (
              <div css={expandedLogoStyles}>
                <span>Gen</span>
                <div className="logo-dot"></div>
                <span>C</span>
              </div>
            )}
          </div>
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
            item={{ path: '/settings', label: 'Settings', icon: <SettingsIcon label="Settings" /> }}
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