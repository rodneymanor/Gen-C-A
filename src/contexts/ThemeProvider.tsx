import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setGlobalTheme, useThemeObserver, token } from '@atlaskit/tokens';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colorMode: ThemeMode;
  setColorMode: (mode: ThemeMode) => void;
  currentTheme: 'light' | 'dark'; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Simple theme state - no system preference complications
  const [colorMode, setColorModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-preference');
    return (stored as ThemeMode) || 'light';
  });

  // Use Atlaskit's theme observer to get current applied theme
  const theme = useThemeObserver();
  const currentTheme: 'light' | 'dark' = theme.colorMode === 'dark' ? 'dark' : 'light';

  // Apply theme changes - simple and clean
  useEffect(() => {
    console.group('🎨 Simple Theme Update');
    console.log('User Selected Theme:', colorMode);
    
    // Try to set Atlaskit theme (optional - won't break if it fails)
    try {
      setGlobalTheme({
        colorMode: colorMode,
        dark: 'dark',
        light: 'light'
      });
      console.log('✅ Atlaskit theme set to:', colorMode);
    } catch (error) {
      console.log('⚠️ Atlaskit theme failed, using CSS fallback');
    }
    
    // Set HTML attributes for our CSS system (this is what actually works)
    document.documentElement.setAttribute('data-color-mode', colorMode);
    document.documentElement.setAttribute('data-theme', `${colorMode}:${colorMode}`);
    
    // Save preference
    localStorage.setItem('theme-preference', colorMode);
    
    // DEBUG: Check actual applied styles
    console.log('🎯 Applied theme:', colorMode);
    console.log('📋 HTML data-color-mode:', document.documentElement.getAttribute('data-color-mode'));
    console.log('📋 HTML data-theme:', document.documentElement.getAttribute('data-theme'));
    
    // Check computed styles on body/html
    const htmlStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);
    
    console.log('🎨 CSS Variables Debug:');
    console.log('  --color-surface (html):', htmlStyles.getPropertyValue('--color-surface'));
    console.log('  --color-text-primary (html):', htmlStyles.getPropertyValue('--color-text-primary'));
    console.log('  background-color (body):', bodyStyles.backgroundColor);
    console.log('  color (body):', bodyStyles.color);
    
    // Check if Atlaskit CSS variables exist
    console.log('🅰️ Atlaskit Tokens Debug:');
    console.log('  --ds-surface:', htmlStyles.getPropertyValue('--ds-surface'));
    console.log('  --ds-text:', htmlStyles.getPropertyValue('--ds-text'));
    
    console.groupEnd();
  }, [colorMode]);

  const setColorMode = (mode: ThemeMode) => {
    setColorModeState(mode);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        colorMode, 
        setColorMode, 
        currentTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};