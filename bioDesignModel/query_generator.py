"""
LLM-Powered UniProt Query Generator
-----------------------------------
Converts natural language descriptions into UniProt API queries
to find relevant proteins.
"""

import logging
import json
import re
from typing import Optional, Dict, List
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

logger = logging.getLogger(__name__)


class UniProtQueryGenerator:
    """
    Uses LLM to convert natural language to UniProt queries.
    
    Example:
        Input: "Find proteins that can survive in extreme heat"
        Output: "keyword:KW-0809 AND reviewed:true"
    """
    
    def __init__(self, model_name: str = "microsoft/biogpt", use_openai: bool = False, api_key: Optional[str] = None):
        """
        Initialize the query generator.
        
        Args:
            model_name: Hugging Face model name for local LLM
            use_openai: If True, use OpenAI API instead of local model
            api_key: OpenAI API key (required if use_openai=True)
        """
        self.use_openai = use_openai
        
        if use_openai:
            try:
                import os
                from openai import OpenAI
                if not api_key:
                    api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    raise ValueError("OpenAI API key required when use_openai=True")
                self.client = OpenAI(api_key=api_key)
                logger.info("Using OpenAI API for query generation")
            except ImportError:
                raise ImportError("OpenAI package required. Install with: pip install openai")
        else:
            try:
                import torch
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                logger.info(f"Loading local model {model_name} on {self.device}")
                self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.model = AutoModelForCausalLM.from_pretrained(model_name).to(self.device)
                self.generator = pipeline(
                    "text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device=0 if self.device == "cuda" else -1
                )
            except ImportError as e:
                logger.warning(f"Could not load local model {model_name}: {e}")
                logger.warning("Falling back to keyword-based query generation")
                self.model = None
                self.tokenizer = None
                self.generator = None
    
    def natural_language_to_query(
        self,
        user_query: str,
        max_results: int = 100,
        reviewed_only: bool = True
    ) -> str:
        """
        Convert natural language to UniProt query.
        
        Args:
            user_query: Natural language description (e.g., "proteins that survive extreme heat")
            max_results: Maximum number of results (not used in query, but for context)
            reviewed_only: Whether to only search reviewed proteins
        
        Returns:
            UniProt query string
        """
        if self.use_openai:
            return self._openai_query_generation(user_query, max_results, reviewed_only)
        else:
            return self._local_query_generation(user_query, max_results, reviewed_only)
    
    def _openai_query_generation(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> str:
        """Generate query using OpenAI API."""
        system_prompt = """You are a UniProt database query expert. Convert natural language protein search requests into valid UniProt query syntax.

UniProt Query Syntax Guide:
- reviewed:true - Only manually reviewed proteins
- length:[X TO Y] - Protein length range
- organism_id:9606 - Specific organism (9606 = human)
- keyword:KW-XXXX - Protein keywords (e.g., KW-0809 = thermostable)
- ec:* - All enzymes
- ec:1.1.1.1 - Specific enzyme
- name:protein_name - Search by name
- gene:gene_name - Search by gene name

Common keywords:
- KW-0809: Thermostable
- KW-0472: Membrane protein
- KW-0329: Signal peptide
- KW-0044: DNA-binding
- KW-0135: Enzyme

Examples:
Input: "Find heat-resistant proteins"
Output: "keyword:KW-0809 AND reviewed:true"

Input: "Find human enzymes that break down proteins"
Output: "organism_id:9606 AND ec:* AND reviewed:true"

Input: "Find membrane proteins between 100 and 500 amino acids"
Output: "keyword:KW-0472 AND length:[100 TO 500] AND reviewed:true"

Return ONLY the UniProt query string, nothing else."""

        user_message = f"""Convert this natural language request to a UniProt query:

"{user_query}"

Requirements:
- Maximum results: {max_results}
- Reviewed only: {reviewed_only}
- Return only the query string"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using cheaper model for query generation
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,  # Lower temperature for more consistent queries
                max_tokens=200
            )
            
            query = response.choices[0].message.content.strip()
            # Clean up the query (remove markdown, quotes, etc.)
            query = self._clean_query(query)
            
            # Add reviewed filter if requested
            if reviewed_only and "reviewed:" not in query:
                if "AND" in query or "OR" in query:
                    query = f"({query}) AND reviewed:true"
                else:
                    query = f"{query} AND reviewed:true"
            
            logger.info(f"Generated UniProt query: {query}")
            return query
            
        except Exception as e:
            logger.error(f"Error generating query with OpenAI: {e}")
            # Fallback to simple keyword-based query
            return self._fallback_query(user_query, reviewed_only)
    
    def _local_query_generation(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> str:
        """Generate query using local LLM."""
        # If model not loaded (due to missing dependencies), use fallback
        if self.generator is None:
            logger.info("Using fallback query generation (LLM not available)")
            return self._fallback_query(user_query, reviewed_only)
        
        prompt = f"""Convert this protein search request to UniProt query syntax:

"{user_query}"

UniProt query examples:
- Heat-resistant: keyword:KW-0809 AND reviewed:true
- Human enzymes: organism_id:9606 AND ec:* AND reviewed:true
- Membrane proteins: keyword:KW-0472 AND reviewed:true

Query:"""
        
        try:
            response = self.generator(
                prompt,
                max_length=200,
                temperature=0.3,
                num_return_sequences=1
            )[0]["generated_text"]
            
            # Extract query from response
            query = response.split("Query:")[-1].strip()
            query = self._clean_query(query)
            
            # Add reviewed filter if requested
            if reviewed_only and "reviewed:" not in query:
                if "AND" in query or "OR" in query:
                    query = f"({query}) AND reviewed:true"
                else:
                    query = f"{query} AND reviewed:true"
            
            logger.info(f"Generated UniProt query: {query}")
            return query
            
        except Exception as e:
            logger.error(f"Error generating query with local model: {e}")
            return self._fallback_query(user_query, reviewed_only)
    
    def _clean_query(self, query: str) -> str:
        """Clean and validate the generated query."""
        # Remove markdown code blocks
        query = re.sub(r'```[a-z]*\n?', '', query)
        query = re.sub(r'```', '', query)
        
        # Remove quotes
        query = query.strip('"').strip("'").strip()
        
        # Remove common prefixes
        query = re.sub(r'^(query|Query|QUERY):\s*', '', query, flags=re.IGNORECASE)
        
        # Remove example text that might be included (lines with dashes)
        # Remove lines that look like examples: "- keyword:KW-XXXX AND reviewed:true"
        lines = query.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            # Skip lines that are examples (start with dash and contain "keyword:" or "organism")
            if line.startswith('-') and ('keyword:' in line.lower() or 'organism' in line.lower()):
                continue
            # Skip lines that are just separators or examples
            if line.startswith('-') and len(line) > 50:  # Long example lines
                continue
            if line and not line.startswith('-'):  # Keep non-example lines
                cleaned_lines.append(line)
        
        query = ' '.join(cleaned_lines)
        
        # Remove multiple spaces
        query = re.sub(r'\s+', ' ', query)
        
        # Remove trailing punctuation that might break the query
        query = query.rstrip('.,;:')
        
        # Extract first valid query if multiple are present
        # Look for patterns like "keyword:" or "organism_id:" to find actual query
        if 'keyword:' in query or 'organism_id:' in query or 'ec:' in query:
            # Try to extract just the query part (before any dashes or example text)
            parts = re.split(r'\s*-\s*', query)
            for part in parts:
                if any(kw in part for kw in ['keyword:', 'organism_id:', 'ec:', 'length:', 'reviewed:']):
                    query = part.strip()
                    break
        
        # Fix common spacing issues in keywords
        query = re.sub(r'organism\s+_?\s*id\s*:', 'organism_id:', query, flags=re.IGNORECASE)
        query = re.sub(r'ec\s*:', 'ec:', query, flags=re.IGNORECASE)
        query = re.sub(r'keyword\s*:', 'keyword:', query, flags=re.IGNORECASE)
        query = re.sub(r'length\s*:', 'length:', query, flags=re.IGNORECASE)
        query = re.sub(r'reviewed\s*:', 'reviewed:', query, flags=re.IGNORECASE)
        
        # Remove extra spaces around operators
        query = re.sub(r'\s+AND\s+', ' AND ', query, flags=re.IGNORECASE)
        query = re.sub(r'\s+OR\s+', ' OR ', query, flags=re.IGNORECASE)
        
        return query.strip()
    
    def _fallback_query(self, user_query: str, reviewed_only: bool) -> str:
        """
        Fallback query generation using keyword matching.
        Used when LLM fails or is unavailable.
        """
        query_lower = user_query.lower()
        query_parts = []
        
        # Keyword mappings
        keyword_map = {
            "heat": "keyword:KW-0809",  # Thermostable
            "temperature": "keyword:KW-0809",
            "thermostable": "keyword:KW-0809",
            "membrane": "keyword:KW-0472",
            "enzyme": "ec:*",
            "dna": "keyword:KW-0044",  # DNA-binding
            "signal": "keyword:KW-0329",  # Signal peptide
        }
        
        # Check for keywords
        for word, keyword in keyword_map.items():
            if word in query_lower:
                query_parts.append(keyword)
        
        # Check for organism mentions
        if "human" in query_lower:
            query_parts.append("organism_id:9606")
        elif "mouse" in query_lower or "murine" in query_lower:
            query_parts.append("organism_id:10090")
        elif "yeast" in query_lower:
            query_parts.append("organism_id:559292")
        
        # Check for length mentions
        length_match = re.search(r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:amino|aa|residue)', query_lower)
        if length_match:
            start = length_match.group(1)
            end = length_match.group(2) or "10000"
            query_parts.append(f"length:[{start} TO {end}]")
        
        # Build query
        if query_parts:
            query = " AND ".join(query_parts)
        else:
            # Generic search by name if no keywords found
            # Extract potential protein/gene names
            words = [w for w in query_lower.split() if len(w) > 3]
            if words:
                query = f"name:{words[0]}"
            else:
                query = "reviewed:true"  # Fallback to all reviewed
        
        # Add reviewed filter
        if reviewed_only and "reviewed:" not in query:
            query = f"{query} AND reviewed:true"
        elif not reviewed_only and "reviewed:" in query:
            query = query.replace(" AND reviewed:true", "").replace("reviewed:true AND ", "")
        
        logger.warning(f"Using fallback query: {query}")
        return query


def search_proteins_from_natural_language(
    natural_language_query: str,
    size: int = 100,
    use_openai: bool = False,
    api_key: Optional[str] = None,
    reviewed_only: bool = True
):
    """
    High-level function: Convert natural language to UniProt query and fetch proteins.
    
    Args:
        natural_language_query: Natural language description
        size: Number of proteins to fetch
        use_openai: Use OpenAI API for query generation
        api_key: OpenAI API key
        reviewed_only: Only search reviewed proteins
    
    Returns:
        Tuple of (uniprot_query, dataset)
    """
    from .dataloader import create_protein_dataset
    
    # Generate query from natural language
    query_gen = UniProtQueryGenerator(use_openai=use_openai, api_key=api_key)
    uniprot_query = query_gen.natural_language_to_query(
        natural_language_query,
        max_results=size,
        reviewed_only=reviewed_only
    )
    
    # Fetch proteins using the generated query
    dataset = create_protein_dataset(
        query=uniprot_query,
        size=size
    )
    
    return uniprot_query, dataset


# Example usage
if __name__ == "__main__":
    import os
    
    logging.basicConfig(level=logging.INFO)
    
    # Example 1: Using local model
    print("=" * 60)
    print("Example 1: Local LLM Query Generation")
    print("=" * 60)
    
    query_gen = UniProtQueryGenerator(use_openai=False)
    
    test_queries = [
        "Find proteins that can survive in extreme heat",
        "Find human enzymes that break down proteins",
        "Find membrane proteins between 100 and 500 amino acids"
    ]
    
    for query in test_queries:
        print(f"\nNatural Language: {query}")
        uniprot_query = query_gen.natural_language_to_query(query)
        print(f"UniProt Query: {uniprot_query}")
    
    # Example 2: Using OpenAI (if API key available)
    if os.getenv("OPENAI_API_KEY"):
        print("\n" + "=" * 60)
        print("Example 2: OpenAI Query Generation")
        print("=" * 60)
        
        query_gen_openai = UniProtQueryGenerator(use_openai=True)
        query = "Find heat-resistant proteins from bacteria"
        uniprot_query = query_gen_openai.natural_language_to_query(query)
        print(f"Natural Language: {query}")
        print(f"UniProt Query: {uniprot_query}")
    
    # Example 3: End-to-end search
    print("\n" + "=" * 60)
    print("Example 3: End-to-End Protein Search")
    print("=" * 60)
    
    uniprot_query, dataset = search_proteins_from_natural_language(
        "Find thermostable enzymes",
        size=10
    )
    
    print(f"Generated Query: {uniprot_query}")
    print(f"Found {len(dataset)} proteins")
    print(f"Sample: {dataset[0]}")

