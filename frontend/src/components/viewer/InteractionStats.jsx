import React from 'react';
import { Target, TrendingUp, Activity } from 'lucide-react';

const InteractionStats = ({ stats, targetProtein, partnerProtein }) => {
  if (!stats || !targetProtein || !partnerProtein) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-blue-600" />
        Interaction Statistics
      </h3>

      {/* Simulation Info */}
      {stats.simulationTime !== undefined && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Simulation Time:</span>
            <span className="font-semibold text-blue-600">{(stats.simulationTime * 1000).toFixed(1)} fs</span>
          </div>
          {stats.totalEnergy !== undefined && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-gray-600">Total Energy:</span>
              <span className="font-semibold text-blue-600">{stats.totalEnergy.toFixed(2)} kcal/mol</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center py-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Total Contacts</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalContacts}
          </div>
        </div>
        <div className="text-center py-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Avg Distance</div>
          <div className="text-xl font-bold text-blue-600">
            {stats.averageDistance.toFixed(2)} Å
          </div>
        </div>
        <div className="text-center py-3 rounded-lg bg-blue-100 border border-blue-300">
          <div className="text-xs text-gray-600 mb-1">Closest Contact</div>
          <div className="text-xl font-bold text-blue-700">
            {stats.minDistance.toFixed(2)} Å
          </div>
        </div>
      </div>

      {/* Interaction Types */}
      {stats.interactionTypes && Object.keys(stats.interactionTypes).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Activity className="w-4 h-4 mr-1" />
            Interaction Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.interactionTypes).map(([type, count]) => (
              <div
                key={type}
                className="px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs"
              >
                <span className="font-medium text-gray-900">{type}:</span>
                <span className="ml-1 text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Interface Contacts */}
      {stats.contacts && stats.contacts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Top Interface Contacts
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.contacts.slice(0, 10).map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-blue-600">
                    {contact.targetResn}{contact.targetResi}
                  </span>
                  <span className="text-gray-400">↔</span>
                  <span className="font-mono font-semibold text-blue-600">
                    {contact.partnerResn}{contact.partnerResi}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                    {contact.distance.toFixed(2)} Å
                  </span>
                </div>
                <span className="text-xs text-gray-500">{contact.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protein Info */}
      <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-600 mb-1">Target Protein</div>
          <div className="font-semibold text-gray-900">{targetProtein.name || targetProtein.uniprotId}</div>
          <div className="text-gray-500">{targetProtein.sequence.length} residues</div>
        </div>
        <div>
          <div className="text-gray-600 mb-1">Partner Protein</div>
          <div className="font-semibold text-gray-900">{partnerProtein.name || partnerProtein.uniprotId}</div>
          <div className="text-gray-500">{partnerProtein.sequence.length} residues</div>
        </div>
      </div>
    </div>
  );
};

export default InteractionStats;

