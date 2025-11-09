import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Maximize2, X } from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import InteractionViewer from './InteractionViewer';
import InteractionStats from './InteractionStats';
import InteractionViewerModal from './InteractionViewerModal';
import ProteinOverview from '../shared/ProteinOverview';
import ProteinViewerModal from './ProteinViewerModal';
import PartnerSearch from './PartnerSearch';
import EtherShader from './EtherShader';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';

const DualViewer = () => {
  const {
    targetProtein,
    binderProtein,
    renderStyle,
    colorScheme,
    setBinderProtein,
    setInterfaceContacts,
    setInteractionStats: setInteractionStatsInStore,
  } = useProteinStore();
  
  const { theme } = useThemeStore();
  const [interactionStats, setInteractionStats] = useState(null);
  
  // Sync interaction stats to store for chat context
  const updateInteractionStats = (stats) => {
    setInteractionStats(stats);
    setInteractionStatsInStore(stats);
  };

  // Calculate interaction confidence score (0-100)
  // Priority: Use database confidence if available, otherwise calculate from structural data
  const calculateInteractionConfidence = (stats, targetProtein, binderProtein) => {
    // If database confidence is available, use it directly (from interaction service)
    // This is the primary source and should match what's shown in the right panel
    if (binderProtein?.interactionConfidence !== undefined && binderProtein?.interactionConfidence !== null) {
      // Convert to percentage (database confidence is typically 0-1)
      const dbConfidence = binderProtein.interactionConfidence;
      return Math.round(dbConfidence * 100);
    }
    
    // Fallback: Calculate from structural data if database confidence is not available
    if (!stats || !targetProtein || !binderProtein) return null;
    
    const totalContacts = stats.totalContacts || 0;
    const avgDistance = stats.averageDistance || 0;
    const minDistance = stats.minDistance || 0;
    
    // Base confidence from number of contacts (more conservative scaling)
    // More contacts = higher confidence (normalized to sequence length)
    const targetLength = targetProtein.sequence?.length || 100;
    const partnerLength = binderProtein.sequence?.length || 100;
    // Use a more realistic estimate - actual strong interactions have ~1-5% of residues in contact
    const maxExpectedContacts = Math.min(targetLength, partnerLength) * 0.03; // Reduced from 0.1
    const contactRatio = Math.min(totalContacts / Math.max(maxExpectedContacts, 1), 2.0); // Cap at 2x expected
    const contactScore = Math.min(contactRatio * 30, 30); // Reduced from 50 to 30, max 30 points
    
    // Distance-based score (closer = better, ideal is 3-5 Å) - more conservative
    let distanceScore = 0;
    if (minDistance > 0) {
      if (minDistance < 3.5) {
        distanceScore = 25; // Reduced from 30
      } else if (minDistance < 5.0) {
        distanceScore = 20; // Reduced from 25
      } else if (minDistance < 7.0) {
        distanceScore = 12; // Reduced from 15
      } else {
        distanceScore = 3; // Reduced from 5
      }
    }
    
    // Average distance factor - more conservative
    let avgDistanceScore = 0;
    if (avgDistance > 0 && avgDistance < 6.0) {
      // Penalize more for distant averages
      avgDistanceScore = 15 * Math.max(0, (1 - (avgDistance - 3.0) / 3.0)); // Reduced from 20
      avgDistanceScore = Math.max(0, avgDistanceScore);
    }
    
    // Base score (even with perfect metrics, don't exceed ~92%)
    const baseScore = contactScore + distanceScore + avgDistanceScore;
    
    // Apply a scaling factor to ensure top scores are in 85-95% range for strong interactions
    // This prevents artificially high scores
    const scaledScore = baseScore * 0.85; // Scale down by 15%
    
    // Add a small bonus for very strong interactions (many contacts + close distance)
    let bonus = 0;
    if (totalContacts > maxExpectedContacts * 1.5 && minDistance < 4.0) {
      bonus = Math.min(10, (totalContacts / maxExpectedContacts) * 2);
    }
    
    const confidence = Math.min(95, Math.round(scaledScore + bonus)); // Cap at 95%
    
    return Math.max(0, confidence); // Ensure non-negative
  };

  // Calculate confidence - will use database confidence if available, otherwise calculate from stats
  const interactionConfidence = calculateInteractionConfidence(interactionStats, targetProtein, binderProtein);
  
  // For immediate display, prefer database confidence if available
  const displayedConfidence = binderProtein?.interactionConfidence !== undefined && binderProtein?.interactionConfidence !== null
    ? Math.round(binderProtein.interactionConfidence * 100)
    : interactionConfidence;

  const [leftViewer, setLeftViewer] = useState(null);
  const [rightViewer, setRightViewer] = useState(null);
  const [expandedViewer, setExpandedViewer] = useState(null);
  const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col p-6 space-y-4 overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-semibold flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Layers className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
            3D Structure Viewer
          </h2>
        </div>


        {/* Dual Viewer Area */}
        <div className="flex-1 flex gap-6 pr-6 overflow-hidden">
        {/* Left Viewer - Target Protein */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex-1 rounded-xl border backdrop-blur-sm p-6 flex flex-col transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700/50 shadow-lg shadow-black/20'
              : 'bg-white/90 border-gray-200/50 shadow-md shadow-gray-200/50'
          }`}
        >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Target Protein</h3>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {targetProtein ? (
                      <>
                        <span className={`font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>
                          {targetProtein.name || 'Target'}
                        </span>
                        {' '}
                        <span className={`font-mono text-xs ${theme === 'dark' ? 'text-blue-500' : 'text-primary-500'}`}>
                          ({targetProtein.uniprotId})
                        </span>
                      </>
                    ) : (
                      <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>Search to load a protein</span>
                    )}
                  </p>
                </div>
            <button
              onClick={() => setExpandedViewer('target')}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                theme === 'dark'
                  ? 'hover:bg-gray-700/70 text-gray-300'
                  : 'hover:bg-gray-100/70 text-gray-600'
              }`}
              disabled={!targetProtein}
              aria-label="Expand target protein viewer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 relative">
            <MolecularViewer
              pdbData={targetProtein?.pdbData || null}
              style={renderStyle}
              colorScheme={colorScheme}
              height="100%"
              onViewerReady={setLeftViewer}
              showOverlays={false}
            />
          </div>

          {/* Stats for Target Protein */}
          {targetProtein && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Length</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {targetProtein.sequence ? `${targetProtein.sequence.length} aa` : '--- aa'}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mass</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {targetProtein.sequence ? `${(targetProtein.sequence.length * 110 / 1000).toFixed(1)} kDa` : '-- kDa'}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>pLDDT</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {targetProtein.metrics ? targetProtein.metrics.plddt.toFixed(1) : '--'}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Viewer - Interaction View (when partner exists) or Partner Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 rounded-xl border backdrop-blur-sm p-6 flex flex-col transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800/80 border-gray-700/50 shadow-lg shadow-black/20'
              : 'bg-white/90 border-gray-200/50 shadow-md shadow-gray-200/50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => !binderProtein && setIsPartnerSearchOpen(true)}
            >
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {binderProtein ? 'Protein Interaction' : 'Partner/Binder'}
                </h3>
                {binderProtein && displayedConfidence !== null && displayedConfidence !== undefined && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    displayedConfidence >= 70
                      ? theme === 'dark'
                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                      : displayedConfidence >= 50
                      ? theme === 'dark'
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : theme === 'dark'
                      ? 'bg-red-900/40 text-red-300 border border-red-700'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {displayedConfidence}% Confidence
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {binderProtein ? (
                  <>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-primary-600'}`}>
                      {targetProtein?.name || 'Target'}
                    </span>
                    {' '}
                    <span className={`font-mono text-xs ${theme === 'dark' ? 'text-blue-500' : 'text-primary-500'}`}>
                      ({targetProtein?.uniprotId})
                    </span>
                    {' ↔ '}
                    <span className={`font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                      {binderProtein.name || 'Partner'}
                    </span>
                    {' '}
                    <span className={`font-mono text-xs ${theme === 'dark' ? 'text-purple-500' : 'text-purple-500'}`}>
                      ({binderProtein.uniprotId})
                    </span>
                    {' • '}
                    <span className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-primary-600 hover:text-primary-700'}`} onClick={(e) => {
                      e.stopPropagation();
                      setIsPartnerSearchOpen(true);
                    }}>
                      Change partner
                    </span>
                  </>
                ) : (
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>Click to search for a binding partner</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {binderProtein && (
                <button
                  onClick={() => {
                    setBinderProtein(null);
                    setInteractionStats(null);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-red-900/30 text-red-400'
                      : 'hover:bg-red-50 text-red-600'
                  }`}
                  title="Remove partner"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setExpandedViewer('interaction')}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700/70 text-gray-300'
                    : 'hover:bg-gray-100/70 text-gray-600'
                }`}
                disabled={!binderProtein}
                aria-label="Expand interaction viewer"
              >
              <Maximize2 className="w-4 h-4" />
            </button>
            </div>
          </div>

          <div className="flex-1 relative">
            {binderProtein && targetProtein ? (
              <InteractionViewer
                targetPdbData={targetProtein.pdbData}
                partnerPdbData={binderProtein.pdbData}
                targetProtein={targetProtein}
                partnerProtein={binderProtein}
                style={renderStyle}
                colorScheme={colorScheme}
                height="100%"
                onViewerReady={setRightViewer}
                showInteractionsInView={false}
                showOverlays={false}
                onInteractionStatsCalculated={(stats) => {
                  updateInteractionStats(stats);
                  setInterfaceContacts(stats.contacts);
                }}
              />
            ) : (
              <>
            <MolecularViewer
                  pdbData={binderProtein?.pdbData || null}
              style={renderStyle}
              colorScheme={colorScheme}
              height="100%"
              onViewerReady={setRightViewer}
            />

            {/* Empty State Overlay */}
                {!binderProtein && (
            <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-md rounded-xl ${
              theme === 'dark' ? 'bg-gray-800/90' : 'bg-gray-50/90'
            }`}>
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 overflow-hidden bg-transparent">
                  <EtherShader width={64} height={64} />
                </div>
                <p className={`text-sm mb-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Search for a binding partner to visualize interactions
                </p>
                      <button 
                        onClick={() => setIsPartnerSearchOpen(true)}
                        className="group relative px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 text-sm font-medium shadow-lg shadow-primary-600/30 hover:shadow-2xl hover:shadow-primary-600/60 transform hover:scale-110 active:scale-100"
                        style={{
                          transformOrigin: 'center center'
                        }}
                      >
                  <span className="relative z-10">Add Partner</span>
                  <span 
                    className="absolute inset-0 rounded-lg bg-primary-400 opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-300 -z-0"
                    style={{
                      transform: 'scale(1.5)',
                      transformOrigin: 'center center'
                    }}
                  ></span>
                </button>
              </div>
            </div>
                )}
              </>
            )}
          </div>

          {/* Stats for Interaction/Partner - 3 stats, symmetrical with left side */}
          {binderProtein && targetProtein && interactionStats ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Contacts</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {interactionStats.totalContacts || 0}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Avg Distance</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {interactionStats.averageDistance ? `${interactionStats.averageDistance.toFixed(2)} Å` : '-- Å'}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Closest Contact</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {interactionStats.minDistance ? `${interactionStats.minDistance.toFixed(2)} Å` : '-- Å'}
                </div>
              </div>
            </div>
          ) : binderProtein ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Length</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {binderProtein.sequence ? `${binderProtein.sequence.length} aa` : '--- aa'}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Mass</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {binderProtein.sequence ? `${(binderProtein.sequence.length * 110 / 1000).toFixed(1)} kDa` : '-- kDa'}
                </div>
              </div>
              <div className={`py-3 px-2 rounded-lg border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-700/60 border-gray-600/50 shadow-md'
                  : 'bg-blue-50/80 border-blue-200/50 shadow-sm'
              }`}>
                <div className={`text-xs mb-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>pLDDT</div>
                <div className={`text-sm font-semibold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {binderProtein.metrics ? binderProtein.metrics.plddt.toFixed(1) : '--'}
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Protein Overview with PPI */}
      <ProteinOverview showPPISuggestions={true} />

      {/* Modals */}
      <ProteinViewerModal
        isOpen={expandedViewer === 'target'}
        onClose={() => setExpandedViewer(null)}
        protein={targetProtein}
        title="Target Protein"
        colorScheme={colorScheme}
        renderStyle={renderStyle}
      />

      <ProteinViewerModal
        isOpen={expandedViewer === 'partner'}
        onClose={() => setExpandedViewer(null)}
        protein={binderProtein}
        title="Partner/Binder"
        colorScheme={colorScheme}
        renderStyle={renderStyle}
      />

      {/* Interaction Viewer Modal */}
      <InteractionViewerModal
        isOpen={expandedViewer === 'interaction'}
        onClose={() => setExpandedViewer(null)}
        targetProtein={targetProtein}
        partnerProtein={binderProtein}
        interactionStats={interactionStats}
        colorScheme={colorScheme}
        renderStyle={renderStyle}
        onInteractionStatsCalculated={(stats) => {
          updateInteractionStats(stats);
          setInterfaceContacts(stats.contacts);
        }}
      />

      {/* Partner Search Dialog */}
      <PartnerSearch
        isOpen={isPartnerSearchOpen}
        onClose={() => setIsPartnerSearchOpen(false)}
        onPartnerAdded={() => {
          console.log('✅ Partner added successfully');
        }}
      />
    </div>
  );
};

export default DualViewer;
