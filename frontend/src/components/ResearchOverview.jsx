import React, { useState, useMemo } from 'react';
import { FileText, Beaker, BookOpen, ExternalLink, CheckCircle2, Loader2, AlertCircle, FlaskConical, X } from 'lucide-react';
import { useProteinStore } from '../store/proteinStore';
import { useThemeStore } from '../store/themeStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { PaperCard } from './PaperCard';
import { ReferenceCard } from './ReferenceCard';
import RainbowSpinner from './ui/RainbowSpinner';
import { cleanMarkdown, renderMarkdownLinks } from '../utils/markdownParser.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResearchOverview = () => {
  const { 
    researchQuery, 
    researchResults, 
    isResearching, 
    researchError,
    setResearchError
  } = useProteinStore();
  const { theme } = useThemeStore();

  // Parse papers - use structured_papers if available, otherwise parse from text
  const parsedPapers = useMemo(() => {
    // First try to use structured_papers from backend
    if (researchResults?.structured_papers && researchResults.structured_papers.length > 0) {
      return researchResults.structured_papers.map((p, idx) => ({
        title: p.title || `Paper ${idx + 1}`,
        authors: p.authors || '',
        journal: p.journal || 'Not specified',
        year: p.year || new Date().getFullYear().toString(),
        doi: p.doi || 'Not available',
        link: p.link || '',
        description: p.description || p.title || '',
        citationNumber: p.citationNumber || (idx + 1).toString(),
        isRecent: p.year && parseInt(p.year) >= new Date().getFullYear() - 2
      }));
    }
    
    // Fallback: parse from text
    if (!researchResults?.papers || researchResults.papers === 'No papers section found') {
      return [];
    }

    const papers = [];
    const lines = researchResults.papers.split('\n');
    let currentPaper = null;
    let citationNum = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Look for citation numbers like [1], [2], etc.
      const citationMatch = trimmed.match(/\[(\d+)\]/);
      if (citationMatch) {
        citationNum = citationMatch[1];
      }

      // Look for titles (usually lines that are longer and don't start with special chars)
      if (trimmed.length > 20 && !trimmed.startsWith('-') && !trimmed.startsWith('•') && 
          !trimmed.match(/^(Authors?|Journal|Year|DOI|PMID|Link):/i)) {
        if (currentPaper && currentPaper.title) {
          papers.push(currentPaper);
        }
        currentPaper = {
          title: trimmed.replace(/^\[?\d+\]?\s*/, '').trim(),
          citationNumber: citationNum || null,
          authors: '',
          journal: '',
          year: '',
          doi: '',
          link: '',
          description: ''
        };
        citationNum = null;
      } else if (currentPaper) {
        // Extract authors
        const authorsMatch = trimmed.match(/^(Authors?|Author):\s*(.+)/i);
        if (authorsMatch) {
          currentPaper.authors = authorsMatch[2].trim();
        }
        // Extract journal
        const journalMatch = trimmed.match(/^(Journal|Journal Name):\s*(.+)/i);
        if (journalMatch) {
          currentPaper.journal = journalMatch[2].trim();
        }
        // Extract year
        const yearMatch = trimmed.match(/^(Year|Published):\s*(\d{4})/i);
        if (yearMatch) {
          currentPaper.year = yearMatch[2];
        }
        // Extract DOI/PMID
        const doiMatch = trimmed.match(/^(DOI|PMID):\s*(.+)/i);
        if (doiMatch) {
          currentPaper.doi = doiMatch[2].trim();
        }
        // Extract link/URL
        const urlMatch = trimmed.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch && !currentPaper.link) {
          currentPaper.link = urlMatch[1];
        }
        // Extract description (lines that don't match other patterns)
        if (!authorsMatch && !journalMatch && !yearMatch && !doiMatch && !urlMatch && 
            trimmed.length > 10 && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          if (!currentPaper.description) {
            currentPaper.description = trimmed;
          }
        }
      }
    }

    if (currentPaper && currentPaper.title) {
      papers.push(currentPaper);
    }

    // If no papers found, try to extract from citations
    if (papers.length === 0 && researchResults.citations) {
      return researchResults.citations
        .filter(cit => cit.url && (cit.url.includes('pubmed') || cit.url.includes('doi') || cit.url.includes('.pdf') || cit.url.includes('arxiv')))
        .map((cit, idx) => ({
          title: cit.title || `Paper ${idx + 1}`,
          authors: '',
          journal: '',
          year: new Date().getFullYear().toString(),
          doi: cit.url.includes('doi') ? cit.url : '',
          link: cit.url,
          description: cit.title,
          citationNumber: cit.number,
          isRecent: false
        }));
    }

    return papers.map((p, idx) => ({
      ...p,
      journal: p.journal || 'Not specified',
      year: p.year || new Date().getFullYear().toString(),
      doi: p.doi || 'Not available',
      link: p.link || '',
      description: p.description || p.title,
      citationNumber: p.citationNumber || (idx + 1).toString(),
      isRecent: p.year && parseInt(p.year) >= new Date().getFullYear() - 2
    }));
  }, [researchResults]);

  // Parse references - use structured_references if available, otherwise parse from text
  const parsedReferences = useMemo(() => {
    // First try to use structured_references from backend
    if (researchResults?.structured_references && researchResults.structured_references.length > 0) {
      return researchResults.structured_references.map((ref, idx) => ({
        name: ref.name || `Reference ${idx + 1}`,
        url: ref.url || '',
        description: ref.description || `Provides information about ${ref.name || 'this resource'}`,
        citationNumber: ref.citationNumber || (idx + 1).toString()
      }));
    }
    
    // Fallback: parse from text
    if (!researchResults?.research_references || researchResults.research_references === 'No research references section found') {
      return [];
    }

    const references = [];
    const lines = researchResults.research_references.split('\n');
    let currentRef = null;
    let citationNum = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const citationMatch = trimmed.match(/\[(\d+)\]/);
      if (citationMatch) {
        citationNum = citationMatch[1];
      }

      // Look for database names (UniProt, RCSB, NCBI, etc.)
      const dbMatch = trimmed.match(/^(UniProt|RCSB|NCBI|PDB|PubMed|Gene|Ensembl|KEGG|Reactome|STRING|IntAct)/i);
      if (dbMatch || (trimmed.length > 10 && !trimmed.startsWith('-') && !trimmed.startsWith('•'))) {
        if (currentRef && currentRef.name) {
          references.push(currentRef);
        }
        currentRef = {
          name: trimmed.replace(/^\[?\d+\]?\s*/, '').split(' - ')[0].split(':')[0].trim(),
          url: '',
          description: '',
          citationNumber: citationNum || null
        };
        citationNum = null;
      } else if (currentRef) {
        const urlMatch = trimmed.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) {
          currentRef.url = urlMatch[1];
        }
        if (trimmed.length > 10 && !urlMatch && !trimmed.match(/^(URL|Link|Description):/i)) {
          currentRef.description = (currentRef.description + ' ' + trimmed).trim();
        }
      }
    }

    if (currentRef && currentRef.name) {
      references.push(currentRef);
    }

    // If no references found, try to extract from citations
    if (references.length === 0 && researchResults.citations) {
      return researchResults.citations
        .filter(cit => cit.url && (cit.url.includes('uniprot') || cit.url.includes('rcsb') || cit.url.includes('ncbi') || cit.url.includes('ensembl')))
        .map((cit, idx) => ({
          name: cit.title || `Database ${idx + 1}`,
          url: cit.url,
          description: cit.title || 'Database resource',
          citationNumber: cit.number
        }));
    }

    return references.map((ref, idx) => ({
      ...ref,
      description: ref.description || `Provides information about ${ref.name}`,
      citationNumber: ref.citationNumber || (idx + 1).toString()
    }));
  }, [researchResults]);

  // Extract key findings, research status, and applications from summary
  const extractSummaryData = useMemo(() => {
    if (!researchResults?.summary || researchResults.summary === 'No summary section found') {
      return {
        keyFindings: [],
        researchStatus: [],
        applications: []
      };
    }

    const summary = researchResults.summary;
    const keyFindings = [];
    const researchStatus = [];
    const applications = [];

    // Extract bullet points or key phrases
    const lines = summary.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
        const content = trimmed.replace(/^[•\-\d+\.]\s*/, '').trim();
        if (content.length > 10) {
          if (content.toLowerCase().includes('pathway') || content.toLowerCase().includes('function') || 
              content.toLowerCase().includes('mechanism') || content.toLowerCase().includes('role')) {
            keyFindings.push(content);
          } else if (content.toLowerCase().includes('paper') || content.toLowerCase().includes('study') || 
                     content.toLowerCase().includes('research') || content.toLowerCase().includes('database')) {
            researchStatus.push(content);
          } else if (content.toLowerCase().includes('application') || content.toLowerCase().includes('therapeutic') || 
                     content.toLowerCase().includes('drug') || content.toLowerCase().includes('clinical')) {
            applications.push(content);
          }
        }
      }
    }

    // Fallback: extract sentences
    if (keyFindings.length === 0) {
      const sentences = summary.split(/[.!?]/).filter(s => s.trim().length > 20);
      keyFindings.push(...sentences.slice(0, 4).map(s => s.trim()));
    }

    return {
      keyFindings: keyFindings.slice(0, 4),
      researchStatus: researchStatus.slice(0, 4),
      applications: applications.slice(0, 4)
    };
  }, [researchResults]);

  // Get current date for badge
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className={`min-h-screen p-6 transition-colors ${
      theme === 'dark'
        ? 'bg-gray-900'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {isResearching && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RainbowSpinner size={80} className="mb-6" />
            <h3 className={`text-2xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Researching Protein...</h3>
            <p className={`text-base ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Gathering comprehensive information from academic databases and web sources</p>
            {researchQuery && (
              <p className={`text-base mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                Researching: <span className="font-mono font-semibold">{researchQuery}</span>
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {researchError && (
          <div className={`border rounded-lg p-4 flex items-center gap-3 transition-colors ${
            theme === 'dark'
              ? 'bg-red-900/20 border-red-800/50'
              : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`flex-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>{researchError}</span>
            <button
              onClick={() => setResearchError(null)}
              className={`flex-shrink-0 p-1 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-red-800/50 text-red-400 hover:text-red-300'
                  : 'hover:bg-red-100 text-red-600 hover:text-red-800'
              }`}
              aria-label="Dismiss error"
              title="Dismiss error message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {!researchResults && !isResearching && !researchError && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <BookOpen className={`w-16 h-16 mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} />
            <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Start Research</h3>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>Use the search bar at the top to enter a UniProt protein ID</p>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Example: P01308 (Human Insulin)</p>
          </div>
        )}

        {/* Results Section */}
        {researchResults && !isResearching && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-3xl font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Research Overview Dashboard</h1>
              </div>
              <p className={`ml-14 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Comprehensive analysis of Protein {researchResults.protein_id}</p>
              <div className="flex gap-2 mt-4 ml-14">
                <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white'}>Protein Research</Badge>
                <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white'}>{researchResults.protein_id}</Badge>
                <Badge variant="outline" className={theme === 'dark' ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white'}>Updated: {currentDate}</Badge>
              </div>
            </div>

            {/* Summary Section - Always Visible */}
            <Card className={`shadow-lg mb-6 transition-colors ${
              theme === 'dark'
                ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900'
                : 'border-slate-200 bg-gradient-to-br from-white to-blue-50'
            }`}>
              <CardHeader>
                <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Comprehensive Summary</CardTitle>
                <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Overview of findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`backdrop-blur rounded-lg p-6 border transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800/80 border-gray-700'
                    : 'bg-white/80 border-slate-200'
                }`}>
                  <div className={`leading-relaxed mb-6 text-base prose prose-sm max-w-none ${
                    theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-slate-700'
                  }`}>
                    {researchResults.summary && researchResults.summary !== 'No summary section found' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {researchResults.summary.substring(0, 500) + (researchResults.summary.length > 500 ? '...' : '')}
                      </ReactMarkdown>
                    ) : (
                      <p>Summary information will be displayed here once research is complete.</p>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className={`border rounded-lg p-4 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-white border-slate-200'
                    }`}>
                      <h3 className={`mb-2 font-medium text-base ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>Key Findings</h3>
                      <div className={`space-y-1 text-base prose prose-sm max-w-none ${
                        theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-slate-600'
                      }`}>
                        {extractSummaryData.keyFindings.length > 0 ? (
                          extractSummaryData.keyFindings.map((finding, idx) => {
                            const content = finding.substring(0, 60) + (finding.length > 60 ? '...' : '');
                            return (
                              <div key={idx}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {`• ${content}`}
                                </ReactMarkdown>
                              </div>
                            );
                          })
                        ) : (
                          <p>• Analysis in progress</p>
                        )}
                      </div>
                    </div>
                    <div className={`border rounded-lg p-4 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-white border-slate-200'
                    }`}>
                      <h3 className={`mb-2 font-medium text-base ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>Research Status</h3>
                      <ul className={`space-y-1 text-base ${
                        theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                      }`}>
                        <li>• {parsedPapers.length} key papers identified</li>
                        <li>• {parsedReferences.length} major database entries</li>
                        <li>• {researchResults.citations?.length || 0} total citations</li>
                        <li>• Active research area</li>
                      </ul>
                    </div>
                    <div className={`border rounded-lg p-4 transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600'
                        : 'bg-white border-slate-200'
                    }`}>
                      <h3 className={`mb-2 font-medium text-base ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>Applications</h3>
                      <div className={`space-y-1 text-base prose prose-sm max-w-none ${
                        theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-slate-600'
                      }`}>
                        {extractSummaryData.applications.length > 0 ? (
                          extractSummaryData.applications.map((app, idx) => {
                            const content = app.substring(0, 60) + (app.length > 60 ? '...' : '');
                            return (
                              <div key={idx}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {`• ${content}`}
                                </ReactMarkdown>
                              </div>
                            );
                          })
                        ) : (
                          <>
                            <p>• {researchResults.use_cases && researchResults.use_cases !== 'No use cases section found' ? 'Use cases identified' : 'Further research needed'}</p>
                            <p>• {researchResults.drug_development && researchResults.drug_development !== 'No drug development section found' ? 'Therapeutic potential' : 'No drugs identified yet'}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="papers" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 mb-6 h-auto p-1 shadow-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white'
              }`}>
                <TabsTrigger value="papers" theme={theme} className="flex items-center gap-2 py-3 text-base">
                  <FileText className="w-5 h-5" />
                  Academic Papers
                </TabsTrigger>
                <TabsTrigger value="applications" theme={theme} className="flex items-center gap-2 py-3 text-base">
                  <Beaker className="w-5 h-5" />
                  Applications & Therapeutics
                </TabsTrigger>
                <TabsTrigger value="references" theme={theme} className="flex items-center gap-2 py-3 text-base">
                  <BookOpen className="w-5 h-5" />
                  References & Citations
                </TabsTrigger>
              </TabsList>

              {/* Academic Papers Tab */}
              <TabsContent value="papers">
                <Card className={`shadow-lg transition-colors ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200'
                }`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      Academic Papers & Publications
                    </CardTitle>
                    <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Key research papers related to Protein {researchResults.protein_id}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parsedPapers.length > 0 ? (
                      parsedPapers.map((paper, index) => (
                        <PaperCard key={index} paper={paper} number={index + 1} theme={theme} />
                      ))
                    ) : (
                      <div className={`border rounded-lg p-6 text-center transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <FileText className={`w-12 h-12 mx-auto mb-3 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
                        }`} />
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>No papers found in the research results.</p>
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Papers will appear here once identified.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications & Therapeutics Tab */}
              <TabsContent value="applications">
                <div className="space-y-6">
                  <Card className={`shadow-lg transition-colors ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200'
                  }`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                        <Beaker className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                        Use Cases & Applications
                      </CardTitle>
                      <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Clinical and industrial applications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {researchResults.use_cases && researchResults.use_cases !== 'No use cases section found' ? (
                        <>
                          <div className={`border rounded-lg p-4 transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 border-gray-600'
                              : 'bg-white border-slate-200'
                          }`}>
                            <div className={`prose prose-sm max-w-none ${
                              theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-slate-700'
                            }`}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {researchResults.use_cases}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className={`border rounded-lg p-4 transition-colors ${
                          theme === 'dark'
                            ? 'bg-amber-900/20 border-amber-800/50'
                            : 'bg-amber-50 border-amber-200'
                        }`}>
                          <p className={theme === 'dark' ? 'text-amber-200' : 'text-amber-900'}>
                            Based on initial searches, no clear specific use cases, clinical or industrial applications are immediately apparent. Further targeted searches would be needed.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={`shadow-lg transition-colors ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200'
                  }`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                        <FlaskConical className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                        Drug Development & Therapeutics
                      </CardTitle>
                      <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Therapeutic applications and drug discovery</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {researchResults.drug_development && researchResults.drug_development !== 'No drug development section found' ? (
                        <div className={`border rounded-lg p-4 transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-white border-slate-200'
                        }`}>
                          <div className="prose prose-sm max-w-none">
                            <div className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${
                              theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              {renderMarkdownLinks(cleanMarkdown(researchResults.drug_development))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`border rounded-lg p-6 text-center transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <FlaskConical className={`w-12 h-12 mx-auto mb-3 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-slate-400'
                          }`} />
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>
                            No specific drug development information was found in the search results.
                          </p>
                          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                            Further research may be required to identify therapeutic applications.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* References & Citations Tab */}
              <TabsContent value="references">
                <Card className={`shadow-lg transition-colors ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200'
                }`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      <BookOpen className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      References & Citations
                    </CardTitle>
                    <CardDescription className={theme === 'dark' ? 'text-gray-400' : ''}>Essential databases, resources, and all cited sources</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className={`mb-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Database Resources</h3>
                      <div className="space-y-4">
                        {parsedReferences.length > 0 ? (
                          parsedReferences.map((ref, index) => (
                            <ReferenceCard key={index} reference={ref} number={index + 1} theme={theme} />
                          ))
                        ) : (
                          <div className={`border rounded-lg p-4 text-center transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 border-gray-600'
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>No database resources found.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className={theme === 'dark' ? 'bg-gray-700' : ''} />

                    <div>
                      <h3 className={`mb-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>All Citations</h3>
                      <div className={`border rounded-lg p-4 transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        {researchResults.citations && researchResults.citations.length > 0 ? (
                          <ol className="space-y-3 text-sm">
                            {researchResults.citations.map((citation) => (
                              <li key={citation.number} className="flex gap-3">
                                <span className={`shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>[{citation.number}]</span>
                                <div className="flex-1">
                                  <div className={`prose prose-sm max-w-none ${
                                    theme === 'dark' ? 'text-gray-200 prose-invert' : 'text-slate-700'
                                  }`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {citation.title}
                                    </ReactMarkdown>
                                  </div>
                                  {citation.url && (
                                    <a
                                      href={citation.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 transition-colors text-xs break-all mt-1 ${
                                        theme === 'dark'
                                          ? 'text-blue-400 hover:text-blue-300'
                                          : 'text-blue-600 hover:text-blue-800'
                                      }`}
                                    >
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                      {citation.url}
                                    </a>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>No citations available.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default ResearchOverview;
