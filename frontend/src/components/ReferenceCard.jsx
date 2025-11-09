import React from 'react';
import { ExternalLink, Database } from 'lucide-react';
import { Badge } from './ui/badge';

export function ReferenceCard({ reference, theme = 'light' }) {
  return (
    <div className={`border rounded-lg p-5 hover:shadow-md transition-shadow transition-colors ${
      theme === 'dark'
        ? 'bg-gradient-to-r from-gray-800 to-gray-800 border-gray-700'
        : 'bg-gradient-to-r from-white to-slate-50 border-slate-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-indigo-900/50'
              : 'bg-indigo-100'
          }`}>
            <Database className={`w-5 h-5 ${
              theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
            }`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>{reference.name}</h3>
            {reference.citationNumber && (
              <Badge variant="outline" className={`shrink-0 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 border-gray-600'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                [{reference.citationNumber}]
              </Badge>
            )}
          </div>
          {reference.description && (
            <p className={`text-sm mb-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
            }`}>{reference.description}</p>
          )}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 transition-colors text-sm break-all ${
                theme === 'dark'
                  ? 'text-indigo-400 hover:text-indigo-300'
                  : 'text-indigo-600 hover:text-indigo-800'
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {reference.url}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

