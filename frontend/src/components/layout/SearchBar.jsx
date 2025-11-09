import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, Loader } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { ProteinService } from '../../services/proteinService';

const API_URL = 'http://localhost:8000';

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

  // Perform research if on research tab
  const performResearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsResearching(true);
    setError(null);
    setResearchError(null);
    setResearchQuery(searchQuery.trim());
    setResearchResults(null);

    try {
      // Check if backend is reachable
      try {
        const healthCheck = await fetch(`${API_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding');
        }
      } catch (healthErr) {
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on http://localhost:8000');
      }

      const response = await fetch(`${API_URL}/research_protein`, {
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
        ? 'Failed to connect to backend server. Please ensure the backend is running on http://localhost:8000'
        : err.message;
      setError(errorMessage);
      setResearchError(errorMessage);
      console.error('❌ Research failed:', err);
    } finally {
      setIsSearching(false);
      setIsResearching(false);
    }
  };

  // Perform the actual search (for protein structure)
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

  // Route search based on active view
  const handleSearch = async (searchQuery) => {
    if (activeView === 'research') {
      await performResearch(searchQuery);
    } else {
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
            : 'border-gray-300'
        } bg-white`}>
          <div className="absolute left-4 flex items-center pointer-events-none">
            {(isSearching || isResearching) ? (
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
              
              // Auto-trigger research when on research tab and valid UniProt ID is entered
              if (activeView === 'research' && newValue.trim()) {
                // Check if it looks like a UniProt ID (alphanumeric, typically 6-10 chars)
                const uniprotPattern = /^[A-Z0-9]{6,10}$/i;
                if (uniprotPattern.test(newValue.trim())) {
                  // Debounce: wait 1 second after user stops typing
                  searchTimeoutRef.current = setTimeout(() => {
                    handleSearch(newValue.trim());
                  }, 1000);
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
            className="w-full bg-transparent pl-11 pr-24 py-2.5 text-base text-gray-900 placeholder-gray-500 outline-none"
            disabled={isSearching || isResearching}
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
            disabled={isSearching || isResearching || !query.trim()}
            className="absolute right-2 px-4 py-1.5 rounded-md bg-primary-600 text-white text-base font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isSearching || isResearching) ? (
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
      {isFocused && !query && !isSearching && !isResearching && (
        <div 
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
          onMouseDown={(e) => {
            // Prevent input blur when clicking on examples
            e.preventDefault();
          }}
        >
          <p className="text-sm text-gray-600 mb-2 font-medium">Try these examples:</p>
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
                <span className="text-base font-mono text-primary-600">{example.text}</span>
                <span className="text-sm text-gray-500 ml-2">- {example.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
