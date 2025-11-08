import React, { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Searching for:', query);
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className={`relative flex items-center rounded-lg border transition-all ${
        isFocused ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-300'
      } bg-white`}>
        <div className="absolute left-4 flex items-center pointer-events-none">
          <Sparkles className={`w-4 h-4 ${isFocused ? 'text-primary-500' : 'text-gray-400'}`} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search proteins... e.g., 'human insulin' or 'P01308'"
          className="w-full bg-transparent pl-11 pr-24 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-2 px-4 py-1.5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
