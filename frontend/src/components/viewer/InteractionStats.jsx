import React from 'react';
import { Target, TrendingUp, Activity } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const InteractionStats = ({ stats, targetProtein, partnerProtein }) => {
  const { theme } = useThemeStore();
  
  if (!stats || !targetProtein || !partnerProtein) return null;

  return (
    <div className={`rounded-lg border shadow-sm p-6 space-y-4 transition-colors ${
      theme === 'dark'
        ? 'bg-gray-700/50 border-gray-600'
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-display font-semibold mb-4 flex items-center ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        <Target className={`w-5 h-5 mr-2 ${
          theme === 'dark' ? 'text-blue-400' : 'text-gray-900'
        }`} />
        Interaction Statistics
      </h3>

      {/* Simulation Info */}
      {stats.simulationTime !== undefined && (
        <div className={`mb-4 p-3 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800/50'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex justify-between items-center text-xs">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Simulation Time:</span>
            <span className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>{(stats.simulationTime * 1000).toFixed(1)} fs</span>
          </div>
          {stats.totalEnergy !== undefined && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Total Energy:</span>
              <span className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{stats.totalEnergy.toFixed(2)} kcal/mol</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className={`py-3 px-2 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800/50'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`text-xs mb-1 text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Total Contacts</div>
          <div className={`text-xl font-bold text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {stats.totalContacts}
          </div>
        </div>
        <div className={`py-3 px-2 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800/50'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`text-xs mb-1 text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Avg Distance</div>
          <div className={`text-xl font-bold text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {stats.averageDistance.toFixed(2)} Å
          </div>
        </div>
        <div className={`py-3 px-2 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/30 border-blue-800/50'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`text-xs mb-1 text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Closest Contact</div>
          <div className={`text-xl font-bold text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {stats.minDistance.toFixed(2)} Å
          </div>
        </div>
      </div>

      {/* Interaction Types */}
      {stats.interactionTypes && Object.keys(stats.interactionTypes).length > 0 && (
        <div className="mb-4">
          <h4 className={`text-sm font-semibold mb-2 flex items-center ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Activity className={`w-4 h-4 mr-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-gray-700'
            }`} />
            Interaction Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.interactionTypes).map(([type, count]) => (
              <div
                key={type}
                className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-600/50 border-gray-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{type}:</span>
                <span className={`ml-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Interface Contacts */}
      {stats.contacts && stats.contacts.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold mb-2 flex items-center ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-gray-700'
            }`} />
            Top Interface Contacts
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.contacts.slice(0, 10).map((contact, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors border text-xs ${
                  theme === 'dark'
                    ? 'bg-gray-600/30 hover:bg-gray-600/50 border-gray-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`font-mono font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {contact.targetResn}{contact.targetResi}
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>↔</span>
                  <span className={`font-mono font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {contact.partnerResn}{contact.partnerResi}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-500 text-gray-300'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}>
                    {contact.distance.toFixed(2)} Å
                  </span>
                </div>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>{contact.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protein Info */}
      <div className={`pt-4 border-t grid grid-cols-2 gap-4 text-xs ${
        theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <div>
          <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Target Protein</div>
          <div className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{targetProtein.name || targetProtein.uniprotId}</div>
          <div className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
            {targetProtein.sequence?.length || 0} residues
          </div>
        </div>
        <div>
          <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Partner Protein</div>
          <div className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{partnerProtein.name || partnerProtein.uniprotId}</div>
          <div className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
            {partnerProtein.sequence?.length || 0} residues
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionStats;

