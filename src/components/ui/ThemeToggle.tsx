import React from 'react';
import { useTheme, type ThemeMode } from '../../contexts/ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { colorMode, setColorMode, currentTheme } = useTheme();

  const toggleStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'var(--color-surface-elevated, #F4F5F7)',
    border: '1px solid var(--color-border, #DFE1E6)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-primary, #172B4D)',
    transition: 'all 0.2s ease',
    minWidth: '120px',
    justifyContent: 'space-between' as const,
  };

  const iconStyles = {
    fontSize: '1rem',
    lineHeight: 1,
  };

  const getThemeIcon = (mode: ThemeMode) => {
    return mode === 'light' ? '☀️' : '🌙';
  };

  const getThemeLabel = (mode: ThemeMode) => {
    return mode === 'light' ? 'Light' : 'Dark';
  };

  const toggleTheme = () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light';
    
    console.log('🔄 Theme Toggle Clicked');
    console.log('Current mode:', colorMode);
    console.log('Switching to:', newMode);
    
    setColorMode(newMode);
  };

  return (
    <button
      onClick={toggleTheme}
      style={toggleStyles}
      title={`Current theme: ${getThemeLabel(colorMode)}. Click to switch to ${getThemeLabel(colorMode === 'light' ? 'dark' : 'light')}.`}
      aria-label={`Switch theme. Currently using ${getThemeLabel(colorMode)} theme.`}
    >
      <span style={iconStyles}>
        {getThemeIcon(colorMode)}
      </span>
      <span>
        {getThemeLabel(colorMode)}
      </span>
    </button>
  );
};

export { ThemeToggle };