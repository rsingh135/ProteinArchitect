"""
Agentic Research Service using Dedalus Labs
Comprehensive protein research using AI agents with web search capabilities
"""

import asyncio
import logging
from typing import Dict, Optional, List
from dotenv import load_dotenv
import os

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
except ImportError:
    DEDALUS_AVAILABLE = False
    logging.warning("dedalus-labs not installed. Install with: pip install dedalus-labs")

load_dotenv()

logger = logging.getLogger(__name__)

# Supported model constants
SUPPORTED_MODELS = {
    "gpt4": "openai/gpt-4.1",
    "gpt4.1": "openai/gpt-4.1",
    "gpt5": "openai/gpt-5-mini",
    "gemini": "google/gemini-1.5-pro",
    "gemini-pro": "google/gemini-1.5-pro",
    "gemini-1.5-pro": "google/gemini-1.5-pro",
    "gemini-1.5-flash": "google/gemini-1.5-flash",
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
        
        # Initialize client with extended timeout for long-running research tasks
        # Research can take 5-10 minutes, so we need a longer timeout
        import httpx
        # Set timeout to 15 minutes (900 seconds) for read operations
        # This allows comprehensive research tasks to complete
        timeout = httpx.Timeout(
            connect=60.0,  # 1 minute to establish connection
            read=900.0,    # 15 minutes to read response (for long-running research)
            write=60.0,    # 1 minute to write request
            pool=60.0      # 1 minute to get connection from pool
        )
        
        # Create httpx client with extended timeout
        http_client = httpx.AsyncClient(timeout=timeout)
        
        # Initialize Dedalus client with custom HTTP client
        # AsyncDedalus() automatically uses DEDALUS_API_KEY from environment
        self.client = AsyncDedalus(http_client=http_client)
        self.runner = DedalusRunner(self.client)
        logger.info("AgenticResearchService initialized (using Dedalus Labs API with Gemini as default, 15min timeout)")
    
    def _resolve_model(self, model: str) -> str:
        """
        Resolve model alias to full model string.
        
        Args:
            model: Model string or alias
        
        Returns:
            Full model string (e.g., "google/gemini-1.5-pro")
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
    
    async def research_protein(
        self,
        protein_id: str,
        model: str = "google/gemini-1.5-pro",
        include_novel: bool = True,
        months_recent: int = 6
    ) -> Dict[str, any]:
        """
        Conduct comprehensive research on a protein using AI agents.
        
        Args:
            protein_id: UniProt protein ID (e.g., "P01308" for insulin)
            model: Model to use for research. Can be:
                   - Full model string: "google/gemini-1.5-pro", "google/gemini-1.5-flash", "openai/gpt-4.1"
                   - Short alias: "gemini", "gemini-pro", "gemini-1.5-flash", "gpt4", "gpt4.1"
                   Default: "google/gemini-1.5-pro" (uses Gemini via Dedalus Labs)
            include_novel: Whether to include novel/recent research section
            months_recent: Number of months to consider for "novel" research
        
        Returns:
            Dictionary with structured research results including:
            - citations: List of citations with hyperlinks
            - papers: Academic papers section
            - use_cases: Common use cases section
            - drug_development: Drug development references
            - novel_research: Novel/recent research (if include_novel=True)
            - summary: AI-generated summary
            - raw_output: Full agent response
        """
        # Resolve model alias if needed
        model = self._resolve_model(model)
        logger.info(f"Starting comprehensive research for protein: {protein_id} using model: {model}")
        
        # Construct comprehensive research prompt
        research_prompt = self._build_research_prompt(
            protein_id, include_novel, months_recent
        )
        
        try:
            # Run the research agent with multiple MCP servers
            # Based on Dedalus Labs docs: runner.run() accepts input, model, and mcp_servers
            # Note: Using only non-conflicting servers to avoid duplicate tool name errors
            result = await self.runner.run(
                input=research_prompt,
                model=model,
                mcp_servers=[
                    "windsor/exa-search-mcp",   # Semantic search engine for academic content
                    "windsor/brave-search-mcp"  # Privacy-focused web search
                ]
            )
            
            # Access final_output from result (per Dedalus Labs Runner API)
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
            
            # Check if it's an HTML error response (Cloudflare 504)
            if "<!DOCTYPE html>" in error_msg or "Gateway time-out" in error_msg or "504" in error_msg:
                raise HTTPException(
                    status_code=504,
                    detail=(
                        "Gateway timeout: The Dedalus Labs API server timed out. "
                        "This happens when research tasks take too long (>100 seconds). "
                        "Try: 1) Simplifying the query, 2) Using a faster model (gemini-1.5-flash), "
                        "3) Reducing research scope (set include_novel=False), or 4) Retrying later."
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
            
            # Handle other errors
            raise HTTPException(
                status_code=500,
                detail=f"Research failed: {error_msg[:500]}"
            )
    
    def _build_research_prompt(
        self,
        protein_id: str,
        include_novel: bool,
        months_recent: int
    ) -> str:
        """
        Build a comprehensive research prompt for the AI agent.
        
        Args:
            protein_id: UniProt protein ID
            include_novel: Whether to include novel research section
            months_recent: Months to consider for novel research
        
        Returns:
            Formatted research prompt string
        """
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
        
        prompt = f"""I need to conduct COMPREHENSIVE research on the protein with UniProt ID: {protein_id}

Please help me gather detailed information efficiently. Be thorough but prioritize speed to avoid timeouts.

REQUIREMENTS:
- Search academic databases, PubMed, bioRxiv, and scientific sources
- Use semantic search to find relevant papers
- Include direct hyperlinks to all sources cited
- Focus on quality over quantity - aim for 10-15 key sources rather than exhaustive lists

RESEARCH SECTIONS (provide detailed information for each):

1. ACADEMIC PAPERS & PUBLICATIONS:
   - Find peer-reviewed research papers mentioning this protein
   - Include papers from high-impact journals (Nature, Science, Cell, etc.)
   - Search PubMed, bioRxiv, arXiv, and other preprint servers
   - Include papers on structure, function, mechanism, interactions
   - Provide: Title, Authors, Journal, Year, DOI/PMID, and direct hyperlink
   - Prioritize recent and high-impact publications
   - Include 5-8 key papers with full citations (prioritize recent and high-impact)

2. USE CASES & APPLICATIONS:
   - Find the MOST COMMON and well-established use cases for this protein
   - Search for clinical applications, therapeutic uses, diagnostic applications
   - Look for industrial applications, research tools, biotechnology uses
   - Include information from clinical trials databases, FDA approvals
   - Provide specific examples of how this protein is used in practice
   - Include any approved drugs or therapies based on this protein
   - Cite sources with hyperlinks for each use case

3. DRUG DEVELOPMENT & THERAPEUTICS:
   - Search for drugs targeting or using this protein
   - Find clinical trials involving this protein (ClinicalTrials.gov)
   - Look for FDA/EMA approvals related to this protein
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
   - Provide a detailed AI-generated summary synthesizing all findings
   - Highlight key biological functions, mechanisms, and importance
   - Summarize therapeutic potential and current applications
   - Discuss research trends and future directions
   - Include any controversies or conflicting findings
   - Make connections between different research areas

OUTPUT FORMAT:
- Start with a CITATIONS section listing ALL hyperlinks used (numbered list)
- Then provide each section clearly labeled
- For each citation, include: [Number] Title/Description - Hyperlink
- Use markdown formatting for readability
- Ensure ALL sources are cited with working hyperlinks
- Be efficient - aim for 10-15 citations with key information
- Prioritize the most important and recent sources

IMPORTANT:
- Use semantic search to find relevant content, not just exact matches
- Cross-reference information from multiple sources
- Prioritize recent, high-quality, peer-reviewed sources
- Include both established knowledge and cutting-edge research
- Be comprehensive - this is a thorough research task, not a quick lookup

Protein ID: {protein_id}
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
        
        return {
            "protein_id": protein_id,
            "citations": citations,
            "papers": papers or "No papers section found",
            "use_cases": use_cases or "No use cases section found",
            "drug_development": drug_dev or "No drug development section found",
            "research_references": research_refs or "No research references section found",
            "novel_research": novel_research or (None if not include_novel else "No novel research section found"),
            "summary": summary or "No summary section found",
            "raw_output": raw_output
        }
    
    def _extract_citations(self, text: str) -> List[Dict[str, str]]:
        """Extract citations with hyperlinks from the text."""
        citations = []
        lines = text.split('\n')
        
        in_citations = False
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect citations section
            if "CITATION" in line.upper() or (line.startswith('[') and 'http' in line):
                in_citations = True
            
            if in_citations:
                # Look for hyperlinks
                if 'http' in line:
                    # Try to extract citation info
                    import re
                    # Match patterns like [1] Title - http://...
                    match = re.search(r'\[(\d+)\]\s*(.+?)\s*-\s*(https?://[^\s]+)', line)
                    if match:
                        citations.append({
                            "number": match.group(1),
                            "title": match.group(2),
                            "url": match.group(3)
                        })
                    else:
                        # Just extract URL
                        url_match = re.search(r'(https?://[^\s]+)', line)
                        if url_match:
                            citations.append({
                                "number": str(len(citations) + 1),
                                "title": line.replace(url_match.group(1), "").strip(),
                                "url": url_match.group(1)
                            })
        
        return citations if citations else [{"number": "1", "title": "See raw output for citations", "url": ""}]
    
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


# Async wrapper function for easy use
async def research_protein_async(
    protein_id: str,
    model: str = "google/gemini-1.5-pro",
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
            print("Using Gemini 1.5 Pro model...")
            results = await service.research_protein(
                protein_id=protein_id,
                model="gemini",  # Can also use "google/gemini-1.5-pro" or "gemini-pro"
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

