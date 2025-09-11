// Utility functions for formatting data in Gen.C Alpha Dashboard

import { formatDistanceToNow, format as dateFnsFormat } from 'date-fns';

/**
 * Format a duration in seconds to a human-readable string (e.g., "1:23", "0:15")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format a number of views/likes/etc with abbreviated suffixes (e.g., "1.2K", "847K", "1.2M")
 */
export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  } else if (count < 1000000000) {
    return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  } else {
    return `${(count / 1000000000).toFixed(1).replace('.0', '')}B`;
  }
};

/**
 * Format view count - alias for formatCount
 */
export const formatViewCount = formatCount;

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "Yesterday")
 */
export const formatRelativeTime = (date: Date): string => {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Format a date to a standard date string
 */
export const formatDate = (date: Date, formatString: string = 'MMM d, yyyy'): string => {
  try {
    return dateFnsFormat(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date to a full date and time string
 */
export const formatDateTime = (date: Date): string => {
  return formatDate(date, 'MMM d, yyyy \'at\' h:mm a');
};

/**
 * Truncate text to a specified length with ellipsis
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
};

/**
 * Format file size in bytes to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert a string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Get platform-specific icon identifier
 */
export const getPlatformIcon = (platform: string): string => {
  const platformIcons: Record<string, string> = {
    'tiktok': 'mobile',
    'instagram': 'image', 
    'youtube': 'video',
    'twitter': 'person',
    'linkedin': 'office',
    'facebook': 'people',
    'other': 'world',
  };
  
  return platformIcons[platform.toLowerCase()] || platformIcons.other;
};

/**
 * Get content type icon identifier
 */
export const getContentTypeIcon = (type: string): string => {
  const typeIcons: Record<string, string> = {
    'video': 'video',
    'script': 'edit',
    'image': 'image',
    'note': 'document',
    'idea': 'lightbulb',
    'audio': 'audio',
    'collection': 'folder',
  };
  
  return typeIcons[type.toLowerCase()] || 'document';
};

/**
 * Generate initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format a script word count to estimated reading time
 */
export const formatReadingTime = (wordCount: number): string => {
  // Average reading speed: ~200 words per minute
  const minutes = Math.ceil(wordCount / 200);
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
};

/**
 * Format a script word count to estimated speaking time
 */
export const formatSpeakingTime = (wordCount: number): string => {
  // Average speaking speed: ~150 words per minute
  const totalSeconds = Math.ceil((wordCount / 150) * 60);
  return formatDuration(totalSeconds);
};

/**
 * Generate a random color from a predefined palette
 */
export const generateRandomColor = (): string => {
  const colors = [
    'var(--color-creative-purple)',
    'var(--color-creative-blue)',
    'var(--color-creative-green)',
    'var(--color-creative-pink)',
    'var(--color-primary-400)',
    'var(--color-primary-500)',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Debounce function for search and input handling
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Check if a string is a valid URL
 */
export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'unknown';
  }
};