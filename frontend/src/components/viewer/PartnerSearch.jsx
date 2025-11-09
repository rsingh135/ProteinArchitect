import React, { useState, useRef } from 'react';
import { Search, X, Sparkles, Loader, Eye } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import { ProteinService } from '../../services/proteinService';

const PartnerSearch = ({ isOpen, onClose, onPartnerAdded }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  
  const { setBinderProtein, setIsLoading } = useProteinStore();
  const { theme } = useThemeStore();

  // Perform the actual search
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting partner search for:', searchQuery);
      
      // Search for protein using the service
      const proteinData = await ProteinService.searchProtein(searchQuery);
      console.log('✅ Partner protein data received:', proteinData);
      
      // Fetch the structure file
      const pdbData = await ProteinService.fetchStructure(proteinData, 'pdb');
      console.log('✅ Partner PDB structure loaded');
      
      // Update store with binder protein data
      setBinderProtein({
        ...proteinData,
        pdbData, // Include PDB data for viewer
      });
      
      console.log('✅ Partner loaded successfully:', proteinData.name);
      
      // Close dialog and notify parent
      onPartnerAdded();
      onClose();
      
    } catch (err) {
      console.error('❌ Partner search failed:', err);
      setError(err.message);
      
      // Show error notification
      alert(`Failed to load partner protein: ${err.message}\n\nTry using a UniProt ID like 'P01308' (human insulin)`);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsFocused(false);
    performSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle clicking on example - this triggers the search directly
  const handleExampleClick = async (exampleText) => {
    console.log('📌 Partner example clicked:', exampleText);
    setQuery(exampleText);
    setIsFocused(false);
    
    // Perform search immediately
    performSearch(exampleText);
  };

  const examples = [
    { text: 'P01308', desc: 'Human Insulin' },
    { text: 'P04637', desc: 'Tumor Protein p53' },
    { text: 'P69905', desc: 'Hemoglobin Alpha' },
    { text: 'human insulin', desc: 'Search by name' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between z-10 transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-display font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add Binding Partner</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Search for a protein to visualize as a binding partner</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="relative mb-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className={`relative flex items-center rounded-lg border transition-all ${
                error 
                  ? 'border-red-500 ring-2 ring-red-100' 
                  : isFocused 
                  ? 'border-primary-500 ring-2 ring-primary-100' 
                  : theme === 'dark'
                  ? 'border-gray-600'
                  : 'border-gray-300'
              } ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="absolute left-4 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader className="w-4 h-4 text-primary-500 animate-spin" />
                  ) : (
                    <Sparkles className={`w-4 h-4 ${isFocused ? 'text-primary-500' : 'text-gray-400'}`} />
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    // Delay hiding to allow click on examples
                    setTimeout(() => setIsFocused(false), 200);
                  }}
                  placeholder="Search proteins... e.g., 'human insulin' or 'P01308'"
                  className={`w-full bg-transparent pl-11 pr-24 py-2.5 text-sm outline-none ${
                    theme === 'dark'
                      ? 'text-white placeholder-gray-400'
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={isSearching}
                  autoFocus
                />

                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`absolute right-12 p-1 rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-600 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    disabled={isSearching}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 px-4 py-1.5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
            
            {/* Error message */}
            {error && (
              <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 z-50">
                {error}
              </div>
            )}
            
            {/* Search suggestions */}
            {isFocused && !query && !isSearching && (
              <div 
                className={`absolute top-full mt-2 left-0 right-0 border rounded-lg shadow-lg p-3 z-50 transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
                onMouseDown={(e) => {
                  // Prevent input blur when clicking on examples
                  e.preventDefault();
                }}
              >
                <p className={`text-xs mb-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Try these examples:</p>
                <div className="space-y-1">
                  {examples.map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleExampleClick(example.text)}
                      onMouseDown={(e) => {
                        // Prevent input blur
                        e.preventDefault();
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-mono ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>{example.text}</span>
                      <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>- {example.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className={`border rounded-lg p-4 transition-colors ${
            theme === 'dark'
              ? 'bg-blue-900/20 border-blue-800/50'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start space-x-3">
              <Eye className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>About Binding Partners</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  Search for a protein that interacts with your target protein. The partner will be displayed 
                  in the right viewer alongside your target protein for comparison and interaction analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSearch;

