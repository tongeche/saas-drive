import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = "", showLabel = true, size = "normal" }) {
  const { themePreference, setTheme, getThemeDisplayName, THEME_OPTIONS } = useTheme();

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case THEME_OPTIONS.LIGHT:
        return faSun;
      case THEME_OPTIONS.DARK:
        return faMoon;
      case THEME_OPTIONS.SYSTEM:
        return faDesktop;
      default:
        return faDesktop;
    }
  };

  const getThemeColors = (theme, isActive) => {
    if (isActive) {
      switch (theme) {
        case THEME_OPTIONS.LIGHT:
          return "bg-yellow-100 text-yellow-800 border-yellow-300";
        case THEME_OPTIONS.DARK:
          return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
        case THEME_OPTIONS.SYSTEM:
          return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
        default:
          return "bg-gray-100 text-gray-800 border-gray-300";
      }
    }
    return "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700";
  };

  const buttonSize = size === "small" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  const iconSize = size === "small" ? "w-3 h-3" : "w-4 h-4";

  // Compact toggle for small spaces (just icons)
  if (!showLabel) {
    return (
      <div className={`flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden ${className}`}>
        {Object.values(THEME_OPTIONS).map((theme) => {
          const isActive = themePreference === theme;
          return (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`
                ${buttonSize} transition-colors border-r border-gray-200 dark:border-gray-600 last:border-r-0
                ${getThemeColors(theme, isActive)}
              `}
              title={getThemeDisplayName(theme)}
            >
              <FontAwesomeIcon icon={getThemeIcon(theme)} className={iconSize} />
            </button>
          );
        })}
      </div>
    );
  }

  // Full toggle with labels
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme Preference
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {Object.values(THEME_OPTIONS).map((theme) => {
          const isActive = themePreference === theme;
          return (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`
                ${buttonSize} rounded-lg border transition-colors flex items-center gap-2 justify-center
                ${getThemeColors(theme, isActive)}
              `}
            >
              <FontAwesomeIcon icon={getThemeIcon(theme)} className={iconSize} />
              <span>{getThemeDisplayName(theme)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Dropdown version for settings pages
export function ThemeDropdown({ className = "" }) {
  const { themePreference, setTheme, getThemeDisplayName, THEME_OPTIONS } = useTheme();

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Theme
      </label>
      <select
        value={themePreference}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
      >
        {Object.values(THEME_OPTIONS).map((theme) => (
          <option key={theme} value={theme}>
            {getThemeDisplayName(theme)}
          </option>
        ))}
      </select>
    </div>
  );
}

// Mini toggle for header/toolbar
export function ThemeToggleMini({ className = "" }) {
  const { themePreference, setTheme, getThemeDisplayName, THEME_OPTIONS } = useTheme();

  const cycleTheme = () => {
    const themes = Object.values(THEME_OPTIONS);
    const currentIndex = themes.indexOf(themePreference);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (themePreference) {
      case THEME_OPTIONS.LIGHT:
        return faSun;
      case THEME_OPTIONS.DARK:
        return faMoon;
      case THEME_OPTIONS.SYSTEM:
        return faDesktop;
      default:
        return faDesktop;
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={`
        p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 
        dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700
        transition-colors ${className}
      `}
      title={`Current: ${getThemeDisplayName(themePreference)}. Click to cycle themes.`}
    >
      <FontAwesomeIcon icon={getThemeIcon()} className="w-4 h-4" />
    </button>
  );
}