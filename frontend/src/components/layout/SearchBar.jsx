import React, { useState, useRef } from 'react';
import { Search, X, Sparkles, Loader } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { ProteinService } from '../../services/proteinService';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  
  const { setTargetProtein, setIsLoading, setConfidenceScores } = useProteinStore();

  // Perform the actual search
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting search for:', searchQuery);
      
      // Search for protein using the service
      const proteinData = await ProteinService.searchProtein(searchQuery);
      console.log('✅ Protein data received:', proteinData);
      
      // Fetch the structure file
      const pdbData = await ProteinService.fetchStructure(proteinData, 'pdb');
      console.log('✅ PDB structure loaded');
      
      // Update store with protein data
      setTargetProtein({
        ...proteinData,
        pdbData, // Include PDB data for viewer
      });
      
      // Set confidence scores if available
      if (proteinData.metrics) {
        setConfidenceScores({
          average: proteinData.metrics.plddt,
          confidence: proteinData.metrics.confidence,
        });
      }
      
      console.log('✅ Protein loaded successfully:', proteinData.name);
      
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err.message);
      
      // Show error notification
      alert(`Failed to load protein: ${err.message}\n\nTry using a UniProt ID like 'P01308' (human insulin)`);
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
  const handleExampleClick = (exampleText) => {
    console.log('📌 Example clicked:', exampleText);
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

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center rounded-lg border transition-all ${
          error 
            ? 'border-red-500 ring-2 ring-red-100' 
            : isFocused 
            ? 'border-primary-500 ring-2 ring-primary-100' 
            : 'border-gray-300'
        } bg-white`}>
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
            className="w-full bg-transparent pl-11 pr-24 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none"
            disabled={isSearching}
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 p-1 rounded-full hover:bg-gray-100"
              disabled={isSearching}
            >
              <X className="w-4 h-4 text-gray-400" />
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
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
          onMouseDown={(e) => {
            // Prevent input blur when clicking on examples
            e.preventDefault();
          }}
        >
          <p className="text-xs text-gray-600 mb-2 font-medium">Try these examples:</p>
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
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-mono text-primary-600">{example.text}</span>
                <span className="text-xs text-gray-500 ml-2">- {example.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
