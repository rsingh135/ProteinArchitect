import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X } from 'lucide-react';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Mock suggestions based on query
  const mockSuggestions = [
    { id: 'P01308', name: 'Human Insulin', organism: 'Homo sapiens', type: 'Protein' },
    { id: 'P0DTC2', name: 'SARS-CoV-2 Spike Protein', organism: 'SARS-CoV-2', type: 'Protein' },
    { id: 'P69905', name: 'Hemoglobin Alpha', organism: 'Homo sapiens', type: 'Protein' },
    { id: 'P04637', name: 'Cellular tumor antigen p53', organism: 'Homo sapiens', type: 'Protein' },
    { id: 'P00533', name: 'EGFR - Epidermal growth factor receptor', organism: 'Homo sapiens', type: 'Protein' },
  ];

  useEffect(() => {
    if (query.length > 2) {
      // Filter suggestions based on query
      const filtered = mockSuggestions.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.id.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('Searching for:', query);
      // TODO: Implement actual search
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    console.log('Selected:', suggestion);
    // TODO: Load protein data
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <div
          className={`relative flex items-center rounded-xl transition-all duration-300 ${
            isFocused
              ? 'ring-2 ring-neon-cyan shadow-neon-cyan bg-dark-elevated'
              : 'bg-dark-surface hover:bg-dark-elevated'
          }`}
        >
          {/* AI Icon */}
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Sparkles
              className={`w-5 h-5 transition-colors duration-300 ${
                isFocused ? 'text-neon-cyan' : 'text-gray-500'
              }`}
            />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Ask me anything... e.g., 'human insulin receptor' or 'SARS spike protein'"
            className="w-full bg-transparent pl-12 pr-24 py-3 text-sm text-white placeholder-gray-500 outline-none"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 p-1 rounded-full hover:bg-dark-hover transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium hover:shadow-neon-cyan transition-all duration-300 hover:scale-105"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass rounded-xl border border-dark-border shadow-glass overflow-hidden animate-fade-in z-50">
          <div className="py-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 hover:bg-dark-hover transition-colors text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium group-hover:text-neon-cyan transition-colors">
                        {suggestion.name}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {suggestion.id}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {suggestion.organism}
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-dark-elevated text-xs text-neon-green border border-neon-green/30">
                    {suggestion.type}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-dark-border px-4 py-2 bg-dark-surface/50">
            <p className="text-xs text-gray-500">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Powered by AI - Natural language search enabled
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
