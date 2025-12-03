/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Dark/Light Theme Customization
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Theme toggle, persistence, system detection, and custom color scheme support
 */

// src/theme/themeManager.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'app-theme-preference';

/**
 * Theme Manager - Handles light/dark mode
 */
export class ThemeManager {
  static getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  static getSavedTheme() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(THEME_KEY);
  }

  static saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  static getCurrentTheme() {
    const saved = this.getSavedTheme();
    if (saved) return saved;
    return this.getSystemTheme();
  }

  static setTheme(theme) {
    const html = document.documentElement;
    this.saveTheme(theme);

    if (theme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }
  }

  static toggleTheme() {
    const current = this.getCurrentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }
}

/**
 * Theme Context
 */
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => ThemeManager.getCurrentTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    ThemeManager.setTheme(theme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    ThemeManager.setTheme(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook for using theme
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Theme Toggle Component
 */
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      } ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l1.414 1.414a1 1 0 001.414-1.414l-1.414-1.414a1 1 0 00-1.414 1.414zm2.828-2.828l1.414-1.414a1 1 0 00-1.414-1.414l-1.414 1.414a1 1 0 001.414 1.414zm-4.464-4.464l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414a1 1 0 00-1.414-1.414zM3 12a1 1 0 100-2H1a1 1 0 100 2h2zm2 2a1 1 0 01-2 1.414L1.707 13.707a1 1 0 00-1.414 1.414L1.293 16a1 1 0 101.414 1.414L3.12 16.12A1 1 0 015 14zm10 0a1 1 0 01 1 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

/**
 * Color Scheme Hook - Get theme-aware colors
 */
export const useColorScheme = () => {
  const { theme } = useTheme();

  const colors = {
    light: {
      bg: '#ffffff',
      text: '#1f2937',
      secondary: '#6b7280',
      border: '#e5e7eb',
      hover: '#f3f4f6',
      input: '#f9fafb',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    dark: {
      bg: '#111827',
      text: '#f3f4f6',
      secondary: '#d1d5db',
      border: '#374151',
      hover: '#1f2937',
      input: '#1f2937',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
  };

  return colors[theme];
};

/**
 * CSS Variables for theming
 */
export const useThemeCSSVariables = () => {
  const colors = useColorScheme();

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [colors]);
};

/**
 * Theme-aware text colors
 */
export const getTextColor = (theme) => {
  return theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
};

/**
 * Theme-aware background colors
 */
export const getBgColor = (theme) => {
  return theme === 'dark' ? 'bg-gray-900' : 'bg-white';
};

/**
 * Theme-aware border colors
 */
export const getBorderColor = (theme) => {
  return theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
};

/**
 * Theme-aware card styles
 */
export const getCardStyles = (theme) => {
  return {
    light: 'bg-white border-gray-200',
    dark: 'bg-gray-800 border-gray-700',
  }[theme];
};

/**
 * Complete tailwind dark mode setup for tailwind.config.js:
 * 
 * module.exports = {
 *   darkMode: 'class',
 *   theme: {
 *     extend: {
 *       colors: {
 *         dark: {
 *           50: '#f9fafb',
 *           100: '#f3f4f6',
 *           200: '#e5e7eb',
 *           300: '#d1d5db',
 *           400: '#9ca3af',
 *           500: '#6b7280',
 *           600: '#4b5563',
 *           700: '#374151',
 *           800: '#1f2937',
 *           900: '#111827',
 *         },
 *       },
 *     },
 *   },
 * }
 */

export default {
  ThemeManager,
  ThemeProvider,
  useTheme,
  ThemeToggle,
  useColorScheme,
  useThemeCSSVariables,
  getTextColor,
  getBgColor,
  getBorderColor,
  getCardStyles,
};
