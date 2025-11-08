"""
Gemini API Service for Natural Language Protein Search
Converts natural language queries to UniProt protein IDs
"""

import os
import logging
from typing import Dict, List, Optional
import requests
import json

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Google Generative AI not installed. Install with: pip install google-generativeai")


class GeminiProteinSearchService:
    """Service for searching proteins using Gemini API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini service
        
        Args:
            api_key: Gemini API key (if None, will try to get from environment)
        """
        if api_key:
            self.api_key = api_key
        else:
            self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError("Gemini API key required. Set GEMINI_API_KEY environment variable or pass api_key parameter")
        
        if GEMINI_AVAILABLE:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("Gemini API initialized successfully")
        else:
            logger.warning("Gemini API not available. Using fallback method.")
            self.model = None
    
    def search_proteins(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search for proteins using natural language query
        
        Args:
            query: Natural language query (e.g., "human insulin")
            max_results: Maximum number of results to return
        
        Returns:
            List of protein dictionaries with uniprot_id, name, description
        """
        if not self.model:
            return self._fallback_search(query, max_results)
        
        try:
            # Create prompt for Gemini
            prompt = f"""You are a protein database expert. Given a natural language query about a protein, return a list of relevant UniProt protein IDs with their names and brief descriptions.

Query: "{query}"

Please return a JSON array of proteins, each with:
- uniprot_id: The UniProt ID (e.g., "P01308")
- name: The protein name (e.g., "Insulin")
- description: A brief description (e.g., "Hormone that regulates glucose metabolism")
- gene_name: The gene name if available (e.g., "INS")

Return up to {max_results} most relevant proteins. Format as valid JSON only, no markdown or explanations.

Example format:
[
  {{
    "uniprot_id": "P01308",
    "name": "Insulin",
    "description": "Hormone that regulates glucose metabolism",
    "gene_name": "INS"
  }}
]
"""
            
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up response (remove markdown code blocks if present)
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Parse JSON
            proteins = json.loads(response_text)
            
            # Validate and format results
            results = []
            for protein in proteins[:max_results]:
                if "uniprot_id" in protein:
                    results.append({
                        "uniprot_id": protein["uniprot_id"],
                        "name": protein.get("name", ""),
                        "description": protein.get("description", ""),
                        "gene_name": protein.get("gene_name", ""),
                        "score": protein.get("score", 1.0)
                    })
            
            logger.info(f"Found {len(results)} proteins for query: {query}")
            return results
        
        except Exception as e:
            logger.error(f"Error in Gemini search: {e}")
            return self._fallback_search(query, max_results)
    
    def _fallback_search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Fallback search using UniProt API directly
        """
        try:
            # Simple keyword search on UniProt
            url = f"https://www.uniprot.org/uniprot/?query={query}&format=json&limit={max_results}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for entry in data.get("results", [])[:max_results]:
                    results.append({
                        "uniprot_id": entry.get("primaryAccession", ""),
                        "name": entry.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", ""),
                        "description": entry.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", ""),
                        "gene_name": entry.get("genes", [{}])[0].get("geneName", {}).get("value", ""),
                        "score": 1.0
                    })
                
                return results
        
        except Exception as e:
            logger.error(f"Error in fallback search: {e}")
        
        # Ultimate fallback: return some common proteins
        return self._get_fallback_proteins(max_results)
    
    def _get_fallback_proteins(self, max_results: int = 5) -> List[Dict]:
        """Return common fallback proteins for demo purposes"""
        import random
        fallback_proteins = [
            {"uniprot_id": "P01308", "name": "Insulin", "description": "Hormone that regulates glucose metabolism", "gene_name": "INS", "score": 1.0},
            {"uniprot_id": "P04637", "name": "Cellular tumor antigen p53", "description": "Tumor suppressor protein", "gene_name": "TP53", "score": 1.0},
            {"uniprot_id": "P00520", "name": "ABL1", "description": "Tyrosine-protein kinase", "gene_name": "ABL1", "score": 1.0},
            {"uniprot_id": "P15056", "name": "BRAF", "description": "Serine/threonine-protein kinase", "gene_name": "BRAF", "score": 1.0},
            {"uniprot_id": "P08238", "name": "Heat shock protein HSP 90-alpha", "description": "Molecular chaperone", "gene_name": "HSP90AA1", "score": 1.0},
            {"uniprot_id": "P03372", "name": "Estrogen receptor", "description": "Nuclear hormone receptor", "gene_name": "ESR1", "score": 1.0},
            {"uniprot_id": "P04150", "name": "Glucocorticoid receptor", "description": "Nuclear hormone receptor", "gene_name": "NR3C1", "score": 1.0},
            {"uniprot_id": "P10275", "name": "Androgen receptor", "description": "Nuclear hormone receptor", "gene_name": "AR", "score": 1.0}
        ]
        # Return random subset for variety
        return random.sample(fallback_proteins, min(max_results, len(fallback_proteins)))


def get_random_protein_from_hint(hint_file: str = "model/HomoSapiens_binary_hq.txt") -> str:
    """Get a random protein ID from HINT dataset as fallback"""
    try:
        import pandas as pd
        import random
        
        df = pd.read_csv(hint_file, sep='\t')
        # Get a random protein from the dataset
        random_row = df.sample(n=1)
        return random_row['Uniprot_A'].values[0]
    except Exception as e:
        logger.error(f"Error getting random protein: {e}")
        # Ultimate fallback
        return "P01308"  # Insulin

