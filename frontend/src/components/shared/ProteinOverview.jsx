import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader } from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import { ProteinService } from '../../services/proteinService';
import InteractionService from '../../services/interactionService';
import UniProtService from '../../services/uniprotService';

const ProteinOverview = ({ showPPISuggestions = false }) => {
  const { targetProtein, confidenceScores, setBinderProtein } = useProteinStore();
  const { theme } = useThemeStore();
  const [ppiSuggestions, setPpiSuggestions] = useState([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [proteinFunction, setProteinFunction] = useState('');
  
  // Fetch protein function and interactions when target protein changes
  useEffect(() => {
    const fetchProteinData = async () => {
      if (!targetProtein?.uniprotId) {
        setProteinFunction('');
        setPpiSuggestions([]);
        return;
      }

      // Fetch protein function from UniProt
      try {
        const uniprotData = await UniProtService.fetchProteinDetails(targetProtein.uniprotId);
        const functionText = uniprotData.function || '';
        // Extract first sentence from function text, max 120 characters for concise display
        if (functionText) {
          // Find first sentence (ends with period, exclamation, or question mark)
          const sentenceMatch = functionText.match(/^[^.!?]+[.!?]/);
          let firstSentence = sentenceMatch 
            ? sentenceMatch[0].trim() 
            : functionText.split('.')[0].trim();
          
          // Clean up common prefixes and make it concise
          firstSentence = firstSentence
            .replace(/^(FUNCTION|Function):\s*/i, '')
            .replace(/^This protein\s+/i, '')
            .trim();
          
          // Truncate if too long, ensuring it ends properly with a period
          // Max length: ~68 characters (length of "Multifunctional transcription factor that induces cell cycle arrest")
          const maxLength = 68;
          if (firstSentence.length > maxLength) {
            const truncated = firstSentence.substring(0, maxLength);
            // Try to end at a word boundary (within last 15 characters)
            const lastSpace = truncated.lastIndexOf(' ');
            let finalText;
            if (lastSpace > maxLength - 15 && lastSpace < maxLength) {
              finalText = truncated.substring(0, lastSpace);
            } else {
              // If no good word boundary, truncate at maxLength
              finalText = truncated;
            }
            // Ensure it ends with a period (remove any trailing punctuation and add period)
            finalText = finalText.replace(/[.,;:!?]+$/, '').trim();
            if (finalText && !finalText.endsWith('.')) {
              finalText += '.';
            }
            setProteinFunction(finalText);
          } else {
            // Ensure existing sentence ends with a period
            let finalText = firstSentence.trim();
            if (finalText && !finalText.match(/[.!?]$/)) {
              finalText += '.';
            }
            setProteinFunction(finalText);
          }
        } else {
          setProteinFunction('');
        }
      } catch (error) {
        console.error('Error fetching protein function:', error);
        setProteinFunction('');
      }

      // Fetch interactions if needed
      if (showPPISuggestions) {
        setIsLoadingInteractions(true);
        try {
          const interactions = await InteractionService.fetchInteractions(targetProtein.uniprotId);
          setPpiSuggestions(interactions);
        } catch (error) {
          console.error('Error fetching interactions:', error);
          setPpiSuggestions([]);
        } finally {
          setIsLoadingInteractions(false);
        }
      } else {
        setPpiSuggestions([]);
      }
    };

    fetchProteinData();
  }, [targetProtein?.uniprotId, showPPISuggestions]);
  
  // Handle adding a partner protein
  const handleAddPartner = async (partnerId) => {
    if (!partnerId) return;

    setIsLoadingInteractions(true);
    
    try {
      console.log('🔍 Adding partner protein:', partnerId);
      
      // Search for the partner protein
      const partnerData = await ProteinService.searchProtein(partnerId);
      console.log('✅ Partner protein data received:', partnerData);
      
      // Fetch the structure file
      const pdbData = await ProteinService.fetchStructure(partnerData, 'pdb');
      console.log('✅ Partner PDB structure loaded');
      
      // Update store with binder protein data
      setBinderProtein({
        ...partnerData,
        pdbData,
      });
      
      console.log('✅ Partner added successfully:', partnerData.name);
    } catch (error) {
      console.error('❌ Error adding partner:', error);
      alert(`Failed to load partner protein: ${error.message}\n\nTry using a UniProt ID like 'P01308' (human insulin)`);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  // Use fetched protein data or show placeholder
  const proteinName = targetProtein?.name || 'No protein loaded';
  const uniprotId = targetProtein?.uniprotId || '---';
  const organism = targetProtein?.organism || 'Unknown';
  const sequence = targetProtein?.sequence?.full || '';
  const sequenceLength = targetProtein?.sequence?.length || 0;
  const plddt = targetProtein?.metrics?.plddt || confidenceScores?.average || 0;
  const confidence = targetProtein?.metrics?.confidence || confidenceScores?.confidence || 'unknown';
  const molecularWeight = targetProtein ? ProteinService.calculateMolecularWeight(sequence) : 0;

  // Generate a short description if we have the protein
  const getDescription = () => {
    if (!targetProtein) {
      return 'Search for a protein to view its details';
    }
    // Use function from UniProt if available
    if (proteinFunction) {
      return proteinFunction;
    }
    // Fallback to gene name if available
    if (targetProtein.metadata?.gene) {
      return `Gene: ${targetProtein.metadata.gene}`;
    }
    // Last resort: use protein name
    return proteinName;
  };

  // Get confidence badge color
  const getConfidenceBadge = () => {
    if (theme === 'dark') {
      if (plddt >= 90) return { color: 'bg-green-900/30 text-green-400', label: 'Very High' };
      if (plddt >= 70) return { color: 'bg-blue-900/30 text-blue-400', label: 'High' };
      if (plddt >= 50) return { color: 'bg-yellow-900/30 text-yellow-400', label: 'Medium' };
      return { color: 'bg-red-900/30 text-red-400', label: 'Low' };
    } else {
      if (plddt >= 90) return { color: 'bg-green-100 text-green-700', label: 'Very High' };
      if (plddt >= 70) return { color: 'bg-blue-100 text-blue-700', label: 'High' };
      if (plddt >= 50) return { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' };
      return { color: 'bg-red-100 text-red-700', label: 'Low' };
    }
  };

  const confidenceBadge = getConfidenceBadge();

  return (
    <div className={`w-96 border-l overflow-y-auto transition-all duration-300 ${
      theme === 'dark'
        ? 'border-gray-700/50 bg-gray-800/90 backdrop-blur-sm'
        : 'border-gray-200/50 bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="p-6 space-y-6">
        {/* Protein Overview */}
        <div>
          <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Target Protein
          </h3>

          <div className="space-y-4">
            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
              <p className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{proteinName}</p>
            </div>

            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>UniProt ID</p>
              <div className="flex items-center justify-between">
                <p className={`text-base font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{uniprotId}</p>
                {targetProtein && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${confidenceBadge.color}`}>
                    {confidenceBadge.label}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Organism</p>
              <p className={`text-base italic ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{organism}</p>
            </div>

            {targetProtein && (
              <div>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</p>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getDescription()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        {targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Structure Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-gray-50/80 border-gray-200/50 shadow-sm'
              }`}>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Length</p>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{sequenceLength} aa</p>
              </div>
              <div className={`rounded-lg p-3 border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-gray-50/80 border-gray-200/50 shadow-sm'
              }`}>
                <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mass</p>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{molecularWeight.toFixed(1)} kDa</p>
              </div>
            </div>
          </div>
        )}

        {/* Sequence - Full Sequence */}
        {targetProtein && sequence && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Sequence
            </h3>
            <div className={`rounded-lg p-4 border backdrop-blur-sm transition-all duration-200 max-h-64 overflow-y-auto ${
              theme === 'dark'
                ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                : 'bg-gray-50/80 border-gray-200/50 shadow-sm'
            }`}>
              <p className={`font-mono text-xs leading-relaxed break-all whitespace-pre-wrap ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {sequence}
              </p>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{sequenceLength} amino acids</p>
            </div>
          </div>
        )}

        {/* PPI Suggestions - Only shown in 3D Viewer */}
        {showPPISuggestions && targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-xs font-display font-bold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Protein Interactions
            </h3>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Suggested binding partners based on experimental data
            </p>
            {isLoadingInteractions ? (
              <div className="flex items-center justify-center py-8">
                <Loader className={`w-5 h-5 animate-spin ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading interactions...</span>
              </div>
            ) : ppiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {ppiSuggestions.map((ppi, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddPartner(ppi.id)}
                    className={`w-full text-left p-3 rounded-lg border backdrop-blur-sm transition-all duration-200 group hover:scale-[1.02] ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:border-blue-600/70 hover:bg-gray-700/60 shadow-md'
                        : 'border-gray-200/50 hover:border-primary-300 hover:bg-primary-50/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium group-hover:text-primary-700 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {ppi.name}
                        </p>
                        <p className={`text-xs font-mono mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{ppi.id}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Confidence: <span className={`font-semibold ${
                              theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            }`}>{(ppi.confidence * 100).toFixed(0)}%</span>
                          </span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Source: <span className="font-medium">{ppi.source}</span>
                          </span>
                        </div>
                      </div>
                      <ExternalLink className={`w-4 h-4 flex-shrink-0 ml-2 group-hover:text-primary-600 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 rounded-lg border backdrop-blur-sm ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-gray-50/80 border-gray-200/50 shadow-sm'
              }`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No interaction data available
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Insights - Only shown in Analysis Dashboard */}
        {!showPPISuggestions && targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                AI Insights
              </h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                theme === 'dark'
                  ? 'bg-purple-900/30 text-purple-400'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                GPT-4
              </span>
            </div>

            <div className="space-y-3">
              <div className={`rounded-lg p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-800/50 shadow-lg'
                  : 'bg-gradient-to-br from-purple-50/90 to-blue-50/90 border-purple-100/50 shadow-md'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>🧬 Key Structural Features</h4>
                <ul className={`text-sm space-y-1.5 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <li>• High confidence prediction (pLDDT: {plddt.toFixed(1)})</li>
                  <li>• {sequenceLength} amino acid residues</li>
                  <li>• AlphaFold {targetProtein.metrics?.modelVersion} prediction</li>
                </ul>
              </div>

              <div className={`rounded-lg p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'bg-green-900/30 border-green-800/50 shadow-lg'
                  : 'bg-green-50/90 border-green-100/50 shadow-md'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>✓ Quality Assessment</h4>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Model confidence: {confidenceBadge.label} (pLDDT: {plddt.toFixed(1)}). 
                  {plddt >= 70 ? ' Suitable for detailed structural analysis.' : ' Consider experimental validation.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Resources */}
        {targetProtein && (
          <div className={`pt-6 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              External Resources
            </h3>
            <div className="space-y-2">
              {[
                { 
                  name: 'UniProt', 
                  url: `https://www.uniprot.org/uniprotkb/${uniprotId}` 
                },
                { 
                  name: 'AlphaFold DB', 
                  url: `https://alphafold.ebi.ac.uk/entry/${uniprotId}` 
                },
                { 
                  name: 'PDB', 
                  url: `https://www.rcsb.org/search?q=${encodeURIComponent(uniprotId)}&requestFrom=quick-search` 
                },
                { 
                  name: 'KEGG', 
                  url: `https://www.genome.jp/dbget-bin/www_bget?uniprot:${uniprotId}` 
                },
              ].map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm transition-all duration-200 group hover:scale-[1.02] ${
                    theme === 'dark'
                      ? 'bg-gray-700/60 hover:bg-gray-700/80 border-gray-600/50 shadow-md'
                      : 'bg-gray-50/80 hover:bg-gray-100 border-gray-200/50 shadow-sm'
                  }`}
                >
                  <span className={`text-sm font-medium group-hover:text-primary-600 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {resource.name}
                  </span>
                  <ExternalLink className={`w-4 h-4 group-hover:text-primary-600 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!targetProtein && (
          <div className={`pt-6 border-t text-center ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className={`rounded-xl p-8 border-2 border-dashed backdrop-blur-sm transition-all duration-300 hover:border-solid ${
              theme === 'dark'
                ? 'bg-gray-700/60 border-gray-600/50 shadow-lg'
                : 'bg-gray-50/80 border-gray-300/50 shadow-md'
            }`}>
              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>No protein loaded</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Use the search bar above to load a protein structure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProteinOverview;
