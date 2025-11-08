import React from 'react';
import { Search, Upload, Settings, HelpCircle } from 'lucide-react';
import SearchBar from './SearchBar';

const Navbar = () => {
  return (
    <nav className="glass border-b border-dark-border backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple blur-md opacity-50 animate-glow-pulse"></div>
            <h1 className="relative text-2xl font-bold gradient-text">
              ProteinViz
            </h1>
          </div>
          <span className="text-gray-400 text-sm hidden md:block">
            AI-Powered Molecular Analysis
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-lg hover:bg-dark-hover transition-colors group relative"
            title="Upload Sequence"
          >
            <Upload className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan transition-colors" />
            <div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-lg"></div>
          </button>

          <button
            className="p-2 rounded-lg hover:bg-dark-hover transition-colors group relative"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-neon-green transition-colors" />
            <div className="absolute inset-0 bg-neon-green opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-lg"></div>
          </button>

          <button
            className="p-2 rounded-lg hover:bg-dark-hover transition-colors group relative"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-neon-magenta transition-colors" />
            <div className="absolute inset-0 bg-neon-magenta opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-lg"></div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
