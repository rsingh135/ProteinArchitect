import React from 'react';
import { Sun, Moon } from 'lucide-react';
import SearchBar from './SearchBar';
import { useThemeStore } from '../../store/themeStore';

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav className={`border-b sticky top-0 z-50 shadow-sm transition-colors ${
      theme === 'dark'
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <h1 className={`text-3xl font-display font-bold tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            ProteinArchitect
          </h1>
          <span className={`text-base hidden md:block font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            AI-Powered Molecular Discovery
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
