import React from 'react';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { 
  Instagram, 
  Youtube, 
  Music, // Using Music as TikTok proxy since lucide doesn't have TikTok
  Twitter,
  Linkedin,
  Facebook,
  Globe
} from 'lucide-react';
import { Platform } from '../../types';

export interface PlatformIconProps {
  platform: Platform;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'colored' | 'badge';
  className?: string;
  testId?: string;
}

const getPlatformIcon = (platform: Platform) => {
  switch (platform) {
    case 'instagram':
      return Instagram;
    case 'youtube':
      return Youtube;
    case 'tiktok':
      return Music; // Using Music icon as proxy for TikTok
    case 'twitter':
      return Twitter;
    case 'linkedin':
      return Linkedin;
    case 'facebook':
      return Facebook;
    default:
      return Globe;
  }
};

const getPlatformColor = (platform: Platform) => {
  switch (platform) {
    case 'instagram':
      return '#E4405F';
    case 'youtube':
      return '#FF0000';
    case 'tiktok':
      return '#000000';
    case 'twitter':
      return '#1DA1F2';
    case 'linkedin':
      return '#0077B5';
    case 'facebook':
      return '#1877F2';
    default:
      return 'var(--color-neutral-500)';
  }
};

const getIconStyles = (
  size: PlatformIconProps['size'],
  variant: PlatformIconProps['variant'],
  platform: Platform
) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  /* Size variants */
  ${size === 'small' && css`
    width: 16px;
    height: 16px;
  `}
  
  ${size === 'medium' && css`
    width: 20px;
    height: 20px;
  `}
  
  ${size === 'large' && css`
    width: 24px;
    height: 24px;
  `}
  
  /* Variant styles */
  ${variant === 'default' && css`
    color: var(--color-neutral-600);
  `}
  
  ${variant === 'colored' && css`
    color: ${getPlatformColor(platform)};
  `}
  
  ${variant === 'badge' && css`
    background: ${getPlatformColor(platform)};
    color: white;
    border-radius: var(--radius-full);
    padding: 4px;
    
    ${size === 'small' && css`
      width: 24px;
      height: 24px;
      
      svg {
        width: 12px;
        height: 12px;
      }
    `}
    
    ${size === 'medium' && css`
      width: 28px;
      height: 28px;
      
      svg {
        width: 16px;
        height: 16px;
      }
    `}
    
    ${size === 'large' && css`
      width: 32px;
      height: 32px;
      
      svg {
        width: 20px;
        height: 20px;
      }
    `}
  `}
`;

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 'medium',
  variant = 'default',
  className,
  testId,
  ...props
}) => {
  const IconComponent = getPlatformIcon(platform);
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <div
      css={getIconStyles(size, variant, platform)}
      className={clsx('gen-platform-icon', className)}
      data-testid={testId}
      title={platformLabel}
      aria-label={`${platformLabel} platform`}
      {...props}
    >
      <IconComponent />
    </div>
  );
};

PlatformIcon.displayName = 'PlatformIcon';

// Export platform-specific icon components for convenience
export const InstagramIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="instagram" {...props} />
);

export const YouTubeIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="youtube" {...props} />
);

export const TikTokIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="tiktok" {...props} />
);

export const TwitterIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="twitter" {...props} />
);

export const LinkedInIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="linkedin" {...props} />
);

export const FacebookIcon: React.FC<Omit<PlatformIconProps, 'platform'>> = (props) => (
  <PlatformIcon platform="facebook" {...props} />
);