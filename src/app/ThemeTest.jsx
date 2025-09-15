import React from 'react';
import { ThemeToggleMini, ThemeDropdown } from '../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeTest() {
  const { themePreference, actualTheme } = useTheme();

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Theme Test Page
        </h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              Current theme preference: <strong>{themePreference}</strong>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Actual theme applied: <strong>{actualTheme}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Theme Controls
            </h3>
            
            {/* Large red background for visibility */}
            <div className="bg-red-200 p-4 rounded">
              <h4 className="font-medium mb-2">ThemeToggleMini (in red background):</h4>
              <ThemeToggleMini />
            </div>

            {/* ThemeDropdown */}
            <div className="bg-green-200 p-4 rounded">
              <h4 className="font-medium mb-2">ThemeDropdown (in green background):</h4>
              <ThemeDropdown />
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <p className="text-blue-900 dark:text-blue-100">
              This background should change color when you switch between light and dark themes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}