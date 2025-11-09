import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle, XCircle, Clock, Dna, Video, Loader } from 'lucide-react';
import './PPIPrediction.css';
import { API_ENDPOINTS } from '../config/api';

const PPIPrediction = () => {
  const [mode, setMode] = useState('search'); // 'search' or 'sequence'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProteins, setSelectedProteins] = useState({ proteinA: null, proteinB: null });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  
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
  
  // Separate viewers for video generation
  const viewerARef = useRef(null);
  const viewerBRef = useRef(null);
  const viewerComplexRef = useRef(null);
  const viewerAInstanceRef = useRef(null);
  const viewerBInstanceRef = useRef(null);
  const viewerComplexInstanceRef = useRef(null);
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

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

  const handleSearch = async (e, queryOverride = null) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const searchTerm = queryOverride || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setIsSearchFocused(false);

    try {
      const response = await fetch(API_ENDPOINTS.searchProteins, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
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

      const response = await fetch(API_ENDPOINTS.predictPPIFromSequences, {
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
        // Also load separate viewers for video generation
        if (data.protein_a?.structure_data && data.protein_b?.structure_data) {
          await loadSeparateViewers(data.protein_a.structure_data, data.protein_b.structure_data, data.complex_structure);
        }
      } else if (data.protein_a?.structure_data && data.protein_b?.structure_data) {
        await loadDualStructure(data.protein_a.structure_data, data.protein_b.structure_data);
        await loadSeparateViewers(data.protein_a.structure_data, data.protein_b.structure_data, null);
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
      const response = await fetch(API_ENDPOINTS.predictPPI, {
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
        // Try to fetch PDB data for separate viewers
        try {
          const [pdbA, pdbB] = await Promise.all([
            fetch(`https://alphafold.ebi.ac.uk/files/AF-${data.protein_a}-F1-model_v4.pdb`).then(r => r.ok ? r.text() : null).catch(() => null),
            fetch(`https://alphafold.ebi.ac.uk/files/AF-${data.protein_b}-F1-model_v4.pdb`).then(r => r.ok ? r.text() : null).catch(() => null),
          ]);
          
          if (pdbA && pdbB) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadSeparateViewers(pdbA, pdbB, null);
          }
        } catch (err) {
          console.warn('Could not load separate viewers for video generation:', err);
        }
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

  // Protein suggestions for dropdown
  const proteinSuggestions = [
    { id: 'P01308', name: 'Human Insulin', description: 'Hormone that regulates glucose metabolism' },
    { id: 'P04637', name: 'Tumor Protein p53', description: 'Tumor suppressor protein, key in cancer research' },
    { id: 'P69905', name: 'Hemoglobin Alpha', description: 'Oxygen-carrying protein in red blood cells' },
    { id: 'P02768', name: 'Serum Albumin', description: 'Most abundant protein in human blood plasma' },
    { id: 'P00734', name: 'Prothrombin', description: 'Coagulation factor involved in blood clotting' },
    { id: 'P02649', name: 'Apolipoprotein E', description: 'Lipid transport protein, associated with Alzheimer\'s' },
    { id: 'P00520', name: 'Abl Tyrosine Kinase', description: 'Protein kinase involved in cell signaling' },
    { id: 'P12931', name: 'SRC Proto-oncogene', description: 'Non-receptor tyrosine kinase' },
    { id: 'P01111', name: 'NRAS Proto-oncogene', description: 'GTPase involved in cell growth regulation' },
    { id: 'P01112', name: 'HRAS Proto-oncogene', description: 'Small GTPase, cancer-related protein' },
  ];

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.id);
    setIsSearchFocused(false);
    // Trigger search automatically
    handleSearch({ preventDefault: () => {} }, suggestion.id);
  };

  // Load separate viewers for Protein A, Protein B, and Complex
  const loadSeparateViewers = async (pdbA, pdbB, complexPdb) => {
    if (!window.$3Dmol) return;

    try {
      // Load Protein A viewer
      if (viewerARef.current && pdbA) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (viewerAInstanceRef.current) {
          viewerAInstanceRef.current = null;
        }
        if (viewerARef.current) {
          viewerARef.current.innerHTML = '';
        }
        
        const viewerA = window.$3Dmol.createViewer(viewerARef.current, {
          backgroundColor: '#1a1a1a',
        });
        viewerAInstanceRef.current = viewerA;
        viewerA.addModel(pdbA, 'pdb');
        viewerA.setStyle({}, { cartoon: { color: '#ef4444' } });
        viewerA.zoomTo();
        viewerA.render();
      }

      // Load Protein B viewer
      if (viewerBRef.current && pdbB) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (viewerBInstanceRef.current) {
          viewerBInstanceRef.current = null;
        }
        if (viewerBRef.current) {
          viewerBRef.current.innerHTML = '';
        }
        
        const viewerB = window.$3Dmol.createViewer(viewerBRef.current, {
          backgroundColor: '#1a1a1a',
        });
        viewerBInstanceRef.current = viewerB;
        viewerB.addModel(pdbB, 'pdb');
        viewerB.setStyle({}, { cartoon: { color: '#3b82f6' } });
        viewerB.zoomTo();
        viewerB.render();
      }

      // Load Complex viewer
      if (viewerComplexRef.current && complexPdb) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (viewerComplexInstanceRef.current) {
          viewerComplexInstanceRef.current = null;
        }
        if (viewerComplexRef.current) {
          viewerComplexRef.current.innerHTML = '';
        }
        
        const viewerComplex = window.$3Dmol.createViewer(viewerComplexRef.current, {
          backgroundColor: '#1a1a1a',
        });
        viewerComplexInstanceRef.current = viewerComplex;
        viewerComplex.addModel(complexPdb, 'pdb');
        viewerComplex.setStyle({ chain: 'A' }, { cartoon: { color: '#ef4444' } });
        viewerComplex.setStyle({ chain: 'B' }, { cartoon: { color: '#3b82f6' } });
        viewerComplex.zoomTo();
        viewerComplex.render();
      }
    } catch (err) {
      console.error('Error loading separate viewers:', err);
    }
  };

  // Capture screenshot from 3Dmol viewer
  const captureViewerScreenshot = (viewerInstance) => {
    if (!viewerInstance) return null;
    try {
      // 3Dmol has a getImage method that returns a data URL
      const imageData = viewerInstance.getImage();
      if (imageData) {
        // Remove data URL prefix to get just the base64 data
        return imageData.split(',')[1];
      }
    } catch (err) {
      console.error('Error capturing screenshot:', err);
    }
    return null;
  };

  // Fetch AlphaFold structure image directly from API
  const fetchAlphaFoldImage = async (uniprotId) => {
    if (!uniprotId) {
      console.warn('No UniProt ID provided for image fetch');
      return null;
    }
    
    try {
      // Try to get image from AlphaFold API
      const imageUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.png`;
      console.log(`Fetching AlphaFold image from: ${imageUrl}`);
      const response = await fetch(imageUrl, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            console.log(`✅ Successfully fetched AlphaFold image for ${uniprotId}`);
            resolve(base64);
          };
          reader.onerror = () => {
            console.error(`Error reading blob for ${uniprotId}`);
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.warn(`AlphaFold image not found for ${uniprotId}: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.warn(`Could not fetch AlphaFold image for ${uniprotId}:`, err);
    }
    return null;
  };

  // Generate image from PDB data using canvas
  const generateImageFromPDB = async (pdbData, proteinName, color = '#ef4444') => {
    if (!pdbData || pdbData.length < 100) {
      console.warn(`Invalid PDB data for ${proteinName}`);
      return null;
    }

    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      // Create a temporary viewer element
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.height = '600px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.visibility = 'hidden';
      document.body.appendChild(tempDiv);

      // Wait for 3Dmol to be ready
      const tryRender = async () => {
        attempts++;
        if (!window.$3Dmol) {
          if (attempts < maxAttempts) {
            setTimeout(tryRender, 100);
          } else {
            console.error('3Dmol.js not loaded after 5 seconds');
            document.body.removeChild(tempDiv);
            resolve(null);
          }
          return;
        }

        try {
          console.log(`Generating image from PDB for ${proteinName}...`);
          const viewer = window.$3Dmol.createViewer(tempDiv, {
            backgroundColor: '#1a1a1a',
          });
          
          viewer.addModel(pdbData, 'pdb');
          viewer.setStyle({}, { cartoon: { color: color } });
          viewer.zoomTo();
          viewer.render();

          // Wait longer for render to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Capture image - try multiple times
          let imageData = null;
          for (let i = 0; i < 5; i++) {
            try {
              imageData = viewer.getImage();
              if (imageData) break;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
              console.warn(`Image capture attempt ${i + 1} failed:`, e);
            }
          }

          if (imageData) {
            const base64 = imageData.split(',')[1];
            console.log(`✅ Successfully generated image for ${proteinName}`);
            document.body.removeChild(tempDiv);
            resolve(base64);
          } else {
            console.error(`Failed to capture image for ${proteinName}`);
            document.body.removeChild(tempDiv);
            resolve(null);
          }
        } catch (err) {
          console.error(`Error generating image from PDB for ${proteinName}:`, err);
          if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
          }
          resolve(null);
        }
      };

      tryRender();
    });
  };

  // Generate complex image with chain colors
  const generateComplexImageFromPDB = async (pdbData, proteinName) => {
    if (!pdbData || pdbData.length < 100) {
      console.warn(`Invalid PDB data for complex ${proteinName}`);
      return null;
    }

    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      // Create a temporary viewer element
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.height = '600px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.visibility = 'hidden';
      document.body.appendChild(tempDiv);

      // Wait for 3Dmol to be ready
      const tryRender = async () => {
        attempts++;
        if (!window.$3Dmol) {
          if (attempts < maxAttempts) {
            setTimeout(tryRender, 100);
          } else {
            console.error('3Dmol.js not loaded after 5 seconds');
            document.body.removeChild(tempDiv);
            resolve(null);
          }
          return;
        }

        try {
          console.log(`Generating complex image from PDB for ${proteinName}...`);
          const viewer = window.$3Dmol.createViewer(tempDiv, {
            backgroundColor: '#1a1a1a',
          });
          
          viewer.addModel(pdbData, 'pdb');
          // Style: Chain A in red, Chain B in blue
          viewer.setStyle({ chain: 'A' }, { cartoon: { color: '#ef4444' } });
          viewer.setStyle({ chain: 'B' }, { cartoon: { color: '#3b82f6' } });
          // Fallback for other chains or if chain IDs don't match
          viewer.setStyle({ model: 0 }, { cartoon: { color: '#ef4444' } });
          viewer.setStyle({ model: 1 }, { cartoon: { color: '#3b82f6' } });
          viewer.zoomTo();
          viewer.render();

          // Wait longer for render to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Capture image - try multiple times
          let imageData = null;
          for (let i = 0; i < 5; i++) {
            try {
              imageData = viewer.getImage();
              if (imageData) break;
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
              console.warn(`Complex image capture attempt ${i + 1} failed:`, e);
            }
          }

          if (imageData) {
            const base64 = imageData.split(',')[1];
            console.log(`✅ Successfully generated complex image for ${proteinName}`);
            document.body.removeChild(tempDiv);
            resolve(base64);
          } else {
            console.error(`Failed to capture complex image for ${proteinName}`);
            document.body.removeChild(tempDiv);
            resolve(null);
          }
        } catch (err) {
          console.error(`Error generating complex image from PDB for ${proteinName}:`, err);
          if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
          }
          resolve(null);
        }
      };

      tryRender();
    });
  };

  // Fetch PDB data from AlphaFold with multiple fallbacks
  const fetchPDBFromAlphaFold = async (uniprotId) => {
    if (!uniprotId) {
      console.warn('No UniProt ID provided for PDB fetch');
      return null;
    }
    
    // Normalize UniProt ID (remove spaces, convert to uppercase)
    const normalizedId = uniprotId.trim().toUpperCase();
    
    // Try multiple model versions (v4, v3, v2)
    const versions = ['v4', 'v3', 'v2'];
    
    for (const version of versions) {
      try {
        const pdbUrl = `https://alphafold.ebi.ac.uk/files/AF-${normalizedId}-F1-model_${version}.pdb`;
        console.log(`📥 Trying to fetch PDB from: ${pdbUrl}`);
        
        const response = await fetch(pdbUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const pdbData = await response.text();
          // Check if we got valid PDB data (should have ATOM records)
          if (pdbData && pdbData.length > 100 && pdbData.includes('ATOM')) {
            console.log(`✅ Successfully fetched PDB for ${normalizedId} (${version}, ${pdbData.length} chars)`);
            return pdbData;
          } else {
            console.warn(`PDB data invalid for ${normalizedId} (${version}): too short or no ATOM records`);
          }
        } else {
          console.log(`PDB not found for ${normalizedId} (${version}): ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.warn(`Error fetching PDB for ${normalizedId} (${version}):`, err.message);
      }
    }
    
    // Fallback: Try AlphaFold API to get PDB URL
    try {
      console.log(`📥 Trying AlphaFold API for ${normalizedId}...`);
      const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${normalizedId}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        
        // AlphaFold API returns an array of predictions
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          const prediction = apiData[0];
          
          // Try to get PDB URL from API response
          if (prediction.pdbUrl) {
            console.log(`📥 Fetching PDB from API URL: ${prediction.pdbUrl}`);
            const pdbResponse = await fetch(prediction.pdbUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            if (pdbResponse.ok) {
              const pdbData = await pdbResponse.text();
              if (pdbData && pdbData.length > 100 && pdbData.includes('ATOM')) {
                console.log(`✅ Successfully fetched PDB via API for ${normalizedId} (${pdbData.length} chars)`);
                return pdbData;
              }
            }
          }
          
          // Try CIF format as fallback (if PDB not available)
          if (prediction.cifUrl) {
            console.log(`📥 Trying CIF format: ${prediction.cifUrl}`);
            const cifResponse = await fetch(prediction.cifUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            if (cifResponse.ok) {
              const cifData = await cifResponse.text();
              if (cifData && cifData.length > 100) {
                console.log(`✅ Successfully fetched CIF for ${normalizedId} (${cifData.length} chars)`);
                // Convert CIF to PDB-like format or return as-is
                // For now, return CIF data (3Dmol.js can handle both)
                return cifData;
              }
            }
          }
        }
      } else {
        console.warn(`AlphaFold API request failed for ${normalizedId}: ${apiResponse.status} ${apiResponse.statusText}`);
      }
    } catch (err) {
      console.warn(`Error fetching from AlphaFold API for ${normalizedId}:`, err.message);
    }
    
    console.error(`❌ Could not fetch PDB data for ${normalizedId} from any source`);
    return null;
  };

  // Generate interaction video using Veo API
  const generateInteractionVideo = async () => {
    if (!predictionResult) {
      setVideoError('No prediction results available');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setGeneratedVideo(null);
    setDebugInfo({ step: 'Starting', message: 'Initializing video generation...' });

    try {
      console.log('🎬 Starting video generation...');
      console.log('Prediction result:', predictionResult);
      
      setDebugInfo({ step: 'Analyzing', message: 'Extracting protein information...' });

      let imageA = null;
      let imageB = null;
      let imageComplex = null;

      // Get UniProt IDs - handle both formats (string or object)
      // Priority: predictionResult.protein_a (could be string or object) > selectedProteins
      let uniprotA = null;
      let uniprotB = null;
      
      // Check if protein_a/protein_b are strings (from predict_ppi endpoint) or objects (from predict_ppi_from_sequences)
      if (predictionResult.protein_a) {
        if (typeof predictionResult.protein_a === 'string') {
          uniprotA = predictionResult.protein_a;
        } else if (predictionResult.protein_a.uniprot_id) {
          uniprotA = predictionResult.protein_a.uniprot_id;
        }
      }
      
      if (predictionResult.protein_b) {
        if (typeof predictionResult.protein_b === 'string') {
          uniprotB = predictionResult.protein_b;
        } else if (predictionResult.protein_b.uniprot_id) {
          uniprotB = predictionResult.protein_b.uniprot_id;
        }
      }
      
      // Fallback to selectedProteins if not found in predictionResult
      if (!uniprotA && selectedProteins.proteinA?.uniprot_id) {
        uniprotA = selectedProteins.proteinA.uniprot_id;
      }
      if (!uniprotB && selectedProteins.proteinB?.uniprot_id) {
        uniprotB = selectedProteins.proteinB.uniprot_id;
      }

      // Clean up UniProt IDs (remove any whitespace and uppercase)
      if (uniprotA) uniprotA = String(uniprotA).trim().toUpperCase();
      if (uniprotB) uniprotB = String(uniprotB).trim().toUpperCase();

      console.log('🔍 UniProt ID Extraction:');
      console.log('  - predictionResult.protein_a:', predictionResult.protein_a, typeof predictionResult.protein_a);
      console.log('  - predictionResult.protein_b:', predictionResult.protein_b, typeof predictionResult.protein_b);
      console.log('  - selectedProteins.proteinA:', selectedProteins.proteinA);
      console.log('  - selectedProteins.proteinB:', selectedProteins.proteinB);
      console.log('  - Final uniprotA:', uniprotA);
      console.log('  - Final uniprotB:', uniprotB);
      console.log('  - Prediction result keys:', Object.keys(predictionResult || {}));
      
      // Update debug info
      setDebugInfo({
        step: 'Extracted IDs',
        message: `UniProt IDs: A=${uniprotA || 'MISSING'}, B=${uniprotB || 'MISSING'}`,
        uniprotA,
        uniprotB,
        hasPredictionResult: !!predictionResult,
        predictionKeys: Object.keys(predictionResult || {})
      });

      // Try to capture from viewers first
      imageA = captureViewerScreenshot(viewerAInstanceRef.current);
      imageB = captureViewerScreenshot(viewerBInstanceRef.current);
      imageComplex = captureViewerScreenshot(viewerComplexInstanceRef.current) || 
                     captureViewerScreenshot(viewerInstanceRef.current);

      console.log('Viewer screenshots:', { imageA: !!imageA, imageB: !!imageB, imageComplex: !!imageComplex });

      // If viewer screenshots failed, try to get from AlphaFold API or generate from PDB
      if (!imageA) {
        if (!uniprotA) {
          const errorMsg = 'No UniProt ID for Protein A - cannot generate image';
          console.error('❌ ' + errorMsg);
          setDebugInfo(prev => ({ ...prev, proteinAError: errorMsg, proteinAStatus: 'FAILED - No ID' }));
        } else {
          setDebugInfo(prev => ({ ...prev, proteinAStatus: `Fetching image for ${uniprotA}...` }));
          console.log(`🖼️ [Protein A] Starting image generation for ${uniprotA}`);
          
          // Try AlphaFold image API first (fastest)
          console.log(`🖼️ [Protein A] Attempting to fetch AlphaFold image...`);
          setDebugInfo(prev => ({ ...prev, proteinAStatus: `Trying AlphaFold image API...` }));
          imageA = await fetchAlphaFoldImage(uniprotA);
          
          // If that fails, fetch PDB and generate image
          if (!imageA) {
            setDebugInfo(prev => ({ ...prev, proteinAStatus: 'AlphaFold image failed, trying PDB...' }));
            console.log(`📥 [Protein A] Image fetch failed, trying PDB data...`);
            let pdbData = null;
            
            // Check if structure_data exists in prediction result
            if (predictionResult.protein_a && typeof predictionResult.protein_a === 'object' && predictionResult.protein_a.structure_data) {
              pdbData = predictionResult.protein_a.structure_data;
              setDebugInfo(prev => ({ ...prev, proteinAStatus: 'Using PDB from prediction result...' }));
              console.log(`📦 [Protein A] Using structure_data from prediction result`);
            } else {
              // Fetch from AlphaFold
              setDebugInfo(prev => ({ ...prev, proteinAStatus: `Fetching PDB from AlphaFold for ${uniprotA}...` }));
              console.log(`📥 [Protein A] Fetching PDB from AlphaFold DB...`);
              pdbData = await fetchPDBFromAlphaFold(uniprotA);
            }
            
            if (pdbData && pdbData.length > 100) {
              setDebugInfo(prev => ({ ...prev, proteinAStatus: `Generating image from PDB (${pdbData.length} chars)...` }));
              console.log(`🎨 [Protein A] Generating image from PDB (${pdbData.length} chars)...`);
              const proteinName = (predictionResult.protein_a && typeof predictionResult.protein_a === 'object' && predictionResult.protein_a.name) 
                ? predictionResult.protein_a.name 
                : (selectedProteins.proteinA?.name || 'Protein A');
              imageA = await generateImageFromPDB(pdbData, proteinName, '#ef4444');
              
              if (imageA) {
                setDebugInfo(prev => ({ ...prev, proteinAStatus: '✅ SUCCESS', proteinAImage: true }));
                console.log(`✅ [Protein A] Successfully generated image from PDB`);
              } else {
                setDebugInfo(prev => ({ ...prev, proteinAStatus: '❌ Failed to generate from PDB', proteinAError: 'Image generation failed' }));
                console.error(`❌ [Protein A] Failed to generate image from PDB`);
              }
            } else {
              const errorMsg = `Could not get valid PDB data (got ${pdbData ? pdbData.length : 0} chars)`;
              setDebugInfo(prev => ({ ...prev, proteinAStatus: '❌ FAILED', proteinAError: errorMsg }));
              console.error(`❌ [Protein A] ${errorMsg}`);
            }
          } else {
            setDebugInfo(prev => ({ ...prev, proteinAStatus: '✅ SUCCESS (AlphaFold)', proteinAImage: true }));
            console.log(`✅ [Protein A] Successfully fetched image from AlphaFold`);
          }
        }
      } else {
        setDebugInfo(prev => ({ ...prev, proteinAStatus: '✅ SUCCESS (Viewer)', proteinAImage: true }));
        console.log('✅ [Protein A] Got image from viewer screenshot');
      }

      if (!imageB) {
        if (!uniprotB) {
          const errorMsg = 'No UniProt ID for Protein B - cannot generate image';
          console.error('❌ ' + errorMsg);
          setDebugInfo(prev => ({ ...prev, proteinBError: errorMsg, proteinBStatus: 'FAILED - No ID' }));
        } else {
          setDebugInfo(prev => ({ ...prev, proteinBStatus: `Fetching image for ${uniprotB}...` }));
          console.log(`🖼️ [Protein B] Starting image generation for ${uniprotB}`);
          
          // Try AlphaFold image API first (fastest)
          setDebugInfo(prev => ({ ...prev, proteinBStatus: `Trying AlphaFold image API...` }));
          console.log(`🖼️ [Protein B] Attempting to fetch AlphaFold image...`);
          imageB = await fetchAlphaFoldImage(uniprotB);
          
          // If that fails, fetch PDB and generate image
          if (!imageB) {
            setDebugInfo(prev => ({ ...prev, proteinBStatus: 'AlphaFold image failed, trying PDB...' }));
            console.log(`📥 [Protein B] Image fetch failed, trying PDB data...`);
            let pdbData = null;
            
            // Check if structure_data exists in prediction result
            if (predictionResult.protein_b && typeof predictionResult.protein_b === 'object' && predictionResult.protein_b.structure_data) {
              pdbData = predictionResult.protein_b.structure_data;
              setDebugInfo(prev => ({ ...prev, proteinBStatus: 'Using PDB from prediction result...' }));
              console.log(`📦 [Protein B] Using structure_data from prediction result`);
            } else {
              // Fetch from AlphaFold
              setDebugInfo(prev => ({ ...prev, proteinBStatus: `Fetching PDB from AlphaFold for ${uniprotB}...` }));
              console.log(`📥 [Protein B] Fetching PDB from AlphaFold DB...`);
              pdbData = await fetchPDBFromAlphaFold(uniprotB);
            }
            
            if (pdbData && pdbData.length > 100) {
              setDebugInfo(prev => ({ ...prev, proteinBStatus: `Generating image from PDB (${pdbData.length} chars)...` }));
              console.log(`🎨 [Protein B] Generating image from PDB (${pdbData.length} chars)...`);
              const proteinName = (predictionResult.protein_b && typeof predictionResult.protein_b === 'object' && predictionResult.protein_b.name) 
                ? predictionResult.protein_b.name 
                : (selectedProteins.proteinB?.name || 'Protein B');
              imageB = await generateImageFromPDB(pdbData, proteinName, '#3b82f6');
              
              if (imageB) {
                setDebugInfo(prev => ({ ...prev, proteinBStatus: '✅ SUCCESS', proteinBImage: true }));
                console.log(`✅ [Protein B] Successfully generated image from PDB`);
              } else {
                setDebugInfo(prev => ({ ...prev, proteinBStatus: '❌ Failed to generate from PDB', proteinBError: 'Image generation failed' }));
                console.error(`❌ [Protein B] Failed to generate image from PDB`);
              }
            } else {
              const errorMsg = `Could not get valid PDB data (got ${pdbData ? pdbData.length : 0} chars)`;
              setDebugInfo(prev => ({ ...prev, proteinBStatus: '❌ FAILED', proteinBError: errorMsg }));
              console.error(`❌ [Protein B] ${errorMsg}`);
            }
          } else {
            setDebugInfo(prev => ({ ...prev, proteinBStatus: '✅ SUCCESS (AlphaFold)', proteinBImage: true }));
            console.log(`✅ [Protein B] Successfully fetched image from AlphaFold`);
          }
        }
      } else {
        setDebugInfo(prev => ({ ...prev, proteinBStatus: '✅ SUCCESS (Viewer)', proteinBImage: true }));
        console.log('✅ [Protein B] Got image from viewer screenshot');
      }

      if (!imageComplex) {
        setDebugInfo(prev => ({ ...prev, complexStatus: 'Starting complex image generation...' }));
        console.log(`🖼️ [Complex] Starting complex image generation...`);
        
        // Try to generate complex from PDB data
        if (predictionResult.complex_structure) {
          setDebugInfo(prev => ({ ...prev, complexStatus: 'Using complex_structure from prediction result...' }));
          console.log(`📦 [Complex] Using complex_structure from prediction result`);
          imageComplex = await generateComplexImageFromPDB(
            predictionResult.complex_structure,
            'Protein Complex'
          );
          if (imageComplex) {
            setDebugInfo(prev => ({ ...prev, complexStatus: '✅ SUCCESS', complexImage: true }));
            console.log(`✅ [Complex] Successfully generated from complex_structure`);
          } else {
            setDebugInfo(prev => ({ ...prev, complexStatus: 'Failed to generate from complex_structure' }));
          }
        }
        
        // If that failed, try to create a simple complex by combining both PDBs
        if (!imageComplex && uniprotA && uniprotB) {
          setDebugInfo(prev => ({ ...prev, complexStatus: 'Creating complex by combining proteins...' }));
          console.log(`🔗 [Complex] Creating complex by combining individual proteins...`);
          
          // Get PDB data for both proteins
          let pdbA = null;
          let pdbB = null;
          
          // Try to get from prediction result first
          if (predictionResult.protein_a && typeof predictionResult.protein_a === 'object' && predictionResult.protein_a.structure_data) {
            pdbA = predictionResult.protein_a.structure_data;
            console.log(`📦 [Complex] Got Protein A PDB from prediction result`);
          } else if (uniprotA) {
            console.log(`📥 [Complex] Fetching Protein A PDB from AlphaFold...`);
            pdbA = await fetchPDBFromAlphaFold(uniprotA);
          }
          
          if (predictionResult.protein_b && typeof predictionResult.protein_b === 'object' && predictionResult.protein_b.structure_data) {
            pdbB = predictionResult.protein_b.structure_data;
            console.log(`📦 [Complex] Got Protein B PDB from prediction result`);
          } else if (uniprotB) {
            console.log(`📥 [Complex] Fetching Protein B PDB from AlphaFold...`);
            pdbB = await fetchPDBFromAlphaFold(uniprotB);
          }
          
          if (pdbA && pdbB && pdbA.length > 100 && pdbB.length > 100) {
            console.log(`🔗 [Complex] Combining PDBs (A: ${pdbA.length} chars, B: ${pdbB.length} chars)...`);
            
            // Combine PDBs - modify chain IDs so Protein A is chain A and Protein B is chain B
            const pdbALines = pdbA.split('\n');
            const pdbBLines = pdbB.split('\n');
            
            // Process Protein A - ensure chain A
            const processedA = pdbALines.map(line => {
              if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
                return line.substring(0, 21) + 'A' + line.substring(22);
              }
              return line;
            });
            
            // Process Protein B - ensure chain B and offset coordinates
            const offset = 30.0; // Offset to separate proteins
            const processedB = pdbBLines.map(line => {
              if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
                try {
                  const x = parseFloat(line.substring(30, 38)) + offset;
                  const y = parseFloat(line.substring(38, 46));
                  const z = parseFloat(line.substring(46, 54));
                  return line.substring(0, 21) + 'B' + line.substring(22, 30) + 
                         `${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}` + 
                         line.substring(54);
                } catch (e) {
                  return line.substring(0, 21) + 'B' + line.substring(22);
                }
              }
              return line;
            });
            
            const complexPdb = processedA.join('\n') + '\n' + processedB.join('\n');
            setDebugInfo(prev => ({ ...prev, complexStatus: 'Generating image from combined PDB...' }));
            console.log(`🎨 [Complex] Generating image from combined PDB...`);
            imageComplex = await generateComplexImageFromPDB(complexPdb, 'Protein Complex');
            
            if (imageComplex) {
              setDebugInfo(prev => ({ ...prev, complexStatus: '✅ SUCCESS', complexImage: true }));
              console.log(`✅ [Complex] Successfully generated from combined PDBs`);
            } else {
              setDebugInfo(prev => ({ ...prev, complexStatus: '❌ Failed to generate from combined PDBs', complexError: 'Image generation failed' }));
              console.error(`❌ [Complex] Failed to generate image from combined PDBs`);
            }
          } else {
            const errorMsg = `Could not get both PDBs (A: ${pdbA ? pdbA.length : 0} chars, B: ${pdbB ? pdbB.length : 0} chars)`;
            setDebugInfo(prev => ({ ...prev, complexStatus: '❌ FAILED', complexError: errorMsg }));
            console.error(`❌ [Complex] ${errorMsg}`);
          }
        } else if (!uniprotA || !uniprotB) {
          const errorMsg = `Missing UniProt IDs (A: ${uniprotA}, B: ${uniprotB})`;
          setDebugInfo(prev => ({ ...prev, complexStatus: '❌ FAILED', complexError: errorMsg }));
          console.error(`❌ [Complex] ${errorMsg}`);
        }
      } else {
        setDebugInfo(prev => ({ ...prev, complexStatus: '✅ SUCCESS (Viewer)', complexImage: true }));
        console.log('✅ [Complex] Got image from viewer screenshot');
      }

      console.log('Final images:', { 
        imageA: !!imageA, 
        imageB: !!imageB, 
        imageComplex: !!imageComplex 
      });

      if (!imageA || !imageB || !imageComplex) {
        const missing = [];
        if (!imageA) missing.push('Protein A');
        if (!imageB) missing.push('Protein B');
        if (!imageComplex) missing.push('Complex');
        
        // Set final debug info
        setDebugInfo(prev => ({
          ...prev,
          finalStatus: 'FAILED',
          missingImages: missing,
          summary: {
            imageA: !!imageA,
            imageB: !!imageB,
            imageComplex: !!imageComplex,
            uniprotA,
            uniprotB
          }
        }));
        
        throw new Error(`Could not generate images for: ${missing.join(', ')}. Please ensure structures are loaded.`);
      }
      
      // Success!
      setDebugInfo(prev => ({ ...prev, finalStatus: 'SUCCESS', allImagesReady: true }));

      // Send to backend with images and fallback data
      const requestBody = {
        protein_a_image: imageA,
        protein_b_image: imageB,
        complex_image: imageComplex,
        protein_a_name: predictionResult.protein_a?.name || 'Protein A',
        protein_b_name: predictionResult.protein_b?.name || 'Protein B',
      };

      // Add fallback data (PDB and UniProt IDs) in case images fail
      // (uniprotA and uniprotB already defined above)

      if (predictionResult.protein_a?.structure_data) {
        requestBody.protein_a_pdb = predictionResult.protein_a.structure_data;
      }
      if (uniprotA) {
        requestBody.protein_a_uniprot_id = uniprotA;
      }
      if (predictionResult.protein_b?.structure_data) {
        requestBody.protein_b_pdb = predictionResult.protein_b.structure_data;
      }
      if (uniprotB) {
        requestBody.protein_b_uniprot_id = uniprotB;
      }
      if (predictionResult.complex_structure) {
        requestBody.complex_pdb = predictionResult.complex_structure;
      }

      const response = await fetch(API_ENDPOINTS.generatePPIVideo, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate video' }));
        throw new Error(errorData.detail || 'Failed to generate video');
      }

      const data = await response.json();
      
      if (data.video_data && data.mime_type) {
        setGeneratedVideo({
          data: data.video_data,
          mimeType: data.mime_type,
        });
      } else {
        throw new Error('Invalid video response from server');
      }
    } catch (err) {
      setVideoError(err.message);
      console.error('Video generation error:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="ppi-prediction-container">
      <div className="ppi-header">
        <h2>Protein-Protein Interaction Prediction</h2>
        <p>Predict interactions using UniProt IDs or create new interactions from amino acid sequences</p>
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
          <Dna size={18} /> Create New Interaction
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <>
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper-relative">
                <div className="search-input-wrapper">
                  <Sparkles className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      // Delay to allow clicking on suggestions
                      setTimeout(() => setIsSearchFocused(false), 200);
                    }}
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

                {/* Search Suggestions Dropdown */}
                {isSearchFocused && !searchQuery && !isSearching && (
                  <div 
                    className="search-suggestions-dropdown"
                    onMouseDown={(e) => {
                      // Prevent input blur when clicking on suggestions
                      e.preventDefault();
                    }}
                  >
                    <p className="suggestions-header">Try these examples:</p>
                    <div className="suggestions-list">
                      {proteinSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseDown={(e) => {
                            // Prevent input blur
                            e.preventDefault();
                          }}
                          className="suggestion-item"
                        >
                          <div className="suggestion-content">
                            <span className="suggestion-id">{suggestion.id}</span>
                            <span className="suggestion-name">{suggestion.name}</span>
                          </div>
                          <span className="suggestion-description">{suggestion.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Sequence Input Mode - Create New Interaction */}
      {mode === 'sequence' && (
        <div className="sequence-input-section">
          <div className="new-interaction-info">
            <h3>Create New Protein-Protein Interaction</h3>
            <p>
              Enter two amino acid sequences to create a novel protein-protein interaction. 
              The system will use AlphaFold/ColabFold to predict the 3D structures and simulate their interaction.
            </p>
          </div>
          
          <div className="sequence-inputs">
            <div className="sequence-input-group">
              <label>
                <input
                  type="text"
                  value={proteinAName}
                  onChange={(e) => setProteinAName(e.target.value)}
                  placeholder="Protein A Name (optional, e.g., 'Custom Protein A')"
                  className="protein-name-input"
                />
              </label>
              <label>
                <span>Protein A Sequence (one-letter amino acid codes: A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)</span>
                <textarea
                  value={sequenceA}
                  onChange={(e) => setSequenceA(e.target.value)}
                  placeholder="Enter amino acid sequence for Protein A (e.g., MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL)"
                  className="sequence-textarea"
                  rows={8}
                />
                <span className="sequence-info">
                  {sequenceA.replace(/\s/g, '').length} amino acids
                  {sequenceA.replace(/\s/g, '').length > 0 && (
                    <span className="sequence-validity">
                      {/^[ACDEFGHIKLMNPQRSTVWY]+$/i.test(sequenceA.replace(/\s/g, '')) 
                        ? ' ✓ Valid sequence' 
                        : ' ⚠ Invalid characters detected'}
                    </span>
                  )}
                </span>
              </label>
            </div>

            <div className="sequence-input-group">
              <label>
                <input
                  type="text"
                  value={proteinBName}
                  onChange={(e) => setProteinBName(e.target.value)}
                  placeholder="Protein B Name (optional, e.g., 'Custom Protein B')"
                  className="protein-name-input"
                />
              </label>
              <label>
                <span>Protein B Sequence (one-letter amino acid codes: A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)</span>
                <textarea
                  value={sequenceB}
                  onChange={(e) => setSequenceB(e.target.value)}
                  placeholder="Enter amino acid sequence for Protein B (e.g., MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL)"
                  className="sequence-textarea"
                  rows={8}
                />
                <span className="sequence-info">
                  {sequenceB.replace(/\s/g, '').length} amino acids
                  {sequenceB.replace(/\s/g, '').length > 0 && (
                    <span className="sequence-validity">
                      {/^[ACDEFGHIKLMNPQRSTVWY]+$/i.test(sequenceB.replace(/\s/g, '')) 
                        ? ' ✓ Valid sequence' 
                        : ' ⚠ Invalid characters detected'}
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>

          <div className="prediction-info-box">
            <p>
              <strong>What happens next:</strong> The system will use AlphaFold/ColabFold to predict the 3D structures 
              of both proteins, then simulate their interaction to create a docked complex. This process may take a few minutes.
            </p>
          </div>

          <button
            onClick={predictFromSequences}
            disabled={!sequenceA.trim() || !sequenceB.trim() || isPredicting}
            className="predict-button"
          >
            {isPredicting ? (
              <>
                <Loader className="animate-spin" size={18} />
                Predicting Structures & Interaction...
              </>
            ) : (
              <>
                <Dna size={18} />
                Predict Interaction with AlphaFold
              </>
            )}
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
            <span className={progress > 30 ? 'completed' : ''}>
              {mode === 'sequence' ? 'Predicting structures (AlphaFold)' : 'Fetching structures'}
            </span>
            <span className={progress > 60 ? 'completed' : ''}>Predicting interaction</span>
            <span className={progress > 90 ? 'completed' : ''}>Generating 3D complex</span>
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
              <h4>3D Interaction Visualization</h4>
              <div 
                ref={viewerRef} 
                className="dmol-viewer" 
                style={{ width: '100%', height: '500px', minHeight: '500px' }} 
              />
              <p className="visualization-note">
                {predictionResult.note || '3D complex structure showing predicted interaction'}
              </p>
              
              {/* Video Generation Button */}
              <button
                onClick={generateInteractionVideo}
                disabled={isGeneratingVideo || !predictionResult}
                className="generate-video-button"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    3D Protein Interaction Visualization
                  </>
                )}
              </button>

              {/* Debug Info Panel */}
              {debugInfo && (
                <div className="debug-panel" style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>🔍 Debug Information:</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>Step:</strong> {debugInfo.step || 'N/A'}</div>
                    <div><strong>Message:</strong> {debugInfo.message || 'N/A'}</div>
                    {debugInfo.uniprotA && <div><strong>UniProt A:</strong> {debugInfo.uniprotA}</div>}
                    {debugInfo.uniprotB && <div><strong>UniProt B:</strong> {debugInfo.uniprotB}</div>}
                    {debugInfo.proteinAStatus && (
                      <div style={{ color: debugInfo.proteinAStatus.includes('✅') ? 'green' : debugInfo.proteinAStatus.includes('❌') ? 'red' : 'orange' }}>
                        <strong>Protein A:</strong> {debugInfo.proteinAStatus}
                        {debugInfo.proteinAError && <div style={{ color: 'red', marginLeft: '1rem', fontSize: '0.8rem' }}>Error: {debugInfo.proteinAError}</div>}
                      </div>
                    )}
                    {debugInfo.proteinBStatus && (
                      <div style={{ color: debugInfo.proteinBStatus.includes('✅') ? 'green' : debugInfo.proteinBStatus.includes('❌') ? 'red' : 'orange' }}>
                        <strong>Protein B:</strong> {debugInfo.proteinBStatus}
                        {debugInfo.proteinBError && <div style={{ color: 'red', marginLeft: '1rem', fontSize: '0.8rem' }}>Error: {debugInfo.proteinBError}</div>}
                      </div>
                    )}
                    {debugInfo.complexStatus && (
                      <div style={{ color: debugInfo.complexStatus.includes('✅') ? 'green' : debugInfo.complexStatus.includes('❌') ? 'red' : 'orange' }}>
                        <strong>Complex:</strong> {debugInfo.complexStatus}
                        {debugInfo.complexError && <div style={{ color: 'red', marginLeft: '1rem', fontSize: '0.8rem' }}>Error: {debugInfo.complexError}</div>}
                      </div>
                    )}
                    {debugInfo.summary && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px' }}>
                        <strong>Summary:</strong>
                        <div>Image A: {debugInfo.summary.imageA ? '✅' : '❌'}</div>
                        <div>Image B: {debugInfo.summary.imageB ? '✅' : '❌'}</div>
                        <div>Image Complex: {debugInfo.summary.imageComplex ? '✅' : '❌'}</div>
                        <div>UniProt A: {debugInfo.summary.uniprotA || 'MISSING'}</div>
                        <div>UniProt B: {debugInfo.summary.uniprotB || 'MISSING'}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Video Error */}
              {videoError && (
                <div className="video-error">
                  <AlertCircle size={16} />
                  <span>{videoError}</span>
                </div>
              )}

              {/* Generated Video */}
              {generatedVideo && (
                <div className="generated-video-container">
                  <h5>Generated Interaction Video</h5>
                  <video
                    controls
                    className="generated-video"
                    style={{ width: '100%', maxHeight: '400px' }}
                  >
                    <source
                      src={`data:${generatedVideo.mimeType};base64,${generatedVideo.data}`}
                      type={generatedVideo.mimeType}
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          </div>

          {/* Separate Viewers for Video Generation (Hidden) */}
          <div style={{ display: 'none' }}>
            <div ref={viewerARef} style={{ width: '400px', height: '400px' }} />
            <div ref={viewerBRef} style={{ width: '400px', height: '400px' }} />
            <div ref={viewerComplexRef} style={{ width: '400px', height: '400px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PPIPrediction;
