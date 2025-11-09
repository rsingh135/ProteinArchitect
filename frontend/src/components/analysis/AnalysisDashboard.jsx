import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Target, 
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Layers,
  AlertCircle,
  Users
} from 'lucide-react';
import { useProteinStore } from '../../store/proteinStore';
import { useThemeStore } from '../../store/themeStore';
import InteractionAnalysisService from '../../services/interactionAnalysisService';
import ConfidencePanel from './ConfidencePanel';
import PAEPlot from './PAEPlot';

const AnalysisDashboard = () => {
  const { targetProtein, binderProtein, interactionStats } = useProteinStore();
  const { theme } = useThemeStore();
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      // Only work when both proteins are present
      if (!targetProtein || !binderProtein) {
        setAnalysisData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use interactionStats if available, otherwise try to get from store
        let stats = interactionStats;
        if (!stats) {
          // Wait a moment for stats to be calculated
          await new Promise(resolve => setTimeout(resolve, 1000));
          const storeState = useProteinStore.getState();
          stats = storeState.interactionStats;
        }

        const data = await InteractionAnalysisService.getInteractionAnalysis(
          targetProtein,
          binderProtein,
          stats
        );
        setAnalysisData(data);
      } catch (err) {
        console.error('Error fetching interaction analysis:', err);
        setError(err.message);
        // Try to get basic analysis from stats only
        if (interactionStats) {
          const basicData = InteractionAnalysisService.getBasicInteractionAnalysis(
            interactionStats,
            targetProtein,
            binderProtein
          );
          if (basicData) {
            setAnalysisData(basicData);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [targetProtein, binderProtein, interactionStats]);

  // Show waiting state if only one protein is loaded
  if (!targetProtein || !binderProtein) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">Waiting for Binding Partner</p>
          <p className="text-gray-500 text-sm mt-2">
            {!targetProtein && !binderProtein 
              ? 'Please load both target and partner proteins to view interaction analysis'
              : !targetProtein 
              ? 'Please load a target protein first'
              : 'Please add a binding partner protein to view detailed interaction analysis'}
          </p>
        </div>
      </div>
    );
  }

  // Use memoized data - either from analysisData or fallback to basic analysis
  const data = useMemo(() => {
    if (analysisData) return analysisData;
    if (interactionStats) {
      return InteractionAnalysisService.getBasicInteractionAnalysis(
        interactionStats,
        targetProtein,
        binderProtein
      );
    }
    return null;
  }, [analysisData, interactionStats, targetProtein, binderProtein]);

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing protein-protein interactions...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 text-lg">Error loading interaction analysis</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Activity className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg font-semibold">Calculating Interactions</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while interaction statistics are computed from the protein structures...</p>
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const interfaceAnalysis = data.interfaceAnalysis || {};
  const bindingSiteAnalysis = data.bindingSiteAnalysis || {};
  const interactionTypeAnalysis = data.interactionTypeAnalysis || {};
  const energeticsAnalysis = data.energeticsAnalysis || {};
  const residueAnalysis = data.residueAnalysis || {};
  const domainAnalysis = data.domainAnalysis || {};
  const knownInteractions = data.knownInteractions || {};

  // Interaction Metrics Cards (all blue)
  const metricCards = [
    {
      label: 'Total Contacts',
      value: metrics.totalContacts || 0,
      icon: Target,
      unit: '',
    },
    {
      label: 'Average Distance',
      value: metrics.averageDistance || '0.00',
      icon: BarChart3,
      unit: 'Å',
    },
    {
      label: 'Closest Contact',
      value: metrics.minDistance || '0.00',
      icon: TrendingUp,
      unit: 'Å',
    },
    {
      label: 'Interface Area',
      value: metrics.interfaceArea || '0.00',
      icon: Layers,
      unit: 'Å²',
    },
    {
      label: 'Contact Density',
      value: metrics.contactDensity || '0.00',
      icon: Activity,
      unit: '/100Å²',
    },
    {
      label: 'Binding Strength',
      value: energeticsAnalysis.bindingStrength || 'Unknown',
      icon: Zap,
      unit: '',
    },
  ];

  // Check if we have both proteins for graphs
  const hasBothProteins = targetProtein && binderProtein && interactionStats;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-6 transition-colors ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* Header */}
        <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-2xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Protein-Protein Interaction Analysis
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className={`font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{targetProtein.name}</span>
            {' '}({targetProtein.uniprotId}) ↔ {' '}
            <span className={`font-semibold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>{binderProtein.name}</span>
            {' '}({binderProtein.uniprotId})
          </p>
        </div>

        {/* Confidence Graphs - First Row */}
        {hasBothProteins && (
          <div className="grid grid-cols-2 gap-6">
            <ConfidencePanel protein={targetProtein} interactionStats={interactionStats} />
            <PAEPlot />
          </div>
        )}

        {/* Interaction Metrics */}
        <div className="grid grid-cols-6 gap-4">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-lg border shadow-sm p-4 transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-blue-900/50'
                    : 'bg-white border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Icon className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
                <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{metric.label}</p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {metric.value}{metric.unit && ` ${metric.unit}`}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Analysis Sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Calculated Interface Properties (Replaces Database Information) */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Layers className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Calculated Interface Properties
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Binding Energy</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {energeticsAnalysis.bindingScore ? `${energeticsAnalysis.bindingScore} kcal/mol` : 'N/A'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Stability</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {energeticsAnalysis.stability || 'Unknown'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Compactness</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {interfaceAnalysis.complementarity || 'Unknown'}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Interface Shape</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {interfaceAnalysis.shape || 'Unknown'}
                  </div>
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interface Characteristics</label>
                <textarea
                  readOnly
                  value={interfaceAnalysis.description || 'Interface analysis requires interaction data.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Binding Site Analysis */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Target className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Binding Site Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Binding Sites</label>
                <textarea
                  readOnly
                  value={bindingSiteAnalysis.description || 'Binding site analysis requires contact data.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
              <div>
                <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Hot Spot Residues</label>
                {bindingSiteAnalysis.hotSpots && bindingSiteAnalysis.hotSpots.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {bindingSiteAnalysis.hotSpots.slice(0, 5).map((hotspot, index) => (
                      <div key={index} className={`p-2 rounded border text-xs transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {hotspot.residue}{hotspot.position}
                        </span>
                        <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {hotspot.contacts} contacts, {hotspot.minDistance} Å
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs p-2 rounded border transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 bg-gray-700/50 border-gray-600'
                      : 'text-gray-500 bg-gray-50 border-gray-200'
                  }`}>
                    No hot spot residues identified
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Interaction Types */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Activity className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Interaction Types
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interaction Breakdown</label>
                <textarea
                  readOnly
                  value={interactionTypeAnalysis.description || 'Interaction type analysis requires interaction statistics.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
              {interactionTypeAnalysis.types && Object.keys(interactionTypeAnalysis.types).length > 0 && (
                <div>
                  <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interaction Type Distribution</label>
                  <div className="space-y-2">
                    {Object.entries(interactionTypeAnalysis.types).map(([type, count]) => (
                      <div key={type} className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{type}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{count}</span>
                          {interactionTypeAnalysis.typePercentages && (
                            <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                              ({interactionTypeAnalysis.typePercentages[type]}%)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Binding Energetics */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Zap className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Binding Energetics
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Energetic Analysis</label>
                <textarea
                  readOnly
                  value={energeticsAnalysis.description || 'Energetic analysis requires interaction data.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="4"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Affinity</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{energeticsAnalysis.estimatedAffinity || 'Unknown'}</div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Strength</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{energeticsAnalysis.bindingStrength || 'Unknown'}</div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Stability</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{energeticsAnalysis.stability || 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interface Residues */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Interface Residues
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Residue Analysis</label>
                <textarea
                  readOnly
                  value={residueAnalysis.description || 'Residue analysis requires contact data.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Critical Residues</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {residueAnalysis.criticalResidues?.length || 0}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Charged Contacts</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {residueAnalysis.chargedResidues || 0}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Hydrophobic Contacts</div>
                  <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {residueAnalysis.hydrophobicResidues || 0}
                  </div>
                </div>
              </div>
              {residueAnalysis.criticalResidues && residueAnalysis.criticalResidues.length > 0 && (
                <div>
                  <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Top Critical Contacts</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {residueAnalysis.criticalResidues.slice(0, 5).map((contact, index) => (
                      <div key={index} className={`p-2 rounded border text-xs transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {contact.target}
                        </span>
                        <span className={`mx-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>↔</span>
                        <span className={`font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {contact.partner}
                        </span>
                        <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {contact.distance} Å ({contact.type})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Known Interactions & Domain Analysis */}
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Link2 className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Known Interactions & Domain Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Known Interactions</label>
                <textarea
                  readOnly
                  value={knownInteractions.description || 'Known interaction data not available.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Domain Analysis</label>
                <textarea
                  readOnly
                  value={domainAnalysis.description || 'Domain analysis requires protein data.'}
                  className={`w-full p-3 text-sm border rounded-lg resize-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-blue-50 border-gray-200 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Contact Table */}
        {interactionStats?.contacts && interactionStats.contacts.length > 0 && (
          <div className={`rounded-lg border shadow-sm p-6 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              Detailed Interface Contacts
            </h3>
            <div className={`border rounded-lg overflow-hidden max-h-96 overflow-y-auto transition-colors ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full text-xs">
                <thead className={`border-b sticky top-0 transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-blue-50 border-gray-200'
                }`}>
                  <tr>
                    <th className={`px-4 py-3 text-left font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Target Residue</th>
                    <th className={`px-4 py-3 text-left font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Partner Residue</th>
                    <th className={`px-4 py-3 text-left font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Distance (Å)</th>
                    <th className={`px-4 py-3 text-left font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Interaction Type</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {interactionStats.contacts.slice(0, 50).map((contact, index) => (
                    <tr key={index} className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50'}`}>
                      <td className={`px-4 py-2 font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {contact.targetResn}{contact.targetResi}
                      </td>
                      <td className={`px-4 py-2 font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {contact.partnerResn}{contact.partnerResi}
                      </td>
                      <td className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {typeof contact.distance === 'number' 
                          ? contact.distance.toFixed(2) 
                          : parseFloat(contact.distance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {contact.type || 'Contact'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
