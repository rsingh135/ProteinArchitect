"""
Agentic Research Service using Dedalus Labs
Comprehensive protein research using AI agents with web search capabilities
"""

import asyncio
import logging
from typing import Dict, Optional, List
from dotenv import load_dotenv
import os
import httpx
import xml.etree.ElementTree as ET
from urllib.parse import quote

# HTTPException is only used in error handling, import it conditionally
try:
    from fastapi import HTTPException
except ImportError:
    # Fallback if not in FastAPI context
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)

try:
    from dedalus_labs import AsyncDedalus, DedalusRunner
    from dedalus_labs.utils.stream import stream_async
    DEDALUS_AVAILABLE = True
    logging.info("dedalus-labs imported successfully")
except ImportError as e:
    DEDALUS_AVAILABLE = False
    logging.error(f"dedalus-labs import failed: {e}")
    import traceback
    logging.error(f"Full traceback: {traceback.format_exc()}")
    logging.warning("Install with: pip install dedalus-labs")
    logging.warning("If you just installed it, restart the backend server.")

load_dotenv()

logger = logging.getLogger(__name__)

# Supported model constants
SUPPORTED_MODELS = {
    "gemini": "google/gemini-2.0-flash-lite",
    "gemini-pro": "google/gemini-2.0-flash-lite",
    "gemini-1.5-pro": "google/gemini-2.0-flash-lite",
    "gemini-1.5-flash": "google/gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite",
}


class AgenticResearchService:
    """
    Service for comprehensive protein research using Dedalus Labs AI agents.
    
    Uses multiple MCP servers to gather:
    - Academic papers and publications
    - Use cases and applications
    - Drug development references
    - Novel research findings
    - Citations with hyperlinks
    """
    
    def __init__(self):
        """Initialize the research service."""
        if not DEDALUS_AVAILABLE:
            raise ImportError(
                "dedalus-labs package required. Install with: pip install dedalus-labs"
            )
        
        # Dedalus Labs uses DEDALUS_API_KEY (not GEMINI_API_KEY directly)
        # Dedalus Labs handles model provider authentication internally
        # When you specify "google/gemini-1.5-pro", Dedalus uses its own Google API key
        api_key = os.getenv("DEDALUS_API_KEY")
        if not api_key:
            raise ValueError(
                "DEDALUS_API_KEY environment variable required. "
                "Get your API key from https://dedaluslabs.ai. "
                "Note: Dedalus Labs handles Google/OpenAI API keys internally."
            )
        
        # PubMed/NCBI API key (optional but recommended for higher rate limits)
        # Get your API key from: https://www.ncbi.nlm.nih.gov/account/settings/
        self.ncbi_api_key = os.getenv("NCBI_API_KEY")
        self.ncbi_tool = os.getenv("NCBI_TOOL", "GenLab-Research")
        self.ncbi_email = os.getenv("NCBI_EMAIL", "")
        
        if self.ncbi_api_key:
            logger.info("NCBI API key found - using enhanced rate limits for PubMed searches")
        else:
            logger.warning("NCBI_API_KEY not set - PubMed searches limited to 3 requests/second. Get key from: https://www.ncbi.nlm.nih.gov/account/settings/")
        
        # Initialize client with longer timeout for comprehensive research
        # Increased timeouts to allow for more thorough searching and detailed responses
        # Set timeout to 8 minutes (480 seconds) for read operations to allow extensive research
        timeout = httpx.Timeout(
            connect=30.0,  # 30 seconds to establish connection
            read=480.0,    # 8 minutes to read response (increased for comprehensive research)
            write=30.0,    # 30 seconds to write request
            pool=30.0      # 30 seconds to get connection from pool
        )
        
        # Create httpx client with longer timeout
        http_client = httpx.AsyncClient(timeout=timeout)
        
        # Create separate client for PubMed API (with longer timeout for thoroughness)
        pubmed_timeout = httpx.Timeout(
            connect=15.0,
            read=60.0,  # Increased for more comprehensive PubMed searches
            write=15.0,
            pool=15.0
        )
        self.pubmed_client = httpx.AsyncClient(timeout=pubmed_timeout)
        
        # Initialize Dedalus client with custom HTTP client
        # AsyncDedalus() automatically uses DEDALUS_API_KEY from environment
        self.client = AsyncDedalus(http_client=http_client)
        self.runner = DedalusRunner(self.client)
        logger.info("AgenticResearchService initialized (using gemini-1.5-flash for quick research, 5min timeout, 10 sources max)")
    
    async def list_available_models(self) -> List[str]:
        """
        List available Gemini models - using gemini-1.5-flash for speed.
        """
        try:
            # Using gemini-1.5-flash for quick research
            gemini_models_to_try = [
                "google/gemini-1.5-flash",
                "gemini-1.5-flash",
            ]
            
            logger.info(f"Gemini models available: {gemini_models_to_try}")
            return gemini_models_to_try
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    def _resolve_model(self, model: str) -> str:
        """
        Resolve model alias to full model string.
        
        Args:
            model: Model string or alias
        
        Returns:
            Full model string (e.g., "google/gemini-2.0-flash-lite")
        """
        # Check if it's already a full model string (contains /)
        if "/" in model:
            return model
        
        # Check if it's a known alias
        model_lower = model.lower()
        if model_lower in SUPPORTED_MODELS:
            return SUPPORTED_MODELS[model_lower]
        
        # If not found, return as-is (might be a valid model string we don't know about)
        logger.warning(f"Unknown model alias '{model}', using as-is. Known aliases: {list(SUPPORTED_MODELS.keys())}")
        return model
    
    def _format_model_for_dedalus(self, model: str) -> str:
        """
        Convert model name to the format expected by Dedalus Labs.
        
        Based on Dedalus Labs documentation, models should be specified with
        the provider prefix: "google/gemini-1.5-flash" or "openai/gpt-4.1"
        
        Dedalus Labs handles the conversion to the underlying API format internally.
        
        Args:
            model: Model string (e.g., "google/gemini-1.5-flash")
        
        Returns:
            Model name in Dedalus Labs format (keep provider prefix)
        """
        # Dedalus Labs expects the full provider/model format
        # Return as-is - Dedalus Labs will handle the conversion
        return model
    
    async def _fetch_protein_info(self, protein_id: str) -> Dict[str, str]:
        """
        Fetch protein information from UniProt to identify what protein we're researching.
        
        Args:
            protein_id: UniProt protein ID (e.g., "P01308")
            
        Returns:
            Dictionary with protein information: name, function, organism, gene, etc.
        """
        try:
            import httpx
            # Fetch from UniProt REST API
            uniprot_url = f"https://rest.uniprot.org/uniprotkb/{protein_id}.json"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(uniprot_url)
                response.raise_for_status()
                data = response.json()
                
                # Extract key information
                protein_name = data.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", protein_id)
                if not protein_name or protein_name == protein_id:
                    # Try alternative name
                    alt_names = data.get("proteinDescription", {}).get("alternativeNames", [])
                    if alt_names:
                        protein_name = alt_names[0].get("fullName", {}).get("value", protein_id)
                
                # Get function/description
                comments = data.get("comments", [])
                function_text = ""
                for comment in comments:
                    if comment.get("commentType") == "FUNCTION":
                        function_text = comment.get("texts", [{}])[0].get("value", "")
                        break
                
                # Get organism
                organism = data.get("organism", {}).get("scientificName", "Unknown")
                
                # Get gene name
                genes = data.get("genes", [])
                gene_name = ""
                if genes:
                    gene_name = genes[0].get("geneName", {}).get("value", "")
                
                # Get keywords
                keywords = [kw.get("value", "") for kw in data.get("keywords", [])]
                
                logger.info(f"Identified protein {protein_id}: {protein_name} ({organism})")
                
                return {
                    "protein_id": protein_id,
                    "name": protein_name,
                    "function": function_text,
                    "organism": organism,
                    "gene": gene_name,
                    "keywords": ", ".join(keywords[:5]) if keywords else ""
                }
        except Exception as e:
            logger.warning(f"Could not fetch protein info from UniProt for {protein_id}: {e}")
            # Return minimal info
            return {
                "protein_id": protein_id,
                "name": protein_id,
                "function": "",
                "organism": "Unknown",
                "gene": "",
                "keywords": ""
            }
    
    async def research_protein(
        self,
        protein_id: str,
        model: str = "google/gemini-2.0-flash-lite",
        include_novel: bool = True,
        months_recent: int = 6
    ) -> Dict[str, any]:
        """
        Conduct comprehensive research on a protein using AI agents with PubMed integration (up to 15 sources, optimized for speed).

        Args:
            protein_id: UniProt protein ID (e.g., "P01308" for insulin)
            model: Model to use for research. Default: "google/gemini-2.0-flash-lite"
            include_novel: Whether to include novel/recent research section
            months_recent: Number of months to consider for "novel" research

        Returns:
            Dictionary with structured research results including:
            - citations: List of citations with hyperlinks (up to 15 sources)
            - papers: Academic papers section
            - use_cases: Common use cases section
            - drug_development: Drug development references
            - novel_research: Novel/recent research (if include_novel=True)
            - summary: AI-generated summary
            - raw_output: Full agent response
        """
        # Resolve model alias if needed
        model = self._resolve_model(model)
        # Convert to Dedalus Labs format (remove provider prefix)
        dedalus_model = self._format_model_for_dedalus(model)
        logger.info(f"Starting comprehensive research for protein: {protein_id} using model: {dedalus_model} (original: {model})")
        
        # FIRST: Identify the protein by fetching its information from UniProt
        logger.info(f"Fetching protein information for {protein_id} from UniProt...")
        protein_info = await self._fetch_protein_info(protein_id)
        logger.info(f"Identified protein: {protein_info['name']} ({protein_info['organism']})")
        
        # Search PubMed with longer timeout for comprehensive results
        # Run it in parallel with prompt building preparation
        # Pass protein_info to improve PubMed search
        pubmed_task = asyncio.create_task(
            asyncio.wait_for(
                self._search_pubmed(protein_id, include_novel, months_recent, protein_info),
                timeout=15.0  # 15 second timeout for PubMed search (increased for thoroughness)
            )
        )
        
        # Start building prompt while PubMed searches (we'll add results if available)
        # Construct comprehensive research prompt with protein information
        research_prompt = self._build_research_prompt(
            protein_id, include_novel, months_recent, None, protein_info  # Pass protein info
        )
        
        # Try to get PubMed results (with timeout handling)
        pubmed_results = []
        try:
            pubmed_results = await pubmed_task
            if pubmed_results:
                # Rebuild prompt with PubMed results if we got them
                research_prompt = self._build_research_prompt(
                    protein_id, include_novel, months_recent, pubmed_results, protein_info
                )
                logger.info(f"Included {len(pubmed_results)} PubMed results in research")
        except asyncio.TimeoutError:
            logger.warning("PubMed search timed out - continuing without PubMed results for speed")
        except Exception as e:
            logger.warning(f"PubMed search failed: {e} - continuing without PubMed results for speed")
        
        # Use exa-search-mcp as the default (proven to work reliably)
        # This is faster and more reliable than trying multiple servers
        mcp_servers = ["windsor/exa-search-mcp"]
        
        logger.info(f"Starting research with MCP server: {mcp_servers[0]}")
        try:
            # Run the research agent with exa-search MCP server
            # Based on Dedalus Labs docs: runner.run() accepts input, model, and mcp_servers
            result = await self.runner.run(
                input=research_prompt,
                model=dedalus_model,
                mcp_servers=mcp_servers
            )
            logger.info(f"Research succeeded with MCP server: {mcp_servers[0]}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Research failed with MCP server {mcp_servers[0]}: {error_msg}")
            # Re-raise the error - let the outer exception handler deal with it
            raise
        
        # Access final_output from result (per Dedalus Labs Runner API)
        try:
            if not hasattr(result, 'final_output'):
                logger.warning("Result object missing 'final_output' attribute, trying alternative access")
                # Fallback: result might be a string or have different structure
                output = str(result) if not isinstance(result, str) else result
            else:
                output = result.final_output
            
            # Parse and structure the results
            structured_results = self._parse_research_results(
                output,
                protein_id,
                include_novel
            )
            
            logger.info(f"Research completed for protein: {protein_id}")
            return structured_results
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error during protein research: {error_msg}")
            
            # Check if it's a Gemini model error - provide helpful message
            is_gemini_model = any(gemini in model.lower() for gemini in ["gemini", "google/gemini"])
            is_model_error = any(pattern in error_msg.lower() for pattern in [
                "not found", "404", "not supported", "not_found", "models/gemini"
            ])
            
            if is_gemini_model and is_model_error:
                # Try alternative Gemini model names that might work with Dedalus Labs
                alternative_gemini_models = [
                    "google/gemini-2.0-flash-lite",
                    "google/gemini-2.0-flash-exp",
                    "google/gemini-2.0-flash",
                    "google/gemini-pro",
                    "google/gemini-1.0-pro",
                ]
                
                for alt_model in alternative_gemini_models:
                    # Keep full format - Dedalus Labs expects "google/gemini-X.X-..."
                    logger.info(f"Model {model} not available, trying alternative Gemini model: {alt_model}")
                    try:
                        result = await self.runner.run(
                            input=research_prompt,
                            model=alt_model,
                            mcp_servers=[
                                "windsor/exa-search-mcp",
                                "windsor/brave-search-mcp"
                            ]
                        )
                        
                        if not hasattr(result, 'final_output'):
                            output = str(result) if not isinstance(result, str) else result
                        else:
                            output = result.final_output
                        
                        structured_results = self._parse_research_results(
                            output,
                            protein_id,
                            include_novel
                        )
                        
                        logger.info(f"Research completed for protein: {protein_id} (using alternative Gemini model: {alt_model})")
                        return structured_results
                    except Exception as alt_error:
                        logger.warning(f"Alternative model {alt_model} also failed: {alt_error}")
                        continue  # Try next alternative model
                
                # If all Gemini alternatives failed, provide helpful error
                logger.error("All Gemini models failed. Please check /list_models endpoint to see available models.")
            
            # Check if it's an HTML error response (Cloudflare 504)
            if "<!DOCTYPE html>" in error_msg or "Gateway time-out" in error_msg or "504" in error_msg:
                raise HTTPException(
                    status_code=504,
                    detail=(
                        "Gateway timeout: The Dedalus Labs API server timed out. "
                        "This happens when research tasks take too long. "
                        "Try: 1) Simplifying the query, 2) Reducing research scope (set include_novel=False), or 3) Retrying later."
                    )
                )
            
            # Handle timeout errors specifically
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise HTTPException(
                    status_code=504,
                    detail=(
                        "Research request timed out. This can happen with comprehensive research tasks. "
                        "The research may still be processing. Please try again or use a simpler query. "
                        f"Original error: {error_msg[:200]}"
                    )
                )
            
            # Handle model not found errors with helpful message
            if "not found" in error_msg.lower() and ("model" in error_msg.lower() or "404" in error_msg):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Model '{model}' is not available through Dedalus Labs. "
                        "Please call GET /list_models to see which Gemini models are available. "
                        "You may need to use a different model name format. "
                        f"Original error: {error_msg[:300]}"
                    )
                )
            
            # Handle other errors
            raise HTTPException(
                status_code=500,
                detail=f"Research failed: {error_msg[:500]}"
            )
    
    async def _search_pubmed(
        self,
        protein_id: str,
        include_novel: bool,
        months_recent: int,
        protein_info: Dict[str, str] = None
    ) -> List[Dict[str, str]]:
        """
        Search PubMed using NCBI E-utilities API for papers related to the protein.
        
        Args:
            protein_id: UniProt protein ID
            include_novel: Whether to include recent papers
            months_recent: Number of months for recent papers
            protein_info: Dictionary with protein information (name, gene, organism, etc.)
            
        Returns:
            List of dictionaries with paper information (title, authors, journal, year, pmid, url)
        """
        try:
            # Build search query for PubMed
            # Search for protein by UniProt ID and gene name variations
            # Use protein_info to improve search relevance
            search_terms = [f'"{protein_id}"[All Fields]', f'"{protein_id}"[Title/Abstract]']
            
            if protein_info:
                # Add protein name to search
                if protein_info.get('name'):
                    protein_name = protein_info['name']
                    search_terms.append(f'"{protein_name}"[Title/Abstract]')
                
                # Add gene name to search
                if protein_info.get('gene'):
                    gene_name = protein_info['gene']
                    search_terms.append(f'"{gene_name}"[Title/Abstract]')
                    search_terms.append(f'"{gene_name}"[Gene]')
            
            search_query = ' OR '.join(search_terms)
            
            # Add date filter for recent papers if requested
            if include_novel:
                from datetime import datetime, timedelta
                date_cutoff = (datetime.now() - timedelta(days=months_recent * 30)).strftime("%Y/%m/%d")
                search_query += f' AND ("{date_cutoff}"[PDat] : "3000"[PDat])'
            
            # URL encode the query
            encoded_query = quote(search_query)
            
            # Build ESearch URL to get PubMed IDs
            esearch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            params = {
                "db": "pubmed",
                "term": search_query,
                "retmax": "15",  # Get up to 15 results
                "retmode": "json",
                "sort": "relevance"  # Sort by relevance
            }
            
            # Add API key and tool/email if available
            if self.ncbi_api_key:
                params["api_key"] = self.ncbi_api_key
            if self.ncbi_tool:
                params["tool"] = self.ncbi_tool
            if self.ncbi_email:
                params["email"] = self.ncbi_email
            
            logger.info(f"Searching PubMed for protein {protein_id}...")
            response = await self.pubmed_client.get(esearch_url, params=params)
            response.raise_for_status()
            
            esearch_data = response.json()
            pmids = esearch_data.get("esearchresult", {}).get("idlist", [])
            
            if not pmids:
                logger.info(f"No PubMed results found for {protein_id}")
                return []
            
            logger.info(f"Found {len(pmids)} PubMed results for {protein_id}")
            
            # Fetch details for the PubMed IDs using EFetch
            efetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            efetch_params = {
                "db": "pubmed",
                "id": ",".join(pmids[:15]),  # Limit to 15
                "retmode": "xml",
                "rettype": "abstract"
            }
            
            if self.ncbi_api_key:
                efetch_params["api_key"] = self.ncbi_api_key
            if self.ncbi_tool:
                efetch_params["tool"] = self.ncbi_tool
            if self.ncbi_email:
                efetch_params["email"] = self.ncbi_email
            
            # Minimal delay to respect rate limits (3 req/sec without API key, 10 with)
            # Reduced delay for speed - API key recommended
            await asyncio.sleep(0.05 if self.ncbi_api_key else 0.2)
            
            efetch_response = await self.pubmed_client.get(efetch_url, params=efetch_params)
            efetch_response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(efetch_response.text)
            papers = []
            
            for article in root.findall(".//PubmedArticle"):
                try:
                    # Extract title
                    title_elem = article.find(".//ArticleTitle")
                    title = title_elem.text if title_elem is not None else "No title"
                    
                    # Extract authors
                    authors = []
                    for author in article.findall(".//Author"):
                        last_name = author.find("LastName")
                        first_name = author.find("ForeName")
                        if last_name is not None:
                            author_name = last_name.text
                            if first_name is not None:
                                author_name += f" {first_name.text}"
                            authors.append(author_name)
                    authors_str = ", ".join(authors[:5])  # Limit to first 5 authors
                    if len(authors) > 5:
                        authors_str += " et al."
                    
                    # Extract journal
                    journal_elem = article.find(".//Journal/Title")
                    journal = journal_elem.text if journal_elem is not None else "Unknown journal"
                    
                    # Extract year
                    year_elem = article.find(".//PubDate/Year")
                    year = year_elem.text if year_elem is not None else "Unknown"
                    
                    # Extract PMID
                    pmid_elem = article.find(".//PMID")
                    pmid = pmid_elem.text if pmid_elem is not None else ""
                    
                    # Create PubMed URL
                    pubmed_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}" if pmid else ""
                    
                    papers.append({
                        "title": title,
                        "authors": authors_str,
                        "journal": journal,
                        "year": year,
                        "pmid": pmid,
                        "url": pubmed_url
                    })
                except Exception as e:
                    logger.warning(f"Error parsing PubMed article: {e}")
                    continue
            
            logger.info(f"Successfully retrieved {len(papers)} PubMed papers")
            return papers
            
        except Exception as e:
            logger.error(f"Error searching PubMed: {e}")
            return []
    
    def _build_research_prompt(
        self,
        protein_id: str,
        include_novel: bool,
        months_recent: int,
        pubmed_results: List[Dict] = None,
        protein_info: Dict[str, str] = None
    ) -> str:
        """
        Build a comprehensive research prompt for the AI agent.
        
        Args:
            protein_id: UniProt protein ID
            include_novel: Whether to include novel research section
            months_recent: Months to consider for novel research
            pubmed_results: List of PubMed search results
        
        Returns:
            Formatted research prompt string
        """
        # Format PubMed results if available
        pubmed_section = ""
        if pubmed_results:
            pubmed_section = "\n\nPRE-SEARCHED PUBMED RESULTS:\n"
            pubmed_section += "The following papers were found from PubMed (https://pubmed.ncbi.nlm.nih.gov/):\n\n"
            for i, paper in enumerate(pubmed_results[:15], 1):  # Limit to 15
                pubmed_section += f"[{i}] {paper.get('title', 'No title')}\n"
                pubmed_section += f"    Authors: {paper.get('authors', 'Unknown')}\n"
                pubmed_section += f"    Journal: {paper.get('journal', 'Unknown')} ({paper.get('year', 'Unknown')})\n"
                if paper.get('url'):
                    pubmed_section += f"    Link: {paper.get('url')}\n"
                pubmed_section += f"    PMID: {paper.get('pmid', 'N/A')}\n\n"
            pubmed_section += "Please incorporate these PubMed results into your research sections.\n"
        novel_section = ""
        if include_novel:
            novel_section = f"""
5. NOVEL RESEARCH (Past {months_recent} months):
   - Search for the most recent research papers and publications (last {months_recent} months)
   - Find cutting-edge discoveries, new findings, or breakthrough research
   - Look for preprints, recent publications, and emerging research
   - Include any novel therapeutic applications or new mechanisms discovered
   - Focus on research that represents significant advances or new directions
"""
        
        # Build protein context for the prompt - use protein_info if provided, otherwise minimal info
        if protein_info is None:
            protein_info = {
                "protein_id": protein_id,
                "name": protein_id,
                "function": "",
                "organism": "Unknown",
                "gene": "",
                "keywords": ""
            }
        
        # Build protein context for the prompt
        protein_context = f"""
PROTEIN IDENTIFICATION:
- UniProt ID: {protein_info['protein_id']}
- Protein Name: {protein_info['name']}
- Organism: {protein_info['organism']}
- Gene Name: {protein_info['gene'] if protein_info['gene'] else 'Not specified'}
- Function: {protein_info['function'] if protein_info['function'] else 'See research below'}
- Keywords: {protein_info['keywords'] if protein_info['keywords'] else 'Not specified'}

IMPORTANT: You are researching {protein_info['name']} (UniProt ID: {protein_info['protein_id']}) from {protein_info['organism']}. 
Make sure all your searches and sources are specifically about THIS protein, not other proteins with similar names or functions.
When searching, use the protein name "{protein_info['name']}", gene name "{protein_info['gene'] if protein_info['gene'] else protein_info['protein_id']}", and UniProt ID "{protein_info['protein_id']}" to ensure you find relevant sources.
"""
        
        prompt = f"""I need to conduct COMPREHENSIVE and DETAILED research on the following protein:

{protein_context}

Please help me gather extensive, thorough information. Take your time to provide comprehensive details and in-depth analysis.

REQUIREMENTS:
- Search academic databases, PubMed, bioRxiv, and scientific sources extensively
- Use semantic search to find relevant papers and dig deeper into each topic
- Include direct hyperlinks to all sources cited
- LIMIT TO 15 SOURCES TOTAL - prioritize the most important and recent sources
- Provide DETAILED descriptions and comprehensive summaries
- Include extensive context, background information, and detailed explanations
- Search thoroughly and take time to gather comprehensive information
- PubMed searches have been performed and results are included below (if available)

RESEARCH SECTIONS (provide detailed information for each):

1. ACADEMIC PAPERS & PUBLICATIONS:
   - Find peer-reviewed research papers mentioning this protein
   - Include papers from high-impact journals (Nature, Science, Cell, etc.)
   - Search PubMed, bioRxiv, arXiv, and other preprint servers extensively
   - Include papers on structure, function, mechanism, interactions
   - For EACH paper, provide ALL of the following information:
     * Title (full title)
     * Authors (full author list or first author et al.)
     * Journal (journal name)
     * Year (publication year)
     * DOI (Digital Object Identifier - MUST include if available, format: 10.xxxx/xxxxx)
     * PMID (PubMed ID if available)
     * Direct hyperlink (URL to paper)
     * Summary (2-3 sentences summarizing the paper's main findings and relevance)
   - For each paper, provide a DETAILED description (3-5 sentences) explaining:
     * What the paper discovered or investigated
     * Key findings and their significance
     * How it relates to the protein's function or importance
     * Any novel insights or breakthroughs
   - IMPORTANT: Always extract and include the DOI when available - it's critical for academic citations
   - Prioritize recent and high-impact publications
   - Include 2-3 key papers with full citations, DOI, and detailed descriptions (prioritize recent and high-impact)

2. USE CASES & APPLICATIONS:
   - Find the MOST COMMON and well-established use cases for this protein
   - Search for clinical applications, therapeutic uses, diagnostic applications
   - Look for industrial applications, research tools, biotechnology uses
   - Include information from clinical trials databases, FDA approvals
   - For EACH use case, provide:
     * A 3-line summary (exactly 3 sentences) at the beginning summarizing the use case
     * DETAILED descriptions (4-6 sentences) explaining:
       - How the protein is used in this application
       - The mechanism or rationale behind the use
       - Current status and effectiveness
       - Any limitations or considerations
       - Real-world examples or case studies
   - Provide specific examples of how this protein is used in practice
   - Include any approved drugs or therapies based on this protein
   - Cite sources with hyperlinks for each use case

3. DRUG DEVELOPMENT & THERAPEUTICS:
   - Search for drugs targeting or using this protein extensively
   - Find clinical trials involving this protein (ClinicalTrials.gov)
   - Look for FDA/EMA approvals related to this protein
   - For each drug or therapeutic, provide DETAILED descriptions (5-7 sentences) explaining:
     * Drug name, mechanism of action, and target
     * Indications and approved uses
     * Development stage (preclinical, Phase I/II/III, approved)
     * Efficacy data and clinical outcomes
     * Side effects, contraindications, and safety profile
     * Market status and availability
   - Include information on drug mechanisms, indications, development stages
   - Search for patents related to therapeutic applications
   - Provide links to clinical trial records, drug databases, regulatory filings
   - Include information on both approved and investigational drugs

4. RESEARCH REFERENCES & CITATIONS:
   - Find where this protein has been referenced in major research initiatives
   - Look for involvement in large-scale studies, consortia, or research programs
   - Search for mentions in research databases, repositories, and resources
   - Include references from protein databases, pathway databases, disease databases
   - Provide hyperlinks to all referenced resources
{novel_section}
6. COMPREHENSIVE SUMMARY:
   - Provide an EXTENSIVE and DETAILED AI-generated summary (8-12 paragraphs) synthesizing all findings
   - Start with an overview of the protein's biological importance and significance
   - Detail key biological functions, mechanisms, and pathways involved
   - Provide comprehensive information on structure-function relationships
   - Summarize therapeutic potential and current applications in depth
   - Discuss research trends, emerging areas, and future directions
   - Include any controversies, conflicting findings, or unresolved questions
   - Make connections between different research areas and interdisciplinary insights
   - Conclude with implications for future research and clinical applications
   - Ensure the summary is thorough, well-structured, and provides comprehensive context

OUTPUT FORMAT:
- Start with a CITATIONS section listing ALL hyperlinks used (numbered list, MAX 15 sources)
- Then provide each section clearly labeled
- For each citation, include: [Number] Title/Description - Hyperlink
- Use markdown formatting for readability
- Ensure ALL sources are cited with working hyperlinks
- LIMIT TO 15 SOURCES TOTAL across all sections
- Prioritize the most important and recent sources
- Keep responses CONCISE - focus on key facts, not lengthy descriptions

IMPORTANT:
- Use semantic search to find relevant content extensively, not just exact matches
- LIMIT TO 15 SOURCES TOTAL - be selective and prioritize quality
- Prioritize recent, high-quality, peer-reviewed sources
- Take your time to search thoroughly and provide comprehensive information
- Provide DETAILED descriptions and extensive context for all findings
- Include thorough explanations, background information, and detailed summaries
- Focus on the most important information from the top 15 sources, but provide extensive detail
- Use paragraphs and detailed descriptions - be comprehensive, not concise
- PubMed results have been pre-searched and are available below (if available)

{protein_context}

{pubmed_section}
"""
        return prompt
    
    def _parse_research_results(
        self,
        raw_output: str,
        protein_id: str,
        include_novel: bool
    ) -> Dict[str, any]:
        """
        Parse the raw agent output into structured results.
        
        Args:
            raw_output: Raw text output from the agent
            protein_id: Protein ID that was researched
            include_novel: Whether novel research section was requested
        
        Returns:
            Structured dictionary with parsed sections
        """
        # Extract citations (usually at the beginning)
        citations = self._extract_citations(raw_output)
        
        # Extract sections
        papers = self._extract_section(raw_output, "ACADEMIC PAPERS", "USE CASES")
        use_cases = self._extract_section(raw_output, "USE CASES", "DRUG DEVELOPMENT")
        drug_dev = self._extract_section(raw_output, "DRUG DEVELOPMENT", "RESEARCH REFERENCES")
        research_refs = self._extract_section(raw_output, "RESEARCH REFERENCES", "NOVEL RESEARCH" if include_novel else "SUMMARY")
        
        novel_research = None
        if include_novel:
            novel_research = self._extract_section(raw_output, "NOVEL RESEARCH", "SUMMARY")
        
        summary = self._extract_section(raw_output, "SUMMARY", None)
        
        # Extract 3-line summary from use cases
        use_cases_summary = self._extract_use_cases_summary(use_cases) if use_cases else None
        
        # Try to extract structured papers from the papers section
        structured_papers = self._extract_structured_papers(papers, citations) if papers else []
        
        # Try to extract structured references from research_references
        structured_references = self._extract_structured_references(research_refs, citations) if research_refs else []
        
        return {
            "protein_id": protein_id,
            "citations": citations,
            "papers": papers or "No papers section found",
            "structured_papers": structured_papers,  # New: structured paper data
            "use_cases": use_cases or "No use cases section found",
            "use_cases_summary": use_cases_summary,  # New: 3-line summary of use cases
            "drug_development": drug_dev or "No drug development section found",
            "research_references": research_refs or "No research references section found",
            "structured_references": structured_references,  # New: structured reference data
            "novel_research": novel_research or (None if not include_novel else "No novel research section found"),
            "summary": summary or "No summary section found",
            "raw_output": raw_output
        }
    
    def _extract_citations(self, text: str) -> List[Dict[str, str]]:
        """Extract citations with hyperlinks from the text."""
        import re
        citations = []
        lines = text.split('\n')
        
        in_citations = False
        citation_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect citations section - more flexible matching
            if "CITATION" in line.upper():
                in_citations = True
                continue
            
            # Also look for numbered lists with URLs anywhere in the text
            if re.search(r'\[\d+\]', line) and 'http' in line:
                in_citations = True
            
            # Look for URLs in any line (broader search)
            if 'http' in line:
                # Match patterns like [1] Title - http://...
                match = re.search(r'\[(\d+)\]\s*(.+?)\s*[-–—]\s*(https?://[^\s\)]+)', line)
                if match:
                    citations.append({
                        "number": match.group(1),
                        "title": match.group(2).strip(),
                        "url": match.group(3)
                    })
                    citation_count += 1
                else:
                    # Try pattern without dash: [1] Title http://...
                    match = re.search(r'\[(\d+)\]\s*(.+?)\s+(https?://[^\s\)]+)', line)
                    if match:
                        citations.append({
                            "number": match.group(1),
                            "title": match.group(2).strip(),
                            "url": match.group(3)
                        })
                        citation_count += 1
                    else:
                        # Just extract URL and use line as title
                        url_match = re.search(r'(https?://[^\s\)]+)', line)
                        if url_match:
                            title = line.replace(url_match.group(1), "").strip()
                            # Clean up title
                            title = re.sub(r'^\[\d+\]\s*', '', title).strip()
                            title = re.sub(r'[-–—]\s*$', '', title).strip()
                            if not title:
                                title = f"Source {citation_count + 1}"
                            citations.append({
                                "number": str(citation_count + 1),
                                "title": title,
                                "url": url_match.group(1)
                            })
                            citation_count += 1
                
                # Stop after finding 15 citations (as per limit)
                if citation_count >= 15:
                    break
        
        # If no citations found, try to extract all URLs from text
        if not citations:
            all_urls = re.findall(r'https?://[^\s\)]+', text)
            for i, url in enumerate(all_urls[:15], 1):
                citations.append({
                    "number": str(i),
                    "title": f"Source {i}",
                    "url": url
                })
        
        # If still no citations, try extracting from the entire text more aggressively
        if not citations:
            # Look for any numbered list with URLs in the entire text
            all_numbered_urls = re.findall(r'\[(\d+)\].*?(https?://[^\s\)]+)', text, re.IGNORECASE | re.DOTALL)
            for num, url in all_numbered_urls[:15]:
                # Try to find title before or after the URL
                url_pos = text.find(url)
                if url_pos > 0:
                    context = text[max(0, url_pos - 200):url_pos + 200]
                    title_match = re.search(r'\[(\d+)\]\s*(.+?)(?:\s*[-–—]|\s*:\s*)\s*' + re.escape(url), context, re.IGNORECASE)
                    if title_match:
                        title = title_match.group(2).strip()
                    else:
                        # Extract text before URL
                        before_url = context[:context.find(url)].strip()
                        title = re.sub(r'^\[?\d+\]?\s*', '', before_url.split('\n')[-1]).strip() if before_url else f"Source {num}"
                    
                    citations.append({
                        "number": num,
                        "title": title if title and len(title) > 5 else f"Source {num}",
                        "url": url
                    })
        
        # Final fallback: extract all URLs and number them
        if not citations:
            all_urls = re.findall(r'https?://[^\s\)]+', text)
            for i, url in enumerate(all_urls[:15], 1):
                # Try to find context around the URL
                url_pos = text.find(url)
                if url_pos > 0:
                    context = text[max(0, url_pos - 100):url_pos + 50]
                    # Look for text before URL that might be a title
                    lines_before = context.split('\n')
                    title = None
                    for line in reversed(lines_before):
                        line = line.strip()
                        if line and len(line) > 10 and not line.startswith('http') and not re.match(r'^\[?\d+\]', line):
                            title = line.replace(url, '').strip()
                            title = re.sub(r'[-–—]\s*$', '', title).strip()
                            if title:
                                break
                    
                    citations.append({
                        "number": str(i),
                        "title": title or f"Source {i}",
                        "url": url
                    })
                else:
                    citations.append({
                        "number": str(i),
                        "title": f"Source {i}",
                        "url": url
                    })
        
        return citations if citations else []
    
    def _extract_section(
        self,
        text: str,
        section_name: str,
        next_section: Optional[str]
    ) -> Optional[str]:
        """Extract a specific section from the text."""
        lines = text.split('\n')
        section_lines = []
        in_section = False
        
        for i, line in enumerate(lines):
            # Check if we've entered the target section
            if section_name.upper() in line.upper() and not in_section:
                in_section = True
                continue
            
            # Check if we've hit the next section
            if next_section and next_section.upper() in line.upper() and in_section:
                break
            
            # Collect lines in the section
            if in_section:
                section_lines.append(line)
        
        result = '\n'.join(section_lines).strip()
        return result if result else None
    
    def _extract_structured_papers(self, papers_text: str, citations: List[Dict]) -> List[Dict]:
        """Extract structured paper information from papers section text."""
        import re
        papers = []
        
        if not papers_text or papers_text == "No papers section found":
            return papers
        
        lines = papers_text.split('\n')
        current_paper = {}
        citation_num = None
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_paper.get('title'):
                    papers.append(current_paper)
                    current_paper = {}
                continue
            
            # Look for citation numbers
            citation_match = re.search(r'\[(\d+)\]', line)
            if citation_match:
                citation_num = citation_match.group(1)
            
            # Look for paper titles (lines that look like titles)
            if len(line) > 30 and not line.startswith(('-', '•', '*')) and not re.match(r'^(Authors?|Journal|Year|DOI|PMID|Link|Title):', line, re.I):
                if current_paper.get('title'):
                    papers.append(current_paper)
                
                # Clean title from markdown
                title = re.sub(r'^\[?\d+\]?\s*', '', line).strip()
                title = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', title)  # Remove ***text***
                title = re.sub(r'\*\*([^*]+)\*\*', r'\1', title)  # Remove **text**
                title = re.sub(r'\*([^*]+)\*', r'\1', title)  # Remove *text*
                title = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', title)  # Remove markdown links, keep text
                
                current_paper = {
                    'title': title,
                    'citationNumber': citation_num,
                    'authors': '',
                    'journal': '',
                    'year': '',
                    'doi': '',
                    'pmid': '',
                    'link': '',
                    'description': '',
                    'summary': ''
                }
                citation_num = None
            elif current_paper.get('title'):
                # Extract metadata
                authors_match = re.match(r'^(Authors?|Author):\s*(.+)$', line, re.I)
                if authors_match:
                    current_paper['authors'] = authors_match.group(2).strip()
                    continue
                
                journal_match = re.match(r'^(Journal|Journal Name):\s*(.+)$', line, re.I)
                if journal_match:
                    current_paper['journal'] = journal_match.group(2).strip()
                    continue
                
                year_match = re.search(r'(\d{4})', line)
                if year_match and not current_paper.get('year'):
                    current_paper['year'] = year_match.group(1)
                
                doi_match = re.search(r'(10\.\d+/[^\s\)]+|PMID:\s*\d+)', line, re.I)
                if doi_match:
                    current_paper['doi'] = doi_match.group(1)
                
                url_match = re.search(r'(https?://[^\s\)]+)', line)
                if url_match and not current_paper.get('link'):
                    current_paper['link'] = url_match.group(1)
                
                # Extract summary - look for "Summary:" prefix
                summary_match = re.match(r'^(Summary|summary|Description|description):\s*(.+)$', line, re.I)
                if summary_match:
                    summary_text = summary_match.group(2).strip()
                    # Clean markdown from summary
                    summary_text = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', summary_text)
                    summary_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', summary_text)
                    summary_text = re.sub(r'\*([^*]+)\*', r'\1', summary_text)
                    summary_text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', summary_text)  # Remove markdown links, keep text
                    current_paper['summary'] = summary_text
                    continue
                
                # Extract hyperlink - look for "Hyperlink:" prefix first
                hyperlink_prefix_match = re.match(r'^(Hyperlink|Link):\s*(.+)$', line, re.I)
                if hyperlink_prefix_match:
                    hyperlink_value = hyperlink_prefix_match.group(2).strip()
                    # Check if it's a markdown link [text](url)
                    hyperlink_match = re.search(r'\[([^\]]+)\]\(([^\)]+)\)', hyperlink_value)
                    if hyperlink_match:
                        link_url = hyperlink_match.group(2)
                        if not current_paper.get('link'):
                            current_paper['link'] = link_url
                    else:
                        # Check if it's a plain URL
                        url_match = re.search(r'(https?://[^\s\)]+)', hyperlink_value)
                        if url_match and not current_paper.get('link'):
                            current_paper['link'] = url_match.group(1)
                    continue  # Skip processing this line further
                
                # Extract hyperlink - look for markdown links [text](url) or just URLs
                hyperlink_match = re.search(r'\[([^\]]+)\]\(([^\)]+)\)', line)
                if hyperlink_match:
                    link_text = hyperlink_match.group(1)
                    link_url = hyperlink_match.group(2)
                    if not current_paper.get('link'):
                        current_paper['link'] = link_url
                    # Remove the markdown link from the line
                    line = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', '', line).strip()
                
                # Also look for plain URLs
                url_match = re.search(r'(https?://[^\s\)]+)', line)
                if url_match and not current_paper.get('link'):
                    current_paper['link'] = url_match.group(1)
                    # Remove URL from line
                    line = re.sub(r'https?://[^\s\)]+', '', line).strip()
                
                # Clean markdown formatting: remove **bold**, *italic*, ***bold-italic***
                line = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', line)  # Remove ***text***
                line = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)  # Remove **text**
                line = re.sub(r'\*([^*]+)\*', r'\1', line)  # Remove *text*
                line = re.sub(r'__([^_]+)__', r'\1', line)  # Remove __text__
                line = re.sub(r'_([^_]+)_', r'\1', line)  # Remove _text_
                
                # Remove markdown headers (# ## ###)
                line = re.sub(r'^#+\s*', '', line)
                
                # Clean up extra whitespace
                line = re.sub(r'\s+', ' ', line).strip()
                
                # Description (any other meaningful line)
                if len(line) > 20 and not re.match(r'^(Authors?|Journal|Year|DOI|PMID|Link|Summary|Hyperlink|Description):', line, re.I):
                    if not current_paper.get('description'):
                        current_paper['description'] = line
                    # If no summary yet, use description as summary
                    if not current_paper.get('summary') and len(line) > 30:
                        current_paper['summary'] = line
        
        if current_paper.get('title'):
            papers.append(current_paper)
        
        # Enhance with citation data if available
        for paper in papers:
            if paper.get('citationNumber') and citations:
                citation = next((c for c in citations if c.get('number') == paper['citationNumber']), None)
                if citation:
                    if not paper.get('link') and citation.get('url'):
                        paper['link'] = citation['url']
                    if not paper.get('title') or paper['title'] == '':
                        paper['title'] = citation.get('title', paper['title'])
        
        return papers
    
    def _extract_structured_references(self, refs_text: str, citations: List[Dict]) -> List[Dict]:
        """Extract structured reference information from research_references section."""
        import re
        references = []
        
        if not refs_text or refs_text == "No research references section found":
            return references
        
        lines = refs_text.split('\n')
        current_ref = {}
        citation_num = None
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_ref.get('name'):
                    references.append(current_ref)
                    current_ref = {}
                continue
            
            citation_match = re.search(r'\[(\d+)\]', line)
            if citation_match:
                citation_num = citation_match.group(1)
            
            # Look for database/resource names
            db_patterns = ['UniProt', 'RCSB', 'NCBI', 'PDB', 'PubMed', 'Gene', 'Ensembl', 'KEGG', 'Reactome', 'STRING', 'IntAct']
            is_db_line = any(db in line for db in db_patterns) or (len(line) > 15 and not line.startswith(('-', '•', '*')))
            
            if is_db_line:
                if current_ref.get('name'):
                    references.append(current_ref)
                
                # Extract name (before colon, dash, or URL)
                name_match = re.match(r'^\[?\d+\]?\s*(.+?)(?:\s*[-–—]|\s*:\s*|https?://)', line)
                if name_match:
                    name = name_match.group(1).strip()
                else:
                    name = re.sub(r'^\[?\d+\]?\s*', '', line).split(':')[0].split(' - ')[0].strip()
                
                current_ref = {
                    'name': name,
                    'url': '',
                    'description': '',
                    'citationNumber': citation_num
                }
                citation_num = None
            elif current_ref.get('name'):
                # Extract URL
                url_match = re.search(r'(https?://[^\s\)]+)', line)
                if url_match:
                    current_ref['url'] = url_match.group(1)
                
                # Extract description
                if len(line) > 10 and not url_match:
                    desc = line.replace(current_ref['name'], '').strip()
                    if desc and not desc.startswith('http'):
                        current_ref['description'] = (current_ref.get('description', '') + ' ' + desc).strip()
        
        if current_ref.get('name'):
            references.append(current_ref)
        
        # Enhance with citation data if available
        for ref in references:
            if ref.get('citationNumber') and citations:
                citation = next((c for c in citations if c.get('number') == ref['citationNumber']), None)
                if citation:
                    if not ref.get('url') and citation.get('url'):
                        ref['url'] = citation['url']
                    if not ref.get('name') or ref['name'] == '':
                        ref['name'] = citation.get('title', ref['name'])
        
        return references
    
    def _extract_use_cases_summary(self, use_cases_text: str) -> Optional[str]:
        """Extract the 3-line summary from use cases section."""
        import re
        if not use_cases_text or use_cases_text == "No use cases section found":
            return None
        
        lines = use_cases_text.split('\n')
        summary_lines = []
        in_summary = False
        summary_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                if in_summary and summary_count >= 3:
                    break
                continue
            
            # Look for summary indicators
            if re.search(r'(?:summary|overview|in brief|in short)', line, re.I) and not in_summary:
                in_summary = True
                # Extract text after summary indicator
                summary_text = re.sub(r'.*?(?:summary|overview|in brief|in short)[:\-]?\s*', '', line, flags=re.I)
                if summary_text:
                    summary_lines.append(summary_text)
                    summary_count += 1
                continue
            
            # If we're in summary mode, collect sentences
            if in_summary:
                # Check if line ends with sentence punctuation
                if re.search(r'[.!?]$', line):
                    summary_lines.append(line)
                    summary_count += 1
                    if summary_count >= 3:
                        break
                else:
                    summary_lines.append(line)
                    summary_count += 1
                    if summary_count >= 3:
                        break
            # If we find numbered list or bullet points, might be start of detailed section
            elif re.match(r'^[\d\-\•]', line) and summary_count == 0:
                # Try to extract first 3 sentences from first few lines
                first_lines = '\n'.join(lines[:10])
                sentences = re.split(r'[.!?]+', first_lines)
                summary_lines = [s.strip() for s in sentences[:3] if s.strip() and len(s.strip()) > 20]
                if len(summary_lines) >= 3:
                    break
        
        # If no summary found, try to extract first 3 sentences from the text
        if not summary_lines:
            sentences = re.split(r'[.!?]+', use_cases_text)
            summary_lines = [s.strip() for s in sentences[:3] if s.strip() and len(s.strip()) > 20]
        
        if summary_lines:
            return '\n'.join(summary_lines[:3])
        return None


# Async wrapper function for easy use
async def research_protein_async(
    protein_id: str,
    model: str = "google/gemini-1.5-flash",
    include_novel: bool = True,
    months_recent: int = 6
) -> Dict[str, any]:
    """
    Convenience function to research a protein.
    
    Args:
        protein_id: UniProt protein ID
        model: Model to use. Can use aliases like "gemini", "gpt4", etc.
               See SUPPORTED_MODELS for available aliases.
        include_novel: Include novel research section
        months_recent: Months for novel research
    
    Returns:
        Structured research results
    """
    service = AgenticResearchService()
    return await service.research_protein(
        protein_id=protein_id,
        model=model,
        include_novel=include_novel,
        months_recent=months_recent
    )


# Example usage
if __name__ == "__main__":
    async def main():
        """Example usage of the research service."""
        # Example: Research insulin (P01308)
        protein_id = "P01308"  # Human insulin
        
        print(f"Researching protein: {protein_id}")
        print("=" * 70)
        
        try:
            service = AgenticResearchService()
            
            # Example: Use Gemini model
            print("Using Gemini 1.5 Flash model (quick research, 10 sources max)...")
            results = await service.research_protein(
                protein_id=protein_id,
                model="gemini-1.5-flash",  # Fast model for quick research
                include_novel=True,
                months_recent=6
            )
            
            print("\n" + "=" * 70)
            print("CITATIONS")
            print("=" * 70)
            for citation in results["citations"]:
                print(f"[{citation['number']}] {citation['title']}")
                if citation['url']:
                    print(f"    {citation['url']}")
            
            print("\n" + "=" * 70)
            print("ACADEMIC PAPERS")
            print("=" * 70)
            print(results["papers"])
            
            print("\n" + "=" * 70)
            print("USE CASES")
            print("=" * 70)
            print(results["use_cases"])
            
            print("\n" + "=" * 70)
            print("DRUG DEVELOPMENT")
            print("=" * 70)
            print(results["drug_development"])
            
            print("\n" + "=" * 70)
            print("NOVEL RESEARCH")
            print("=" * 70)
            print(results["novel_research"])
            
            print("\n" + "=" * 70)
            print("SUMMARY")
            print("=" * 70)
            print(results["summary"])
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(main())

