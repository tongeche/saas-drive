import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme options
export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Create theme context
const ThemeContext = createContext();

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Get system preference
function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// Get stored theme preference or default
function getStoredTheme() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme-preference');
    if (stored && Object.values(THEME_OPTIONS).includes(stored)) {
      return stored;
    }
  }
  return THEME_OPTIONS.LIGHT; // Default to light mode instead of system
}

// Apply theme to document
function applyTheme(actualTheme) {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    
    // Remove both classes first to ensure clean state
    root.classList.remove('dark');
    root.classList.remove('light');
    
    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      // Explicitly add light class for consistency
      root.classList.add('light');
    }
  }
}

// Theme provider component
export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Calculate actual theme based on preference and system
  const actualTheme = themePreference === THEME_OPTIONS.SYSTEM ? systemTheme : themePreference;

  // Initialize theme on mount
  useEffect(() => {
    // Apply theme immediately on mount
    applyTheme(actualTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(actualTheme);
  }, [actualTheme]);

  // Save theme preference
  const setTheme = (newTheme) => {
    if (Object.values(THEME_OPTIONS).includes(newTheme)) {
      setThemePreference(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme-preference', newTheme);
      }
    }
  };

  // Get theme display name
  const getThemeDisplayName = (theme) => {
    switch (theme) {
      case THEME_OPTIONS.LIGHT:
        return 'Light';
      case THEME_OPTIONS.DARK:
        return 'Dark';
      case THEME_OPTIONS.SYSTEM:
        return `System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`;
      default:
        return 'Unknown';
    }
  };

  // Check if current theme is dark
  const isDark = actualTheme === 'dark';

  const value = {
    // Current state
    themePreference,
    systemTheme,
    actualTheme,
    isDark,
    
    // Actions
    setTheme,
    
    // Utilities
    getThemeDisplayName,
    THEME_OPTIONS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Higher-order component for theme-aware components
export function withTheme(Component) {
  return function ThemedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}