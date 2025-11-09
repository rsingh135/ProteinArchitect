import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle, XCircle, Clock, Dna } from 'lucide-react';
import './PPIPrediction.css';

const PPIPrediction = () => {
  const [mode, setMode] = useState('search'); // 'search' or 'sequence'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProteins, setSelectedProteins] = useState({ proteinA: null, proteinB: null });
  
  // Sequence input mode
  const [sequenceA, setSequenceA] = useState('');
  const [sequenceB, setSequenceB] = useState('');
  const [proteinAName, setProteinAName] = useState('');
  const [proteinBName, setProteinBName] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const progressIntervalRef = useRef(null);
  const timeIntervalRef = useRef(null);
  
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Load 3Dmol.js
  useEffect(() => {
    if (!window.$3Dmol) {
      const script = document.createElement('script');
      script.src = 'https://3Dmol.csb.pitt.edu/build/3Dmol-min.js';
      script.async = true;
      script.onload = () => {
        console.log('3Dmol.js loaded');
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

  const validateSequence = (seq) => {
    const cleaned = seq.replace(/\s/g, '').toUpperCase();
    const validAA = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
    if (!validAA.test(cleaned)) {
      throw new Error('Invalid amino acid sequence. Use standard one-letter codes (A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)');
    }
    if (cleaned.length < 10) {
      throw new Error('Sequence must be at least 10 amino acids long');
    }
    if (cleaned.length > 5000) {
      throw new Error('Sequence must be less than 5000 amino acids');
    }
    return cleaned;
  };

  const predictFromSequences = async () => {
    try {
      // Validate sequences
      const cleanedSeqA = validateSequence(sequenceA);
      const cleanedSeqB = validateSequence(sequenceB);

      setIsPredicting(true);
      setError(null);
      setPredictionResult(null);
      setProgress(0);
      setElapsedTime(0);

      // Start progress simulation
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 500);

      // Start time tracking
      const timeStart = Date.now();
      timeIntervalRef.current = setInterval(() => {
        setElapsedTime((Date.now() - timeStart) / 1000);
      }, 100);

      const response = await fetch('http://localhost:8000/predict_ppi_from_sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sequence_a: cleanedSeqA,
          sequence_b: cleanedSeqB,
          protein_a_name: proteinAName || 'Protein A',
          protein_b_name: proteinBName || 'Protein B',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to predict interaction' }));
        throw new Error(errorData.detail || 'Failed to predict interaction');
      }

      const data = await response.json();
      
      // Complete progress
      setProgress(100);
      clearInterval(progressIntervalRef.current);
      clearInterval(timeIntervalRef.current);
      
      setPredictionResult(data);
      
      // Load 3D structure
      if (data.complex_structure) {
        await loadComplexStructure(data.complex_structure);
      } else if (data.protein_a?.structure_data && data.protein_b?.structure_data) {
        await loadDualStructure(data.protein_a.structure_data, data.protein_b.structure_data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
      clearInterval(progressIntervalRef.current);
      clearInterval(timeIntervalRef.current);
    } finally {
      setIsPredicting(false);
    }
  };

  const predictFromProteins = async () => {
    if (!selectedProteins.proteinA || !selectedProteins.proteinB) {
      setError('Please select two proteins');
      return;
    }

    setIsPredicting(true);
      setError(null);
      setPredictionResult(null);
      setProgress(0);
      setElapsedTime(0);

    // Start progress simulation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

      // Start time tracking
      const timeStart = Date.now();
      timeIntervalRef.current = setInterval(() => {
        setElapsedTime((Date.now() - timeStart) / 1000);
      }, 100);

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
      
      // Complete progress
      setProgress(100);
      clearInterval(progressIntervalRef.current);
      clearInterval(timeIntervalRef.current);
      
      setPredictionResult(data);
      
      // Load structures if available
      if (data.protein_a && data.protein_b) {
        await loadStructures(data.protein_a, data.protein_b);
      }
    } catch (err) {
      setError(err.message);
      console.error('Prediction error:', err);
      clearInterval(progressIntervalRef.current);
      clearInterval(timeIntervalRef.current);
    } finally {
      setIsPredicting(false);
    }
  };

  const loadComplexStructure = async (pdbData) => {
    if (!window.$3Dmol || !viewerRef.current) return;

    try {
      // Clear existing viewer
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }

      // Wait for 3Dmol to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const config = {
        backgroundColor: '#1a1a1a',
      };
      
      const viewer = window.$3Dmol.createViewer(viewerRef.current, config);
      viewerInstanceRef.current = viewer;

      // Add complex structure
      viewer.addModel(pdbData, 'pdb');
      
      // Style: Chain A in red, Chain B in blue
      viewer.setStyle({ chain: 'A' }, { cartoon: { color: '#ef4444' } });
      viewer.setStyle({ chain: 'B' }, { cartoon: { color: '#3b82f6' } });
      
      // Add surface representation for interaction sites
      viewer.addStyle({}, { cartoon: { opacity: 0.8 } });
      
      viewer.zoomTo();
      viewer.render();
      
      console.log('✅ Complex structure rendered');
    } catch (err) {
      console.error('Error loading complex structure:', err);
    }
  };

  const loadDualStructure = async (pdbA, pdbB) => {
    if (!window.$3Dmol || !viewerRef.current) return;

    try {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const config = {
        backgroundColor: '#1a1a1a',
      };
      
      const viewer = window.$3Dmol.createViewer(viewerRef.current, config);
      viewerInstanceRef.current = viewer;

      // Add both structures
      viewer.addModel(pdbA, 'pdb');
      viewer.addModel(pdbB, 'pdb');
      
      // Style: first model red, second blue
      viewer.setStyle({ model: 0 }, { cartoon: { color: '#ef4444' } });
      viewer.setStyle({ model: 1 }, { cartoon: { color: '#3b82f6' } });
      
      viewer.zoomTo();
      viewer.render();
      
      console.log('✅ Dual structure rendered');
    } catch (err) {
      console.error('Error loading dual structure:', err);
    }
  };

  const loadStructures = async (proteinAId, proteinBId) => {
    if (!window.$3Dmol || !viewerRef.current) return;

    try {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const config = {
        backgroundColor: '#1a1a1a',
      };
      
      const viewer = window.$3Dmol.createViewer(viewerRef.current, config);
      viewerInstanceRef.current = viewer;

      // Try to load from AlphaFold DB
      const loadProtein = async (uniprotId, color, modelIndex) => {
        try {
          const alphafoldUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb`;
          const response = await fetch(alphafoldUrl);
          if (response.ok) {
            const pdbData = await response.text();
            viewer.addModel(pdbData, 'pdb');
            viewer.setStyle({ model: modelIndex }, { cartoon: { color: color } });
            return true;
          }
        } catch (err) {
          console.warn(`Could not load structure for ${uniprotId}:`, err);
        }
        return false;
      };

      await loadProtein(proteinAId, '#ef4444', 0);
      await loadProtein(proteinBId, '#3b82f6', 1);

      viewer.zoomTo();
      viewer.render();
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

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="ppi-prediction-container">
      <div className="ppi-header">
        <h2>Protein-Protein Interaction Prediction</h2>
        <p>Predict interactions using UniProt IDs or novel amino acid sequences</p>
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={mode === 'search' ? 'active' : ''}
          onClick={() => setMode('search')}
        >
          <Search size={18} /> Search by ID
        </button>
        <button
          className={mode === 'sequence' ? 'active' : ''}
          onClick={() => setMode('sequence')}
        >
          <Dna size={18} /> Input Sequences
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <>
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

            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results</h3>
                <div className="results-grid">
                  {searchResults.map((protein, index) => (
                    <div
                      key={index}
                      className="protein-card"
                      onClick={() => {
                        if (!selectedProteins.proteinA) {
                          selectProtein(protein, 'proteinA');
                        } else if (!selectedProteins.proteinB) {
                          selectProtein(protein, 'proteinB');
                        } else {
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
              onClick={predictFromProteins}
              disabled={!selectedProteins.proteinA || !selectedProteins.proteinB || isPredicting}
              className="predict-button"
            >
              {isPredicting ? 'Predicting...' : 'Predict Interaction'}
            </button>
          </div>
        </>
      )}

      {/* Sequence Input Mode */}
      {mode === 'sequence' && (
        <div className="sequence-input-section">
          <div className="sequence-inputs">
            <div className="sequence-input-group">
              <label>
                <input
                  type="text"
                  value={proteinAName}
                  onChange={(e) => setProteinAName(e.target.value)}
                  placeholder="Protein A Name (optional)"
                  className="protein-name-input"
                />
              </label>
              <label>
                <span>Protein A Sequence (one-letter amino acid codes)</span>
                <textarea
                  value={sequenceA}
                  onChange={(e) => setSequenceA(e.target.value)}
                  placeholder="MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL"
                  className="sequence-textarea"
                  rows={6}
                />
                <span className="sequence-info">{sequenceA.replace(/\s/g, '').length} amino acids</span>
              </label>
            </div>

            <div className="sequence-input-group">
              <label>
                <input
                  type="text"
                  value={proteinBName}
                  onChange={(e) => setProteinBName(e.target.value)}
                  placeholder="Protein B Name (optional)"
                  className="protein-name-input"
                />
              </label>
              <label>
                <span>Protein B Sequence (one-letter amino acid codes)</span>
                <textarea
                  value={sequenceB}
                  onChange={(e) => setSequenceB(e.target.value)}
                  placeholder="MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL"
                  className="sequence-textarea"
                  rows={6}
                />
                <span className="sequence-info">{sequenceB.replace(/\s/g, '').length} amino acids</span>
              </label>
            </div>
          </div>

          <button
            onClick={predictFromSequences}
            disabled={!sequenceA.trim() || !sequenceB.trim() || isPredicting}
            className="predict-button"
          >
            {isPredicting ? 'Predicting Interaction...' : 'Predict Interaction from Sequences'}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isPredicting && (
        <div className="progress-section">
          <div className="progress-header">
            <Clock size={18} />
            <span>Computing interaction prediction...</span>
            <span className="elapsed-time">{formatTime(elapsedTime)}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-steps">
            <span className={progress > 10 ? 'completed' : ''}>Validating sequences</span>
            <span className={progress > 30 ? 'completed' : ''}>Fetching structures</span>
            <span className={progress > 60 ? 'completed' : ''}>Predicting interaction</span>
            <span className={progress > 90 ? 'completed' : ''}>Generating 3D model</span>
          </div>
        </div>
      )}

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
          {predictionResult.computation_time && (
            <div className="computation-info">
              <Clock size={16} />
              <span>Computation time: {formatTime(predictionResult.computation_time)}</span>
            </div>
          )}
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
              <div 
                ref={viewerRef} 
                className="3dmol-viewer" 
                style={{ width: '100%', height: '500px', minHeight: '500px' }} 
              />
              <p className="visualization-note">
                {predictionResult.note || '3D complex structure showing predicted interaction'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPIPrediction;
