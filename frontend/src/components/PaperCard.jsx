import React from 'react';
import { Badge } from './ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';
import { cleanMarkdown, renderMarkdownLinks } from '../utils/markdownParser.jsx';

export function PaperCard({ paper, number }) {
  const isRecent = paper.year && parseInt(paper.year) >= new Date().getFullYear() - 2;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-base">{number}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-slate-900 text-lg font-semibold mb-3 leading-tight">
            {cleanMarkdown(paper.title || '')}
          </h3>
          
          {/* All information in one cohesive block */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            {/* Authors */}
            {paper.authors && (
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-slate-700 font-semibold text-base shrink-0">Authors:</span>
                <span className="text-slate-600 text-base flex-1">{paper.authors}</span>
              </div>
            )}
            
            {/* Journal, Year, DOI in one row */}
            <div className="flex flex-wrap items-center gap-4">
              {paper.journal && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-semibold text-base">Journal:</span>
                  <span className="text-slate-600 text-base">{paper.journal}</span>
                </div>
              )}
              {paper.year && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-base px-2 py-1">
                  {paper.year}
                </Badge>
              )}
              {paper.doi && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-semibold text-base">DOI/PMID:</span>
                  <span className="text-slate-600 text-base font-mono">{paper.doi}</span>
                </div>
              )}
              {paper.citationNumber && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base px-2 py-1">
                  Citation [{paper.citationNumber}]
                </Badge>
              )}
              {isRecent && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 shrink-0 flex items-center gap-1 text-white border-0 text-base px-2 py-1">
                  <Sparkles className="w-3 h-3" />
                  Recent
                </Badge>
              )}
            </div>
            
            {/* Summary */}
            {paper.summary && (
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-slate-700 font-semibold text-base shrink-0">Summary:</span>
                </div>
                <div className="text-slate-700 text-base leading-relaxed">
                  {renderMarkdownLinks(cleanMarkdown(paper.summary))}
                </div>
              </div>
            )}
            
            {/* Description */}
            {paper.description && (
              <div className={paper.summary ? "pt-2 border-t border-slate-200" : ""}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-slate-700 font-semibold text-base shrink-0">Description:</span>
                </div>
                <div className="text-slate-700 text-base leading-relaxed">
                  {renderMarkdownLinks(cleanMarkdown(paper.description))}
                </div>
              </div>
            )}
            
            {/* Hyperlink */}
            {paper.link && (
              <div className="pt-2 border-t border-slate-200">
                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-base font-medium"
                >
                  <ExternalLink className="w-5 h-5" />
                  View Full Paper
                  <span className="text-xs text-blue-500 ml-1">({paper.link.length > 60 ? paper.link.substring(0, 60) + '...' : paper.link})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
