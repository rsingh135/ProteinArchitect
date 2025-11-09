import React from 'react';
import { ExternalLink, Database } from 'lucide-react';
import { Badge } from './ui/badge';

export function ReferenceCard({ reference }) {
  return (
    <div className="bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-slate-900 font-medium">{reference.name}</h3>
            {reference.citationNumber && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 shrink-0">
                [{reference.citationNumber}]
              </Badge>
            )}
          </div>
          {reference.description && (
            <p className="text-slate-600 text-sm mb-3">{reference.description}</p>
          )}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors text-sm break-all"
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

