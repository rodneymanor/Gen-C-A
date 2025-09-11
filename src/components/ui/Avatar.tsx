import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'circular' | 'rounded';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  className?: string;
  testId?: string;
}

const getAvatarStyles = (
  size: AvatarProps['size'],
  variant: AvatarProps['variant']
) => css`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  color: white;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  flex-shrink: 0;
  overflow: hidden;
  
  /* Size variants */
  ${size === 'small' && css`
    width: 24px;
    height: 24px;
    font-size: var(--font-size-caption);
  `}
  
  ${size === 'medium' && css`
    width: 32px;
    height: 32px;
    font-size: var(--font-size-body-small);
  `}
  
  ${size === 'large' && css`
    width: 48px;
    height: 48px;
    font-size: var(--font-size-body);
  `}
  
  ${size === 'xlarge' && css`
    width: 64px;
    height: 64px;
    font-size: var(--font-size-h5);
  `}
  
  /* Shape variants */
  ${variant === 'circular' && css`
    border-radius: var(--radius-full);
  `}
  
  ${variant === 'rounded' && css`
    border-radius: var(--radius-medium);
  `}
  
  /* Image styles */
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const statusIndicatorStyles = (size: AvatarProps['size'], status: AvatarProps['status']) => css`
  position: absolute;
  border: 2px solid var(--color-neutral-0);
  border-radius: var(--radius-full);
  
  /* Size positioning */
  ${size === 'small' && css`
    width: 8px;
    height: 8px;
    bottom: -1px;
    right: -1px;
  `}
  
  ${size === 'medium' && css`
    width: 10px;
    height: 10px;
    bottom: -1px;
    right: -1px;
  `}
  
  ${size === 'large' && css`
    width: 12px;
    height: 12px;
    bottom: 0;
    right: 0;
  `}
  
  ${size === 'xlarge' && css`
    width: 16px;
    height: 16px;
    bottom: 2px;
    right: 2px;
  `}
  
  /* Status colors */
  ${status === 'online' && css`
    background: var(--color-success-500);
  `}
  
  ${status === 'offline' && css`
    background: var(--color-neutral-400);
  `}
  
  ${status === 'away' && css`
    background: var(--color-warning-500);
  `}
  
  ${status === 'busy' && css`
    background: var(--color-error-500);
  `}
`;

// Generate initials from a name
const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials,
  name = '',
  size = 'medium',
  variant = 'circular',
  status,
  showStatus = false,
  className,
  testId,
  ...props
}) => {
  const displayInitials = initials || generateInitials(name);
  const displayAlt = alt || name || 'Avatar';

  return (
    <div
      css={getAvatarStyles(size, variant)}
      className={clsx('gen-avatar', className)}
      data-testid={testId}
      {...props}
    >
      {src ? (
        <img src={src} alt={displayAlt} />
      ) : (
        <span aria-hidden="true">{displayInitials}</span>
      )}
      
      {showStatus && status && (
        <div
          css={statusIndicatorStyles(size, status)}
          className="avatar-status"
          aria-label={`Status: ${status}`}
          role="img"
        />
      )}
    </div>
  );
};

// Specialized Avatar variants
export const UserAvatar: React.FC<Omit<AvatarProps, 'variant'> & { user: { name: string; avatar?: string } }> = ({
  user,
  ...props
}) => (
  <Avatar
    src={user.avatar}
    name={user.name}
    alt={user.name}
    variant="circular"
    {...props}
  />
);

export const CreatorAvatar: React.FC<Omit<AvatarProps, 'size' | 'variant'> & { creator: string }> = ({
  creator,
  ...props
}) => (
  <Avatar
    name={creator}
    size="small"
    variant="circular"
    {...props}
  />
);

Avatar.displayName = 'Avatar';