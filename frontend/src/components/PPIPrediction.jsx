import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './PPIPrediction.css';

const PPIPrediction = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProteins, setSelectedProteins] = useState({ proteinA: null, proteinB: null });
  const [isSearching, setIsSearching] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const nglViewerRef = useRef(null);

  // Initialize NGL Viewer
  useEffect(() => {
    if (typeof window !== 'undefined' && window.NGL) {
      // NGL Viewer is loaded
    } else {
      // Load NGL Viewer script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/ngl@2.8.0/dist/ngl.js';
      script.onload = () => {
        console.log('NGL Viewer loaded');
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/search_proteins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search proteins');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectProtein = (protein, slot) => {
    setSelectedProteins((prev) => ({
      ...prev,
      [slot]: protein,
    }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const predictInteraction = async () => {
    if (!selectedProteins.proteinA || !selectedProteins.proteinB) {
      setError('Please select two proteins');
      return;
    }

    setIsPredicting(true);
    setError(null);
    setPredictionResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict_ppi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protein_a: selectedProteins.proteinA.uniprot_id,
          protein_b: selectedProteins.proteinB.uniprot_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to predict interaction');
      }

      const data = await response.json();
      setPredictionResult(data);
      
      // Load 3D structures if available
      loadStructures(data.protein_a, data.protein_b);
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  const loadStructures = async (proteinAId, proteinBId) => {
    if (!window.NGL || !viewerRef.current) return;

    try {
      // Clear existing viewer
      if (nglViewerRef.current) {
        nglViewerRef.current.dispose();
      }

      // Create new NGL viewer
      const stage = new window.NGL.Stage(viewerRef.current, {
        backgroundColor: 'white',
      });

      nglViewerRef.current = stage;

      // Try to load structures from PDB or AlphaFold DB
      // For now, we'll use a placeholder or try to fetch from AlphaFold
      const loadProtein = async (uniprotId, color) => {
        try {
          // Try AlphaFold DB first
          const alphafoldUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb`;
          const component = await stage.loadFile(alphafoldUrl, {
            defaultRepresentation: true,
            ext: 'pdb',
          });
          
          component.addRepresentation('cartoon', {
            color: color,
            opacity: 0.8,
          });
          
          component.addRepresentation('ball+stick', {
            sele: 'hetero',
            color: 'element',
          });
        } catch (err) {
          console.warn(`Could not load structure for ${uniprotId}:`, err);
          // Could load a placeholder or show message
        }
      };

      // Load both proteins
      await loadProtein(proteinAId, 'red');
      await loadProtein(proteinBId, 'blue');

      // Auto-zoom
      stage.autoView();
    } catch (err) {
      console.error('Error loading structures:', err);
    }
  };

  const clearSelection = (slot) => {
    setSelectedProteins((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="ppi-prediction-container">
      <div className="ppi-header">
        <h2>Protein-Protein Interaction Prediction</h2>
        <p>Search for proteins and predict their interactions using AI</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <Sparkles className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a protein (e.g., 'human insulin', 'P01308')"
              className="search-input"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="search-button"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            <div className="results-grid">
              {searchResults.map((protein, index) => (
                <div
                  key={index}
                  className="protein-card"
                  onClick={() => {
                    // Determine which slot to fill
                    if (!selectedProteins.proteinA) {
                      selectProtein(protein, 'proteinA');
                    } else if (!selectedProteins.proteinB) {
                      selectProtein(protein, 'proteinB');
                    } else {
                      // Replace the second protein
                      selectProtein(protein, 'proteinB');
                    }
                  }}
                >
                  <div className="protein-card-header">
                    <h4>{protein.name || protein.uniprot_id}</h4>
                    <span className="uniprot-id">{protein.uniprot_id}</span>
                  </div>
                  <p className="protein-description">{protein.description}</p>
                  {protein.gene_name && (
                    <span className="gene-name">Gene: {protein.gene_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Proteins */}
      <div className="selected-proteins-section">
        <h3>Selected Proteins</h3>
        <div className="selected-proteins-grid">
          <div className="selected-protein-card">
            <h4>Protein A</h4>
            {selectedProteins.proteinA ? (
              <div className="selected-protein-info">
                <div className="protein-info-header">
                  <span className="protein-name">{selectedProteins.proteinA.name}</span>
                  <button
                    onClick={() => clearSelection('proteinA')}
                    className="clear-button"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <span className="uniprot-id">{selectedProteins.proteinA.uniprot_id}</span>
                <p className="protein-description">{selectedProteins.proteinA.description}</p>
              </div>
            ) : (
              <div className="empty-slot">No protein selected</div>
            )}
          </div>

          <div className="selected-protein-card">
            <h4>Protein B</h4>
            {selectedProteins.proteinB ? (
              <div className="selected-protein-info">
                <div className="protein-info-header">
                  <span className="protein-name">{selectedProteins.proteinB.name}</span>
                  <button
                    onClick={() => clearSelection('proteinB')}
                    className="clear-button"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <span className="uniprot-id">{selectedProteins.proteinB.uniprot_id}</span>
                <p className="protein-description">{selectedProteins.proteinB.description}</p>
              </div>
            ) : (
              <div className="empty-slot">No protein selected</div>
            )}
          </div>
        </div>

        <button
          onClick={predictInteraction}
          disabled={!selectedProteins.proteinA || !selectedProteins.proteinB || isPredicting}
          className="predict-button"
        >
          {isPredicting ? 'Predicting...' : 'Predict Interaction'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Prediction Results */}
      {predictionResult && (
        <div className="prediction-results">
          <h3>Prediction Results</h3>
          <div className="results-grid-2">
            <div className="result-card">
              <div className="result-header">
                <h4>Interaction Prediction</h4>
                {predictionResult.interacts ? (
                  <CheckCircle className="interaction-icon positive" size={24} />
                ) : (
                  <XCircle className="interaction-icon negative" size={24} />
                )}
              </div>
              <div className="result-content">
                <div className="result-item">
                  <span className="result-label">Interaction:</span>
                  <span className={`result-value ${predictionResult.interacts ? 'positive' : 'negative'}`}>
                    {predictionResult.interacts ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Probability:</span>
                  <span className="result-value">
                    {(predictionResult.interaction_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Confidence:</span>
                  <span
                    className="result-value"
                    style={{ color: getConfidenceColor(predictionResult.confidence) }}
                  >
                    {predictionResult.confidence}
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Interaction Type:</span>
                  <span className="result-value">{predictionResult.interaction_type}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Type Confidence:</span>
                  <span className="result-value">
                    {(predictionResult.type_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 3D Visualization */}
            <div className="visualization-card">
              <h4>3D Structure Visualization</h4>
              <div ref={viewerRef} className="ngl-viewer" style={{ width: '100%', height: '400px' }} />
              <p className="visualization-note">
                {predictionResult.note || '3D structures loaded from AlphaFold DB (if available)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPIPrediction;

