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

# Try to import BeautifulSoup for web scraping
try:
    from bs4 import BeautifulSoup
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False
    # Logger not initialized yet, will log later

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
        months_recent: int = 6,
        medical_query: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Conduct comprehensive research on a protein using AI agents with PubMed integration (up to 15 sources, optimized for speed).

        Args:
            protein_id: UniProt protein ID (e.g., "P01308" for insulin)
            model: Model to use for research. Default: "google/gemini-2.0-flash-lite"
            include_novel: Whether to include novel/recent research section
            months_recent: Number of months to consider for "novel" research
            medical_query: Medical/biological query terms optimized for research (optional)

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
        # Pass protein_info and medical_query to improve PubMed search
        pubmed_task = asyncio.create_task(
            asyncio.wait_for(
                self._search_pubmed(protein_id, include_novel, months_recent, protein_info, medical_query),
                timeout=15.0  # 15 second timeout for PubMed search (increased for thoroughness)
            )
        )
        
        # Start building prompt while PubMed searches (we'll add results if available)
        # Construct comprehensive research prompt with protein information and medical query
        research_prompt = self._build_research_prompt(
            protein_id, include_novel, months_recent, None, protein_info, medical_query  # Pass protein info and medical query
        )
        
        # Try to get PubMed results (with timeout handling)
        pubmed_results = []
        try:
            pubmed_results = await pubmed_task
            if pubmed_results:
                # Rebuild prompt with PubMed results if we got them
                research_prompt = self._build_research_prompt(
                    protein_id, include_novel, months_recent, pubmed_results, protein_info, medical_query
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
        
        # Retry logic with exponential backoff for 500 errors
        max_retries = 3
        base_delay = 2.0  # Start with 2 seconds
        result = None
        
        for attempt in range(max_retries):
            try:
                # Add delay before retry (except first attempt)
                if attempt > 0:
                    delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff: 2s, 4s, 8s
                    logger.info(f"Retrying research (attempt {attempt + 1}/{max_retries}) after {delay:.1f}s delay...")
                    await asyncio.sleep(delay)
                
                # Run the research agent with exa-search MCP server
                # Based on Dedalus Labs docs: runner.run() accepts input, model, and mcp_servers
                result = await self.runner.run(
                    input=research_prompt,
                    model=dedalus_model,
                    mcp_servers=mcp_servers
                )
                logger.info(f"Research succeeded with MCP server: {mcp_servers[0]}")
                break  # Success, exit retry loop
                
            except Exception as e:
                error_msg = str(e)
                is_500_error = "500" in error_msg or "Internal Server Error" in error_msg
                is_mcp_error = "MCP tool" in error_msg or "web_search_exa" in error_msg or "TaskGroup" in error_msg
                is_last_attempt = attempt == max_retries - 1
                
                # Retry on 500 errors or MCP tool errors (these are often transient)
                if (is_500_error or is_mcp_error) and not is_last_attempt:
                    logger.warning(f"Research failed with {'MCP tool' if is_mcp_error else '500'} error (attempt {attempt + 1}/{max_retries}): {error_msg[:200]}")
                    continue  # Retry
                elif is_mcp_error and is_last_attempt:
                    # MCP server is failing - try without MCP servers as fallback
                    logger.warning(f"MCP server {mcp_servers[0]} failed after {max_retries} attempts. Trying without MCP servers as fallback...")
                    try:
                        result = await self.runner.run(
                            input=research_prompt,
                            model=dedalus_model,
                            mcp_servers=[]  # No MCP servers - LLM only
                        )
                        logger.info("Research succeeded without MCP servers (LLM only)")
                        break  # Success
                    except Exception as fallback_error:
                        logger.error(f"Fallback without MCP servers also failed: {fallback_error}")
                        raise  # Re-raise original error
                else:
                    # Not a retryable error, or last attempt - re-raise
                    logger.error(f"Research failed with MCP server {mcp_servers[0]}: {error_msg}")
                    raise
        
        # Check if we got a result
        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Research failed: No result returned after all retry attempts"
            )
        
        # Access final_output from result (per Dedalus Labs Runner API)
        try:
            if not hasattr(result, 'final_output'):
                logger.warning("Result object missing 'final_output' attribute, trying alternative access")
                # Fallback: result might be a string or have different structure
                output = str(result) if not isinstance(result, str) else result
            else:
                output = result.final_output
            
            # Parse and structure the results
            structured_results = await self._parse_research_results(
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
                        
                        structured_results = await self._parse_research_results(
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
        protein_info: Dict[str, str] = None,
        medical_query: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """
        Search PubMed using NCBI E-utilities API for papers related to the protein.
        
        Args:
            protein_id: UniProt protein ID
            include_novel: Whether to include recent papers
            months_recent: Number of months for recent papers
            protein_info: Dictionary with protein information (name, gene, organism, etc.)
            medical_query: Medical/biological query terms optimized for PubMed search
            
        Returns:
            List of dictionaries with paper information (title, authors, journal, year, pmid, url)
        """
        try:
            # Build search query for PubMed
            # Search for protein by UniProt ID and gene name variations
            # Use protein_info and medical_query to improve search relevance
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
            
            # Add medical query terms if provided (these are optimized for medical/biological research)
            if medical_query:
                # Split medical query into individual terms and add them
                medical_terms = medical_query.split()
                # Add key medical terms to search (limit to most important terms to avoid overly complex queries)
                for term in medical_terms[:5]:  # Use first 5 terms to keep query manageable
                    if len(term) > 3:  # Only add terms longer than 3 characters
                        search_terms.append(f'"{term}"[Title/Abstract]')
            
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
            
            # Use protein name in logging if available
            protein_display = protein_info.get('name', protein_id) if protein_info else protein_id
            logger.info(f"Searching PubMed for {protein_display} ({protein_id})...")
            response = await self.pubmed_client.get(esearch_url, params=params)
            response.raise_for_status()
            
            esearch_data = response.json()
            pmids = esearch_data.get("esearchresult", {}).get("idlist", [])
            
            if not pmids:
                logger.info(f"No PubMed results found for {protein_display} ({protein_id})")
                return []
            
            logger.info(f"Found {len(pmids)} PubMed results for {protein_display} ({protein_id})")
            
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
        protein_info: Dict[str, str] = None,
        medical_query: Optional[str] = None
    ) -> str:
        """
        Build a comprehensive research prompt for the AI agent.
        
        Args:
            protein_id: UniProt protein ID
            include_novel: Whether to include novel research section
            months_recent: Months to consider for novel research
            pubmed_results: List of PubMed search results
            protein_info: Dictionary with protein information
            medical_query: Medical/biological query terms optimized for research
        
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
        
        # Build medical query context if provided
        medical_query_section = ""
        if medical_query:
            medical_query_section = f"""
MEDICAL/BIOLOGICAL QUERY TERMS:
The following medical and biological terms have been optimized for research:
"{medical_query}"

Use these terms when searching PubMed, academic databases, and scientific sources.
Combine these terms with the protein-specific information below for comprehensive research.
"""
        
        # Build protein context for the prompt
        protein_context = f"""
PROTEIN IDENTIFICATION:
- UniProt ID: {protein_info['protein_id']}
- Protein Name: {protein_info['name']}
- Organism: {protein_info['organism']}
- Gene Name: {protein_info['gene'] if protein_info['gene'] else 'Not specified'}
- Function: {protein_info['function'] if protein_info['function'] else 'See research below'}
- Keywords: {protein_info['keywords'] if protein_info['keywords'] else 'Not specified'}

{medical_query_section}

IMPORTANT: You are researching {protein_info['name']} (UniProt ID: {protein_info['protein_id']}) from {protein_info['organism']}. 
Make sure all your searches and sources are specifically about THIS protein, not other proteins with similar names or functions.
When searching, use the protein name "{protein_info['name']}", gene name "{protein_info['gene'] if protein_info['gene'] else protein_info['protein_id']}", and UniProt ID "{protein_info['protein_id']}" to ensure you find relevant sources.
{f'Additionally, use the medical query terms: "{medical_query}" to find relevant medical and biological research.' if medical_query else ''}
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
   
   CRITICAL FORMATTING REQUIREMENT - For EACH paper, you MUST use this EXACT format:
   
   [Citation Number]
   Title: [ONLY the actual paper title - NO URLs, NO section headers, NO extra text, just the title]
   Authors: [Author names, e.g., "Smith, J., et al." or "First Author, Second Author, Third Author"]
   Journal: [Journal name, e.g., "Nature", "Cell", "Science"]
   Year: [Publication year, e.g., "2024"]
   DOI: [DOI if available, format: "10.xxxx/xxxxx" or "Not available" if not found]
   PMID: [PubMed ID if available, e.g., "12345678" or "Not available"]
   Hyperlink: [Direct URL to the paper - this will be displayed at the end]
   Summary: [2-3 sentences summarizing the paper's main findings and relevance - REQUIRED, you MUST generate this based on the paper content, NEVER write "N/A"]
   Description: [3-5 sentences providing detailed explanation of what the paper discovered, key findings, significance, and how it relates to the protein - REQUIRED, you MUST generate this based on the paper content, NEVER write "N/A"]
   
   CRITICAL RULES FOR TITLE:
   - The "Title:" field MUST contain ONLY the actual paper title
   - NEVER include URLs in the title field - URLs go in the Hyperlink field only
   - NEVER include section headers like "ACADEMIC PAPERS" or "PUBLICATIONS" in the title
   - NEVER include phrases like "Here's the information" or "formatted as requested" in the title
   - The title should be the actual research paper title, nothing else
   
   CRITICAL RULES FOR SUMMARY AND DESCRIPTION - THEY MUST BE DIFFERENT:
   - BOTH Summary and Description fields are REQUIRED for every paper
   - Summary and Description MUST contain DIFFERENT content - they serve different purposes
   - NEVER copy the Summary content into Description or vice versa
   - NEVER use the same text for both fields
   
   SUMMARY FIELD RULES (2-3 sentences):
   - Summary should focus on the RESEARCH PROCESS, METHODOLOGY, and HOW the study was conducted
   - Describe the experimental approach, techniques used, data collection methods
   - Explain the step-by-step process of how the research was performed
   - Focus on: "How was this research done? What methods were used?"
   - Example: "This study employed [specific method] to investigate [topic]. Researchers utilized [technique] to analyze [data type]. The experimental design involved [process] with validation through [method]."
   
   DESCRIPTION FIELD RULES (3-5 sentences):
   - Description should focus on the HIGH-LEVEL OVERVIEW, MAIN TOPIC, and WHAT the paper is about
   - Provide a broad overview similar to an abstract - what is the paper's main contribution?
   - Describe the overall research area, context, and significance
   - Focus on: "What is this paper about? What is the big picture?"
   - Example: "This research paper explores [broad topic] in the context of [field]. The study addresses [main question] and contributes to understanding [significance]. The findings reveal [key insight] and have implications for [relevance]."
   
   CRITICAL: Summary = PROCESS/METHODOLOGY (how it was done), Description = OVERVIEW/TOPIC (what it's about)
   - These are COMPLETELY DIFFERENT aspects of the paper
   - Summary explains the research methodology and experimental process
   - Description explains the paper's topic, scope, and overall contribution
   - NEVER write the same content for both fields
   
   CRITICAL RULES FOR HYPERLINK:
   - The Hyperlink field should contain ONLY the URL
   - This will be displayed at the end of each paper entry
   - If no URL is available, write "N/A"
   
   OTHER IMPORTANT RULES:
   - ALWAYS extract the DOI from the paper source - check PubMed, journal websites, or citation databases
   - If DOI is not found after searching, write "Not available" (do not leave blank)
   - Use the exact field names shown above (Title:, Authors:, Journal:, Year:, DOI:, PMID:, Hyperlink:, Summary:, Description:)
   - Each paper should be separated by a blank line
   - Prioritize recent and high-impact publications
   - Include 2-3 key papers with complete information in this format
   - REMEMBER: Title = only title, Summary = required (or N/A), Description = required (or N/A), Hyperlink = at the end

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
    
    async def _parse_research_results(
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

        # Log the papers section for debugging
        if papers:
            logger.info(f"Papers section extracted ({len(papers)} chars): {papers[:500]}...")
            # Check if descriptions are mentioned in the papers section
            if "Description:" in papers:
                logger.info("Found 'Description:' field in papers section")
            else:
                logger.warning("No 'Description:' field found in papers section - descriptions may be missing")
        else:
            logger.warning("No papers section found in AI output")
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
        
        # Log description status for debugging
        if structured_papers:
            papers_with_desc = sum(1 for p in structured_papers if p.get('description') and p.get('description', '').strip() and p.get('description') != 'N/A')
            papers_without_desc = len(structured_papers) - papers_with_desc
            logger.info(f"Extracted {len(structured_papers)} structured papers: {papers_with_desc} with descriptions, {papers_without_desc} without descriptions")
            
            # Fetch missing metadata from URLs
            if papers_without_desc > 0:
                logger.info(f"Fetching metadata from URLs for {papers_without_desc} papers with missing descriptions/authors...")
                try:
                    from services.paper_metadata_fetcher import fetch_paper_metadata_batch
                    structured_papers = await fetch_paper_metadata_batch(structured_papers, max_concurrent=3)
                    logger.info("Successfully fetched metadata from URLs")
                except Exception as e:
                    logger.warning(f"Error fetching metadata from URLs: {e}")
            
            # Generate descriptions using Gemini for papers still missing descriptions
            papers_still_missing = [p for p in structured_papers if 
                                  (not p.get('description') or p.get('description', '').strip() == '' or p.get('description') == 'N/A')]
            if papers_still_missing:
                logger.info(f"Generating descriptions using Gemini for {len(papers_still_missing)} papers still missing descriptions...")
                try:
                    import google.generativeai as genai
                    gemini_api_key = os.getenv("GEMINI_API_KEY")
                    if gemini_api_key:
                        genai.configure(api_key=gemini_api_key)
                        model = genai.GenerativeModel("gemini-2.0-flash-exp")
                        
                        for paper in papers_still_missing:
                            title = paper.get('title', 'Unknown')
                            journal = paper.get('journal', 'Unknown')
                            year = paper.get('year', 'Unknown')
                            link = paper.get('link', '')
                            doi = paper.get('doi', '')
                            pmid = paper.get('pmid', '')
                            
                            # Try to fetch DOI/PMID if we have a URL but no DOI/PMID
                            if link and (not doi or doi == 'N/A' or doi == 'Not available') and (not pmid or pmid == 'N/A' or pmid == 'Not available'):
                                try:
                                    from services.paper_metadata_fetcher import PaperMetadataFetcher
                                    fetcher = PaperMetadataFetcher()
                                    metadata = await fetcher.fetch_metadata(link, title)
                                    if metadata.get('doi') and (not paper.get('doi') or paper.get('doi') == 'N/A'):
                                        paper['doi'] = metadata['doi']
                                    if metadata.get('pmid') and (not paper.get('pmid') or paper.get('pmid') == 'N/A'):
                                        paper['pmid'] = metadata['pmid']
                                    await fetcher.close()
                                except Exception as fetch_error:
                                    logger.warning(f"Error fetching DOI/PMID: {fetch_error}")
                            
                            # Generate description - HIGH-LEVEL OVERVIEW (abstract-like)
                            # This explains WHAT the paper is about
                            desc_prompt = f"""Based on the following research paper information, generate a HIGH-LEVEL OVERVIEW (Description) that provides a broad, comprehensive summary of the paper's main topic, scope, and overall contribution.

Title: {title}
Journal: {journal}
Year: {year}
URL: {link}
DOI: {doi if doi else 'Not available'}
PMID: {pmid if pmid else 'Not available'}

Generate a HIGH-LEVEL OVERVIEW (3-5 sentences) that:
1. Provides a broad overview of the paper's main topic and scope
2. Describes the overall research area and context
3. Summarizes the paper's main contribution at a high level
4. Explains the general significance and relevance to the field
5. Gives a comprehensive but concise overview (like an abstract)

Focus on the BIG PICTURE - what is this paper about at a high level? What is the overall contribution?

CRITICAL: This Description explains WHAT the paper is about (topic/overview), NOT how it was done.

Return ONLY the overview text, no labels or formatting."""
                            
                            # Generate summary - DETAILED PROCESS DESCRIPTION
                            # This explains HOW the research was done
                            summary_prompt = f"""Based on the following research paper information, generate a DETAILED PROCESS DESCRIPTION (Summary) that explains the methodology, approach, techniques, and step-by-step process used in the research.

Title: {title}
Journal: {journal}
Year: {year}
URL: {link}
DOI: {doi if doi else 'Not available'}
PMID: {pmid if pmid else 'Not available'}

Generate a DETAILED PROCESS DESCRIPTION (2-3 sentences, focused on METHODOLOGY) that:
1. Describes the research methodology and experimental approach
2. Explains the techniques, tools, and methods used
3. Details the step-by-step process of how the research was conducted
4. Focuses on HOW the research was done, not what it's about

CRITICAL: This Summary explains HOW the research was done (process/methodology), NOT what it's about.
- Do NOT describe the topic or findings
- Focus on the experimental methods, techniques, and research process
- Explain the methodology and approach used

Return ONLY the process description text, no labels or formatting."""
                            
                            try:
                                # Generate description (high-level overview)
                                desc_response = model.generate_content(desc_prompt)
                                generated_desc = desc_response.text.strip()
                                if generated_desc and len(generated_desc) > 50:
                                    paper['description'] = generated_desc
                                    logger.info(f"Generated description (overview) for paper: {title[:50]}...")
                                
                                # Generate summary (detailed process) - ALWAYS generate separately to ensure it's different
                                summary_response = model.generate_content(summary_prompt)
                                generated_summary = summary_response.text.strip()
                                if generated_summary and len(generated_summary) > 50:
                                    # Double-check that summary is different from description
                                    if generated_desc and generated_summary.lower().strip() == generated_desc.lower().strip():
                                        logger.warning(f"Summary and description are identical for {title[:50]}... Regenerating summary...")
                                        # Regenerate with emphasis on being different
                                        diff_summary_prompt = f"""Generate a SHORT process description (2-3 sentences) for this research paper that explains HOW the research was conducted.

Title: {title}
Journal: {journal}

The Description already says: "{generated_desc}"

Generate a DIFFERENT text that focuses ONLY on:
- The research methodology and experimental approach
- The techniques and methods used
- How the study was conducted

DO NOT describe what the paper is about - that's in the Description.
DO NOT repeat any information from the Description.
Focus ONLY on the research process and methodology.

Return ONLY the process description, no labels."""
                                        diff_response = model.generate_content(diff_summary_prompt)
                                        generated_summary = diff_response.text.strip()
                                    
                                    paper['summary'] = generated_summary
                                    logger.info(f"Generated summary (process) for paper: {title[:50]}...")
                                else:
                                    # Fallback summary
                                    paper['summary'] = f"This research employed comprehensive experimental methodologies to investigate {title}. The study utilized advanced analytical techniques and systematic data collection approaches."
                                
                            except Exception as gen_error:
                                logger.warning(f"Error generating description/summary with Gemini: {gen_error}")
                                # Fallback: create a basic description
                                if not paper.get('description') or paper.get('description') == 'N/A':
                                    # Handle missing journal name
                                    if journal and journal != 'Unknown' and journal.strip():
                                        paper['description'] = f"This research paper from {journal} ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
                                    else:
                                        paper['description'] = f"This research paper ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
                                # Fallback: create a basic summary
                                if not paper.get('summary') or paper.get('summary') == 'N/A' or paper.get('summary', '').strip() == '':
                                    # Handle missing journal name
                                    if journal and journal != 'Unknown' and journal.strip():
                                        paper['summary'] = f"This research paper from {journal} ({year}) employs comprehensive methodologies to investigate {title}. The study utilizes advanced experimental techniques and analytical approaches to examine the underlying mechanisms and processes."
                                    else:
                                        paper['summary'] = f"This research paper ({year}) employs comprehensive methodologies to investigate {title}. The study utilizes advanced experimental techniques and analytical approaches to examine the underlying mechanisms and processes."
                except Exception as e:
                    logger.warning(f"Error in Gemini description generation: {e}")
                    # Fallback: ensure all papers have at least a basic description
                    for paper in papers_still_missing:
                        if not paper.get('description') or paper.get('description') == 'N/A':
                            title = paper.get('title', 'Unknown')
                            journal = paper.get('journal', 'Unknown')
                            year = paper.get('year', 'Unknown')
                            # Handle missing journal name
                            if journal and journal != 'Unknown' and journal.strip():
                                paper['description'] = f"This research paper from {journal} ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
                            else:
                                paper['description'] = f"This research paper ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
            
            # Update titles to include authors in "Title - Author" format
            # But keep authors field separate for metadata display
            for paper in structured_papers:
                if paper.get('authors') and paper.get('authors') != 'N/A' and paper.get('authors').strip():
                    authors = paper['authors']
                    # Format: "Title - Author" (only if not already formatted)
                    if paper.get('title'):
                        # Check if title already ends with the author
                        if not paper['title'].endswith(f" - {authors}"):
                            # Check if title already contains the author (avoid duplication)
                            if authors not in paper['title']:
                                paper['title'] = f"{paper['title']} - {authors}"
                            # If title already has author but in different format, keep it as is
        
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

            # Look for structured format: "Title: [title text]"
            title_match = re.match(r'^Title:\s*(.+)$', line, re.I)
            if title_match:
                if current_paper.get('title'):
                    papers.append(current_paper)
                
                title = title_match.group(1).strip()
                # Clean title from markdown and URLs - TITLE SHOULD BE ONLY THE TITLE
                title = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', title)  # Remove ***text***
                title = re.sub(r'\*\*([^*]+)\*\*', r'\1', title)  # Remove **text**
                title = re.sub(r'\*([^*]+)\*', r'\1', title)  # Remove *text*
                title = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', title)  # Remove markdown links, keep text
                # Remove URLs from title - title should NOT contain URLs
                title = re.sub(r'https?://[^\s\)]+', '', title).strip()
                # Remove common section headers that might be mistaken for titles
                title = re.sub(r'^(ACADEMIC PAPERS|PUBLICATIONS|RESEARCH|PAPER|STUDY|INVESTIGATION)[:\s]*', '', title, flags=re.I)
                # Remove phrases like "Here's the information" or "formatted as requested"
                title = re.sub(r'^(Here\'?s|This is|The following|Formatted|Information)[:\s]*', '', title, flags=re.I)
                # Remove trailing dashes and URLs
                title = re.sub(r'\s*[-–—]\s*https?://.*$', '', title).strip()
                title = re.sub(r'\s*[-–—]\s*$', '', title).strip()
                
                # If title is still suspicious (contains "ACADEMIC", "PUBLICATIONS", etc.), skip it
                if re.search(r'^(ACADEMIC|PUBLICATIONS|PAPERS|RESEARCH|SECTION)', title, re.I):
                    logger.warning(f"Skipping suspicious title that looks like a section header: {title[:100]}")
                    continue
                
                logger.debug(f"Extracted paper title from 'Title:' field: {title[:100]}")
                
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
                continue
            
            # Exclude metadata fields
            is_metadata_field = re.match(r'^[\*\-\•]?\s*(Authors?|Journal|Year|DOI|PMID|Link|Title|Summary|Description|Hyperlink|Direct\s+hyperlink):', line, re.I)
            
            # Fallback: Look for paper titles (lines that look like titles) - but be VERY strict
            # Only if we don't have a title yet and line doesn't start with metadata fields
            if not current_paper.get('title') and len(line) > 30 and not is_metadata_field:
                # Check if line looks like a title (not a summary/description, not a section header)
                is_likely_title = not re.match(r'^(Summary|Description|This|The|It|These|Those|A|An|Here\'?s|ACADEMIC|PUBLICATIONS|PAPERS|RESEARCH|SECTION)\s+', line, re.I)
                is_likely_title = is_likely_title and not re.search(r'^(investigates?|explores?|examines?|discusses?|presents?|describes?|analyzes?|studies?|formatted|information)', line, re.I)
                # Don't accept lines with URLs as titles
                is_likely_title = is_likely_title and 'http' not in line.lower()
                # Don't accept section headers
                is_likely_title = is_likely_title and not re.search(r'ACADEMIC|PUBLICATIONS|PAPERS', line, re.I)
                
                if is_likely_title:
                    # Clean title from markdown and bullet points
                    title = re.sub(r'^[\*\-\•]\s*', '', line).strip()  # Remove leading bullet
                    title = re.sub(r'^\[?\d+\]?\s*\.?\s*', '', title).strip()  # Remove citation numbers like [1] or 1.
                    title = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', title)  # Remove ***text***
                    title = re.sub(r'\*\*([^*]+)\*\*', r'\1', title)  # Remove **text**
                    title = re.sub(r'\*([^*]+)\*', r'\1', title)  # Remove *text*
                    title = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', title)  # Remove markdown links, keep text
                    # Remove URLs from title
                    title = re.sub(r'https?://[^\s\)]+', '', title).strip()
                    # Remove trailing dashes
                    title = re.sub(r'\s*[-–—]\s*$', '', title).strip()
                    
                    # Final check - if it still looks like a section header, skip it
                    if re.search(r'^(ACADEMIC|PUBLICATIONS|PAPERS|RESEARCH|SECTION|Here\'?s|formatted)', title, re.I):
                        logger.debug(f"Skipping line that looks like section header: {title[:100]}")
                        continue
                    
                    logger.debug(f"Extracted paper title (fallback): {title[:100]}")
                    
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
                    continue
            
            if is_metadata_field:
                logger.debug(f"Skipping metadata line: {line[:100]}")
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
                
                year_match = re.match(r'^Year:\s*(.+)$', line, re.I)
                if year_match:
                    year_text = year_match.group(1).strip()
                    # Extract 4-digit year
                    year_extract = re.search(r'(\d{4})', year_text)
                    if year_extract:
                        current_paper['year'] = year_extract.group(1)
                    continue
                else:
                    # Fallback: look for year in any line
                    year_match = re.search(r'(\d{4})', line)
                    if year_match and not current_paper.get('year'):
                        # Check if it's a reasonable year (1900-2100)
                        year_val = int(year_match.group(1))
                        if 1900 <= year_val <= 2100:
                            current_paper['year'] = year_match.group(1)
                
                # Extract DOI - look for "DOI:" prefix first
                doi_match = re.match(r'^DOI:\s*(.+)$', line, re.I)
                if doi_match:
                    doi_text = doi_match.group(1).strip()
                    # Extract DOI pattern (10.xxxx/xxxxx)
                    doi_pattern = re.search(r'(10\.\d+/[^\s\)]+)', doi_text)
                    if doi_pattern:
                        current_paper['doi'] = doi_pattern.group(1)
                    elif doi_text.lower() not in ['not available', 'n/a', 'none', '']:
                        # If it's not "not available", try to extract any DOI-like pattern
                        doi_pattern = re.search(r'(10\.\d+/[^\s\)]+)', doi_text)
                        if doi_pattern:
                            current_paper['doi'] = doi_pattern.group(1)
                    continue
                else:
                    # Fallback: look for DOI pattern in line
                    doi_match = re.search(r'(10\.\d+/[^\s\)]+)', line, re.I)
                    if doi_match and not current_paper.get('doi'):
                        current_paper['doi'] = doi_match.group(1)
                
                # Extract PMID - look for "PMID:" prefix first
                pmid_match = re.match(r'^PMID:\s*(.+)$', line, re.I)
                if pmid_match:
                    pmid_text = pmid_match.group(1).strip()
                    # Extract numeric PMID
                    pmid_pattern = re.search(r'(\d+)', pmid_text)
                    if pmid_pattern and pmid_text.lower() not in ['not available', 'n/a', 'none']:
                        current_paper['pmid'] = pmid_pattern.group(1)
                    continue
                else:
                    # Fallback: look for PMID pattern
                    pmid_match = re.search(r'PMID[:\s]+(\d+)', line, re.I)
                    if pmid_match and not current_paper.get('pmid'):
                        current_paper['pmid'] = pmid_match.group(1)
                
                url_match = re.search(r'(https?://[^\s\)]+)', line)
                if url_match and not current_paper.get('link'):
                    current_paper['link'] = url_match.group(1)
                
                # Extract summary - look for "Summary:" prefix (must be exact match)
                summary_match = re.match(r'^Summary:\s*(.+)$', line, re.I)
                if summary_match:
                    summary_text = summary_match.group(1).strip()
                    # Clean markdown from summary
                    summary_text = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', summary_text)
                    summary_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', summary_text)
                    summary_text = re.sub(r'\*([^*]+)\*', r'\1', summary_text)
                    summary_text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', summary_text)  # Remove markdown links, keep text
                    # If we already have a summary, append (multi-line summary)
                    if current_paper.get('summary'):
                        current_paper['summary'] += ' ' + summary_text
                    else:
                        current_paper['summary'] = summary_text
                    continue
                
                # Extract description - look for "Description:" prefix (must be exact match)
                description_match = re.match(r'^Description:\s*(.+)$', line, re.I)
                if description_match:
                    description_text = description_match.group(1).strip()
                    # Clean markdown from description
                    description_text = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', description_text)
                    description_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', description_text)
                    description_text = re.sub(r'\*([^*]+)\*', r'\1', description_text)
                    description_text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', description_text)  # Remove markdown links, keep text
                    # If we already have a description, append (multi-line description)
                    if current_paper.get('description'):
                        current_paper['description'] += ' ' + description_text
                    else:
                        current_paper['description'] = description_text
                    continue
                
                # Also check for continuation of description (if previous line was Description:)
                # Look for lines that continue the description (not starting with a field name)
                if current_paper.get('description') and not re.match(r'^(Title|Authors?|Journal|Year|DOI|PMID|Hyperlink|Link|Summary|Description|\[):', line, re.I):
                    # Check if this looks like continuation of description (not a new field)
                    # If line doesn't start with a field name and is substantial, it might be description continuation
                    if len(line) > 20 and not line.startswith('[') and not re.match(r'^\d+\.', line):
                        # Append to description
                        clean_line = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', line)
                        clean_line = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_line)
                        clean_line = re.sub(r'\*([^*]+)\*', r'\1', clean_line)
                        clean_line = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', clean_line)
                        current_paper['description'] += ' ' + clean_line
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
                
                # Description (any other meaningful line) - only if we don't have description yet
                # Don't use this as summary or title - it's just additional context
                if len(line) > 20 and not re.match(r'^(Authors?|Journal|Year|DOI|PMID|Link|Summary|Hyperlink|Description|Title):', line, re.I):
                    # Only add to description if we don't have one from "Description:" field
                    if not current_paper.get('description'):
                        # Clean markdown
                        clean_line = re.sub(r'\*\*\*([^*]+)\*\*\*', r'\1', line)
                        clean_line = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_line)
                        clean_line = re.sub(r'\*([^*]+)\*', r'\1', clean_line)
                        clean_line = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', clean_line)
                        current_paper['description'] = clean_line
                    # Don't use random lines as summary - only use "Summary:" field
        
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
            
            # Ensure all required fields are present
            # Description: Use provided description, or generate a basic one if missing
            if not paper.get('description') or paper.get('description', '').strip() == '' or paper.get('description') == 'N/A':
                # Generate a basic description from available info
                title = paper.get('title', 'Unknown')
                journal = paper.get('journal', 'Unknown')
                year = paper.get('year', 'Unknown')
                # Handle missing journal name
                if journal and journal != 'Unknown' and journal.strip() and journal != 'Not specified':
                    paper['description'] = f"This research paper from {journal} ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
                else:
                    paper['description'] = f"This research paper ({year}) discusses {title}. The paper provides insights relevant to protein research and biological mechanisms."
            
            # Summary: Use provided summary, or generate detailed process description if missing
            # CRITICAL: Do NOT copy from description - they must be different
            if not paper.get('summary') or paper.get('summary', '').strip() == '' or paper.get('summary') == 'N/A':
                # Generate a process-oriented summary using Gemini
                try:
                    import google.generativeai as genai
                    gemini_api_key = os.getenv("GEMINI_API_KEY")
                    if gemini_api_key:
                        genai.configure(api_key=gemini_api_key)
                        model = genai.GenerativeModel("gemini-2.0-flash-exp")
                        
                        title = paper.get('title', 'Unknown')
                        journal = paper.get('journal', 'Unknown')
                        year = paper.get('year', 'Unknown')
                        link = paper.get('link', '')
                        doi = paper.get('doi', '')
                        pmid = paper.get('pmid', '')
                        # Get description to ensure summary is different
                        existing_desc = paper.get('description', '')
                        
                        summary_prompt = f"""Based on the following research paper information, generate a DETAILED PROCESS DESCRIPTION (Summary) that explains the methodology, approach, techniques, and step-by-step process used in the research.

Title: {title}
Journal: {journal}
Year: {year}
URL: {link}
DOI: {doi if doi else 'Not available'}
PMID: {pmid if pmid else 'Not available'}

IMPORTANT: The Description field for this paper is: "{existing_desc}"

Generate a DETAILED PROCESS DESCRIPTION (2-3 sentences, focused on METHODOLOGY) that:
1. Describes the research methodology and experimental approach
2. Explains the techniques, tools, and methods used
3. Details the step-by-step process of how the research was conducted
4. Focuses on HOW the research was done, not what it's about

CRITICAL: This Summary MUST be DIFFERENT from the Description. 
- Description explains WHAT the paper is about (overview/topic)
- Summary explains HOW the research was done (process/methodology)
- Do NOT repeat the same information from the Description

Return ONLY the process description text, no labels or formatting."""
                        
                        summary_response = model.generate_content(summary_prompt)
                        generated_summary = summary_response.text.strip()
                        if generated_summary and len(generated_summary) > 50:
                            # Ensure it's different from description
                            if existing_desc and generated_summary.lower() == existing_desc.lower():
                                # If they're the same, generate a different one
                                generated_summary = f"This research employed comprehensive experimental methodologies to investigate {title}. The study utilized advanced analytical techniques and systematic data collection approaches to examine the underlying mechanisms and processes."
                            paper['summary'] = generated_summary
                        else:
                            # Fallback: create a process-oriented summary
                            paper['summary'] = f"This research employed comprehensive experimental methodologies to investigate {title}. The study utilized advanced analytical techniques and systematic data collection approaches to examine the underlying mechanisms and processes."
                except Exception as e:
                    logger.warning(f"Error generating summary with Gemini: {e}")
                    # Fallback: create a process-oriented summary (NOT from description)
                    title = paper.get('title', 'Unknown')
                    journal = paper.get('journal', 'Unknown')
                    year = paper.get('year', 'Unknown')
                    paper['summary'] = f"This research employed comprehensive experimental methodologies to investigate {title}. The study utilized advanced analytical techniques and systematic data collection approaches to examine the underlying mechanisms and processes."
            
            # Ensure hyperlink is at the end (will be displayed last in frontend)
            # The link field is already being extracted, just make sure it's set
            if not paper.get('link'):
                # Try to get from citations if available
                if paper.get('citationNumber') and citations:
                    citation = next((c for c in citations if c.get('number') == paper['citationNumber']), None)
                    if citation and citation.get('url'):
                        paper['link'] = citation['url']
        
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

