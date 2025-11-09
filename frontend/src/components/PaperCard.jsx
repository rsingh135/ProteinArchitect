import React from 'react';
import { Badge } from './ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';
import { cleanMarkdown, renderMarkdownLinks } from '../utils/markdownParser.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function PaperCard({ paper, number, theme = 'light' }) {
  const isRecent = paper.year && parseInt(paper.year) >= new Date().getFullYear() - 2;
  
  return (
    <div className={`border rounded-lg p-6 hover:shadow-md transition-shadow transition-colors ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-blue-900/50'
              : 'bg-blue-100'
          }`}>
            <span className={`font-semibold text-base ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
            }`}>{number}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-lg font-semibold mb-3 leading-tight ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {cleanMarkdown(paper.title || '')}
          </h3>
          
          {/* All information in one cohesive block */}
          <div className={`border rounded-lg p-4 space-y-3 transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700/50 border-gray-600'
              : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Authors */}
            {paper.authors && (
              <div className="flex flex-wrap items-start gap-2">
                <span className={`font-semibold text-base shrink-0 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-slate-700'
                }`}>Authors:</span>
                <span className={`text-base flex-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>{paper.authors}</span>
              </div>
            )}
            
            {/* Journal, Year, DOI in one row */}
            <div className="flex flex-wrap items-center gap-4">
              {paper.journal && (
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-base ${
                    theme === 'dark' ? 'text-gray-200' : 'text-slate-700'
                  }`}>Journal:</span>
                  <span className={`text-base ${
                    theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                  }`}>{paper.journal}</span>
                </div>
              )}
              {paper.year && (
                <Badge variant="outline" className={`text-base px-2 py-1 ${
                  theme === 'dark'
                    ? 'bg-green-900/30 text-green-400 border-green-800'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {paper.year}
                </Badge>
              )}
              {(paper.doi || paper.pmid) && (
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-base ${
                    theme === 'dark' ? 'text-gray-200' : 'text-slate-700'
                  }`}>DOI/PMID:</span>
                  <span className={`text-base font-mono ${
                    theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                  }`}>
                    {paper.doi && paper.doi.toLowerCase() !== 'not available' && paper.doi.toLowerCase() !== 'n/a' 
                      ? paper.doi 
                      : paper.pmid && paper.pmid.toLowerCase() !== 'not available' && paper.pmid.toLowerCase() !== 'n/a'
                        ? `PMID: ${paper.pmid}`
                        : 'Not available'}
                  </span>
                </div>
              )}
              {paper.citationNumber && (
                <Badge variant="outline" className={`text-base px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 border-gray-600'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`} title={`Citation number ${paper.citationNumber}`}>
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
            
            {/* Description - always show, even if N/A */}
            <div className={`pt-2 border-t ${
              theme === 'dark' ? 'border-gray-600' : 'border-slate-200'
            }`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`font-semibold text-base shrink-0 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-slate-700'
                }`}>Description:</span>
              </div>
              <div className={`text-base leading-relaxed prose prose-sm max-w-none ${
                theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-slate-700'
              }`}>
                {paper.description && paper.description !== 'N/A' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {paper.description}
                  </ReactMarkdown>
                ) : (
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>N/A</span>
                )}
              </div>
            </div>
            
            {/* Summary - always show, even if N/A */}
            <div className={`pt-2 border-t ${
              theme === 'dark' ? 'border-gray-600' : 'border-slate-200'
            }`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`font-semibold text-base shrink-0 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-slate-700'
                }`}>Summary:</span>
              </div>
              <div className={`text-base leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
              }`}>
                {paper.summary && paper.summary !== 'N/A' ? (
                  renderMarkdownLinks(cleanMarkdown(paper.summary))
                ) : (
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>N/A</span>
                )}
              </div>
            </div>
            
            {/* Hyperlink - always at the end */}
            <div className={`pt-2 border-t ${
              theme === 'dark' ? 'border-gray-600' : 'border-slate-200'
            }`}>
              {paper.link ? (
                <a
                  href={paper.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 transition-colors text-base font-medium ${
                    theme === 'dark'
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <ExternalLink className="w-5 h-5" />
                  View Full Paper
                  <span className={`text-xs ml-1 ${
                    theme === 'dark' ? 'text-blue-500' : 'text-blue-500'
                  }`}>({paper.link.length > 60 ? paper.link.substring(0, 60) + '...' : paper.link})</span>
                </a>
              ) : (
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}>N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
