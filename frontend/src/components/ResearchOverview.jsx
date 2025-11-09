import React from 'react';
import { BookOpen, FileText, FlaskConical, Sparkles, AlertCircle, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { useProteinStore } from '../store/proteinStore';
import './ResearchOverview.css';

const ResearchOverview = () => {
  const { 
    researchQuery, 
    researchResults, 
    isResearching, 
    researchError
  } = useProteinStore();

  const formatCitations = (citations) => {
    if (!citations || citations.length === 0) return null;
    return (
      <div className="citations-list">
        {citations.map((citation, idx) => (
          <div key={idx} className="citation-item">
            <span className="citation-number">[{citation.number}]</span>
            <span className="citation-title">{citation.title}</span>
            {citation.url && (
              <a href={citation.url} target="_blank" rel="noopener noreferrer" className="citation-link">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const extractSectionCitations = (sectionText, allCitations) => {
    if (!sectionText || !allCitations) return [];
    // Extract citation numbers mentioned in the section text
    const citationNumbers = new Set();
    const lines = sectionText.split('\n');
    
    for (const line of lines) {
      // Match patterns like [1], [2], etc.
      const matches = line.match(/\[(\d+)\]/g);
      if (matches) {
        matches.forEach(match => {
          const num = match.replace(/[\[\]]/g, '');
          citationNumbers.add(num);
        });
      }
    }
    
    // Return citations that are referenced in this section
    return allCitations.filter(citation => citationNumbers.has(citation.number));
  };

  return (
    <div className="research-overview">
      <div className="research-header">
        <div className="header-content">
          <BookOpen className="w-6 h-6 text-primary-600" />
          <div>
            <h2>Research Overview</h2>
            <p className="text-sm text-gray-600">Comprehensive AI-powered research on proteins using academic papers and web sources</p>
          </div>
        </div>
      </div>

      <div className="research-container">
        {/* Loading State */}
        {isResearching && (
          <div className="research-loading">
            <div className="loading-content">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <div className="loading-text">
                <h3>Researching Protein...</h3>
                <p>Gathering comprehensive information from academic databases and web sources</p>
                {researchQuery && (
                  <p className="text-sm text-gray-500 mt-2">
                    Researching: <span className="font-mono font-semibold">{researchQuery}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="loading-progress-bar">
              <div className="loading-progress-fill"></div>
            </div>
            <div className="loading-steps">
              <div className="loading-step">
                <div className="step-dot active"></div>
                <span>Searching academic databases...</span>
              </div>
              <div className="loading-step">
                <div className="step-dot"></div>
                <span>Analyzing research papers...</span>
              </div>
              <div className="loading-step">
                <div className="step-dot"></div>
                <span>Compiling results...</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Section - Only show when not researching and no results */}
        {!isResearching && !researchResults && (
          <div className="research-info-section">
            <div className="info-card">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <div>
                <h3>Use the Search Bar Above</h3>
                <p>Enter a UniProt protein ID (e.g., P01308) in the main search bar to start comprehensive AI-powered research.</p>
                {researchQuery && (
                  <p className="text-sm text-gray-600 mt-2">
                    Current search: <span className="font-mono font-semibold">{researchQuery}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {researchResults && (
          <div className="research-results">
            <div className="results-header">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3>Research Results for {researchResults.protein_id}</h3>
            </div>

            {/* Academic Papers */}
            {researchResults.papers && researchResults.papers !== 'No papers section found' && (
              <div className="results-section">
                <h4>
                  <BookOpen className="w-4 h-4" />
                  Academic Papers & Publications
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.papers, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.papers}</pre>
                </div>
              </div>
            )}

            {/* Use Cases */}
            {researchResults.use_cases && researchResults.use_cases !== 'No use cases section found' && (
              <div className="results-section">
                <h4>
                  <FlaskConical className="w-4 h-4" />
                  Use Cases & Applications
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.use_cases, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.use_cases}</pre>
                </div>
              </div>
            )}

            {/* Drug Development */}
            {researchResults.drug_development && researchResults.drug_development !== 'No drug development section found' && (
              <div className="results-section">
                <h4>
                  <FlaskConical className="w-4 h-4" />
                  Drug Development & Therapeutics
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.drug_development, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.drug_development}</pre>
                </div>
              </div>
            )}

            {/* Research References */}
            {researchResults.research_references && researchResults.research_references !== 'No research references section found' && (
              <div className="results-section">
                <h4>
                  <FileText className="w-4 h-4" />
                  Research References & Citations
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.research_references, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.research_references}</pre>
                </div>
              </div>
            )}

            {/* Novel Research */}
            {researchResults.novel_research && researchResults.novel_research !== 'No novel research section found' && (
              <div className="results-section">
                <h4>
                  <Sparkles className="w-4 h-4" />
                  Novel Research (Recent)
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.novel_research, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.novel_research}</pre>
                </div>
              </div>
            )}

            {/* Summary */}
            {researchResults.summary && researchResults.summary !== 'No summary section found' && (
              <div className="results-section summary-section">
                <h4>
                  <Sparkles className="w-4 h-4" />
                  AI Summary
                </h4>
                {(() => {
                  const sectionCitations = extractSectionCitations(researchResults.summary, researchResults.citations);
                  return sectionCitations.length > 0 && (
                    <div className="section-citations">
                      <h5>References:</h5>
                      {formatCitations(sectionCitations)}
                    </div>
                  );
                })()}
                <div className="section-content">
                  <pre className="research-text">{researchResults.summary}</pre>
                </div>
              </div>
            )}

            {/* All Citations at the end (for reference) */}
            {researchResults.citations && researchResults.citations.length > 0 && (
              <div className="results-section all-citations-section">
                <h4>
                  <FileText className="w-4 h-4" />
                  All Citations & Sources
                </h4>
                {formatCitations(researchResults.citations)}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {researchError && (
          <div className="error-message">
            <AlertCircle className="w-5 h-5" />
            <span>{researchError}</span>
          </div>
        )}

        {/* Empty State */}
        {!researchResults && !isResearching && !researchError && (
          <div className="empty-state">
            <BookOpen className="w-12 h-12 text-gray-400" />
            <h3>Start Research</h3>
            <p>Use the search bar at the top to enter a UniProt protein ID</p>
            <p className="text-sm text-gray-500 mt-2">Example: P01308 (Human Insulin)</p>
          </div>
        )}

        {/* Loading State */}
        {isResearching && (
          <div className="empty-state">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <h3>Researching...</h3>
            <p>Gathering comprehensive information about {researchQuery}</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchOverview;

