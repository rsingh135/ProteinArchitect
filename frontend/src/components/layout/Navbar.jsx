import React from 'react';
import { Upload, Settings, HelpCircle } from 'lucide-react';
import SearchBar from './SearchBar';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">
            ProteinViz
          </h1>
          <span className="text-gray-500 text-sm hidden md:block">
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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Upload Sequence"
          >
            <Upload className="w-5 h-5 text-gray-600" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
