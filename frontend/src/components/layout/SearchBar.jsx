import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, Loader } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import { ProteinService } from '../../services/proteinService';
import { API_ENDPOINTS, checkBackendHealth, getBackendErrorMessage } from '../../config/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const { 
    setTargetProtein, 
    setIsLoading, 
    setConfidenceScores,
    activeView,
    setResearchQuery,
    setResearchResults,
    setIsResearching,
    setResearchError,
    researchQuery,
    isResearching
  } = useProteinStore();
  
  const { theme } = useThemeStore();

  // Perform research if on research tab (runs in background, non-blocking)
  const performResearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsResearching(true);
    setResearchError(null);
    setResearchQuery(searchQuery.trim());
    setResearchResults(null);

    // Run research in background - don't block UI
    (async () => {
      try {
        // Check if backend is reachable
        const isBackendAvailable = await checkBackendHealth();
        if (!isBackendAvailable) {
          throw new Error(getBackendErrorMessage());
        }

        console.log('🔬 Starting research in background...');
        const response = await fetch(API_ENDPOINTS.researchProtein, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            protein_id: searchQuery.trim(),
            model: 'google/gemini-2.0-flash-lite',
            include_novel: true,
            months_recent: 6,
          }),
        });

        if (!response.ok) {
          let errorMessage = `Research failed: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (parseErr) {
            const text = await response.text().catch(() => '');
            if (text) errorMessage = text;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setResearchResults(data);
        console.log('✅ Research completed successfully');
      } catch (err) {
        const errorMessage = err.name === 'TypeError' && err.message.includes('Failed to fetch')
          ? getBackendErrorMessage()
          : err.message;
        setResearchError(errorMessage);
        console.error('❌ Research failed:', err);
      } finally {
        setIsResearching(false);
      }
    })();
  };

  // Perform the actual search (for protein structure)
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting search for:', searchQuery);
      
      // STEP 1: Search for protein using the service
      const proteinData = await ProteinService.searchProtein(searchQuery);
      console.log('✅ Protein data received:', proteinData);
      
      // STEP 2: Fetch the structure file (required for 3D viewer)
      const pdbData = await ProteinService.fetchStructure(proteinData, 'pdb');
      console.log('✅ PDB structure loaded');
      
      // STEP 3: IMMEDIATELY update store with protein data and PDB structure
      // This will instantly populate the 3D viewer
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
      
      // Mark loading as complete so UI is responsive
      setIsSearching(false);
      setIsLoading(false);
      
      console.log('✅ Protein loaded successfully:', proteinData.name);
      console.log('📊 3D viewer should now be visible');
      
      // STEP 4: Automatically trigger research in background if we have a UniProt ID
      // This will populate the research dashboard automatically
      if (proteinData.uniprotId) {
        console.log('🔬 Auto-triggering research for:', proteinData.uniprotId);
        performResearch(proteinData.uniprotId);
      }
      
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err.message);
      setIsSearching(false);
      setIsLoading(false);
      
      // Show error notification
      alert(`Failed to load protein: ${err.message}\n\nTry using a UniProt ID like 'P01308' (human insulin)`);
    }
  };

  // Route search based on active view
  const handleSearch = async (searchQuery) => {
    if (activeView === 'research') {
      // For research tab: load protein structure immediately, then research in background
      await performSearch(searchQuery);
      // Start research in background (non-blocking)
      performResearch(searchQuery);
    } else {
      // For other views: just load the protein structure
      await performSearch(searchQuery);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsFocused(false);
    handleSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle clicking on example - this triggers the search directly
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleExampleClick = (exampleText) => {
    console.log('📌 Example clicked:', exampleText);
    setQuery(exampleText);
    setIsFocused(false);
    
    // Clear any pending timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Perform search immediately (routes based on active view)
    handleSearch(exampleText);
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
            : theme === 'dark'
            ? 'border-gray-600'
            : 'border-gray-300'
        } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
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
              const newValue = e.target.value;
              setQuery(newValue);
              setError(null);
              
              // Clear any existing timeout
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
              
              // Auto-trigger research immediately when on research tab and valid UniProt ID is entered
              if (activeView === 'research' && newValue.trim()) {
                // Check if it looks like a UniProt ID (alphanumeric, typically 6-10 chars)
                const uniprotPattern = /^[A-Z0-9]{6,10}$/i;
                const trimmedValue = newValue.trim();
                if (uniprotPattern.test(trimmedValue)) {
                  // Very short debounce (200ms) to avoid triggering multiple times while typing
                  // but feels immediate to the user
                  searchTimeoutRef.current = setTimeout(() => {
                    // Double-check the value still matches (user might have continued typing)
                    const currentValue = inputRef.current?.value?.trim() || '';
                    if (uniprotPattern.test(currentValue) && currentValue === trimmedValue) {
                      handleSearch(trimmedValue);
                    }
                  }, 200);
                }
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hiding to allow click on examples
              setTimeout(() => setIsFocused(false), 200);
            }}
            placeholder={activeView === 'research' 
              ? "Enter UniProt ID (e.g., 'P01308') - research starts automatically" 
              : "Search proteins... e.g., 'human insulin' or 'P01308'"}
            className={`w-full bg-transparent pl-11 pr-24 py-2.5 text-base outline-none ${
              theme === 'dark'
                ? 'text-white placeholder-gray-400'
                : 'text-gray-900 placeholder-gray-500'
            }`}
            disabled={isSearching}
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className={`absolute right-14 p-1 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400'
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
            className="absolute right-2 px-4 py-1.5 rounded-md bg-primary-600 text-white text-base font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
      
      {/* Loading message for research */}
      {isResearching && activeView === 'research' && (
        <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-blue-50 border border-blue-200 rounded-lg text-base text-blue-700 z-50 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Researching protein... This may take 2-5 minutes. Please wait...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-red-50 border border-red-200 rounded-lg text-base text-red-700 z-50">
          {error}
        </div>
      )}
      
      {/* Search suggestions */}
      {isFocused && !query && !isSearching && (
        <div 
          className={`absolute top-full mt-2 left-0 right-0 rounded-lg shadow-lg p-3 z-50 border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          onMouseDown={(e) => {
            // Prevent input blur when clicking on examples
            e.preventDefault();
          }}
        >
          <p className={`text-sm mb-2 font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Try these examples:</p>
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
                <span className={`text-base font-mono ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>{example.text}</span>
                <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>- {example.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
