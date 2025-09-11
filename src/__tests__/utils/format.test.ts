import { describe, it, expect, vi } from 'vitest';
import {
  formatDuration,
  formatCount,
  formatRelativeTime,
  formatDate,
  formatDateTime,
  truncate,
  formatFileSize,
  capitalize,
  toTitleCase,
  getPlatformIcon,
  getContentTypeIcon,
  getInitials,
  formatReadingTime,
  formatSpeakingTime,
  generateRandomColor,
  debounce,
  isValidUrl,
  extractDomain,
} from '../../utils/format';

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(15)).toBe('0:15');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('should format hours when duration is over 60 minutes', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3665)).toBe('1:01:05');
    expect(formatDuration(7200)).toBe('2:00:00');
  });

  it('should handle negative values', () => {
    expect(formatDuration(-1)).toBe('0:00');
    expect(formatDuration(-100)).toBe('0:00');
  });

  it('should pad seconds and minutes with zeros', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3605)).toBe('1:00:05');
  });
});

describe('formatCount', () => {
  it('should format small numbers as-is', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(12000)).toBe('12K');
    expect(formatCount(123000)).toBe('123K');
  });

  it('should format millions with M suffix', () => {
    expect(formatCount(1000000)).toBe('1M');
    expect(formatCount(1500000)).toBe('1.5M');
    expect(formatCount(12000000)).toBe('12M');
  });

  it('should format billions with B suffix', () => {
    expect(formatCount(1000000000)).toBe('1B');
    expect(formatCount(1500000000)).toBe('1.5B');
  });

  it('should not show decimal when it would be .0', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1000000)).toBe('1M');
    expect(formatCount(1000000000)).toBe('1B');
  });
});

describe('formatRelativeTime', () => {
  it('should format relative time correctly', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toMatch(/2 hours ago/);
  });

  it('should handle invalid dates gracefully', () => {
    const invalidDate = new Date('invalid');
    const result = formatRelativeTime(invalidDate);
    expect(result).toBe('Unknown time');
  });

  it('should handle recent times', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const result = formatRelativeTime(oneMinuteAgo);
    expect(result).toMatch(/minute ago/);
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');

  it('should format date with default format', () => {
    const result = formatDate(testDate);
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should format date with custom format', () => {
    const result = formatDate(testDate, 'yyyy-MM-dd');
    expect(result).toBe('2024-01-15');
  });

  it('should handle invalid dates', () => {
    const invalidDate = new Date('invalid');
    const result = formatDate(invalidDate);
    expect(result).toBe('Invalid date');
  });
});

describe('formatDateTime', () => {
  it('should format date and time', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    const result = formatDateTime(testDate);
    expect(result).toMatch(/Jan 15, 2024 at \d{1,2}:\d{2} [AP]M/);
  });
});

describe('truncate', () => {
  it('should truncate text longer than specified length', () => {
    expect(truncate('This is a long text', 10)).toBe('This is a...');
    expect(truncate('Hello world', 5)).toBe('Hello...');
  });

  it('should not truncate text shorter than or equal to specified length', () => {
    expect(truncate('Short', 10)).toBe('Short');
    expect(truncate('Exactly ten', 10)).toBe('Exactly ten');
  });

  it('should handle empty strings', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('should trim whitespace before adding ellipsis', () => {
    expect(truncate('Hello world ', 5)).toBe('Hello...');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(999)).toBe('999 Bytes');
  });

  it('should format KB correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10240)).toBe('10 KB');
  });

  it('should format MB correctly', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1572864)).toBe('1.5 MB');
  });

  it('should format GB correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
    expect(formatFileSize(1610612736)).toBe('1.5 GB');
  });
});

describe('capitalize', () => {
  it('should capitalize first letter and lowercase the rest', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('should handle empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle single characters', () => {
    expect(capitalize('a')).toBe('A');
    expect(capitalize('A')).toBe('A');
  });
});

describe('toTitleCase', () => {
  it('should convert strings to title case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('should handle single words', () => {
    expect(toTitleCase('hello')).toBe('Hello');
    expect(toTitleCase('HELLO')).toBe('Hello');
  });

  it('should handle empty strings', () => {
    expect(toTitleCase('')).toBe('');
  });
});

describe('getPlatformIcon', () => {
  it('should return correct icons for known platforms', () => {
    expect(getPlatformIcon('tiktok')).toBe('📱');
    expect(getPlatformIcon('instagram')).toBe('📸');
    expect(getPlatformIcon('youtube')).toBe('🎥');
    expect(getPlatformIcon('twitter')).toBe('🐦');
    expect(getPlatformIcon('linkedin')).toBe('💼');
    expect(getPlatformIcon('facebook')).toBe('👥');
  });

  it('should be case insensitive', () => {
    expect(getPlatformIcon('TIKTOK')).toBe('📱');
    expect(getPlatformIcon('Instagram')).toBe('📸');
    expect(getPlatformIcon('YouTube')).toBe('🎥');
  });

  it('should return default icon for unknown platforms', () => {
    expect(getPlatformIcon('unknown')).toBe('🌐');
    expect(getPlatformIcon('')).toBe('🌐');
  });
});

describe('getContentTypeIcon', () => {
  it('should return correct icons for known content types', () => {
    expect(getContentTypeIcon('video')).toBe('🎥');
    expect(getContentTypeIcon('script')).toBe('✍️');
    expect(getContentTypeIcon('image')).toBe('📸');
    expect(getContentTypeIcon('note')).toBe('📝');
    expect(getContentTypeIcon('idea')).toBe('💡');
    expect(getContentTypeIcon('audio')).toBe('🎵');
    expect(getContentTypeIcon('collection')).toBe('📁');
  });

  it('should be case insensitive', () => {
    expect(getContentTypeIcon('VIDEO')).toBe('🎥');
    expect(getContentTypeIcon('Script')).toBe('✍️');
  });

  it('should return default icon for unknown types', () => {
    expect(getContentTypeIcon('unknown')).toBe('📄');
    expect(getContentTypeIcon('')).toBe('📄');
  });
});

describe('getInitials', () => {
  it('should extract initials from names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Sarah Chen')).toBe('SC');
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('should handle single names', () => {
    expect(getInitials('John')).toBe('J');
    expect(getInitials('Sarah')).toBe('S');
  });

  it('should limit to 2 characters', () => {
    expect(getInitials('John Michael Doe Watson')).toBe('JM');
  });

  it('should handle empty strings', () => {
    expect(getInitials('')).toBe('');
  });

  it('should be uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('formatReadingTime', () => {
  it('should calculate reading time based on 200 words per minute', () => {
    expect(formatReadingTime(200)).toBe('1 min read');
    expect(formatReadingTime(400)).toBe('2 min read');
    expect(formatReadingTime(100)).toBe('1 min read'); // rounds up
    expect(formatReadingTime(50)).toBe('1 min read');
  });

  it('should handle zero words', () => {
    expect(formatReadingTime(0)).toBe('1 min read');
  });

  it('should use singular for 1 minute', () => {
    expect(formatReadingTime(200)).toBe('1 min read');
  });

  it('should use plural for multiple minutes', () => {
    expect(formatReadingTime(600)).toBe('3 min read');
  });
});

describe('formatSpeakingTime', () => {
  it('should calculate speaking time based on 150 words per minute', () => {
    expect(formatSpeakingTime(150)).toBe('1:00');
    expect(formatSpeakingTime(300)).toBe('2:00');
    expect(formatSpeakingTime(75)).toBe('0:30');
  });

  it('should handle zero words', () => {
    expect(formatSpeakingTime(0)).toBe('0:00');
  });

  it('should round up to nearest second', () => {
    expect(formatSpeakingTime(37)).toBe('0:15'); // 37 words = ~14.8 seconds, rounds up to 15
  });
});

describe('generateRandomColor', () => {
  it('should return a valid CSS color variable', () => {
    const color = generateRandomColor();
    expect(color).toMatch(/^var\(--color-/);
  });

  it('should return one of the predefined colors', () => {
    const validColors = [
      'var(--color-creative-purple)',
      'var(--color-creative-blue)',
      'var(--color-creative-green)',
      'var(--color-creative-pink)',
      'var(--color-primary-400)',
      'var(--color-primary-500)',
    ];
    
    // Test multiple times to ensure we get valid colors
    for (let i = 0; i < 10; i++) {
      const color = generateRandomColor();
      expect(validColors).toContain(color);
    }
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls when called again', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn(); // This should cancel the previous call

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('isValidUrl', () => {
  it('should validate correct URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://www.example.com/path')).toBe(true);
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('ftp://example')).toBe(true); // FTP is valid URL
  });

  it('should handle edge cases', () => {
    expect(isValidUrl('javascript:void(0)')).toBe(true); // Valid URL scheme
    expect(isValidUrl('data:text/plain;base64,SGVsbG8=')).toBe(true); // Data URL
  });
});

describe('extractDomain', () => {
  it('should extract domain from valid URLs', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
    expect(extractDomain('http://example.com')).toBe('example.com');
    expect(extractDomain('https://subdomain.example.com/path')).toBe('subdomain.example.com');
  });

  it('should remove www prefix', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
    expect(extractDomain('http://www.subdomain.example.com')).toBe('subdomain.example.com');
  });

  it('should handle invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('unknown');
    expect(extractDomain('')).toBe('unknown');
  });

  it('should handle URLs without www', () => {
    expect(extractDomain('https://example.com')).toBe('example.com');
    expect(extractDomain('https://api.example.com')).toBe('api.example.com');
  });
});