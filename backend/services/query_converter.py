"""
Natural Language Query Converter Service
Converts user input (protein ID or natural language) into medical query terms
optimized for protein research and PubMed searches
"""

import os
import logging
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Google Generative AI not installed. Install with: pip install google-generativeai")


class QueryConverterService:
    """Service for converting user queries into medical research queries"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize query converter service
        
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
            try:
                # Use a fast model for query conversion
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Query converter initialized with Gemini API")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model: {e}")
                self.model = None
        else:
            logger.warning("Gemini API not available. Using fallback method.")
            self.model = None
    
    def convert_to_medical_query(
        self, 
        user_input: str,
        protein_info: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Convert user input (protein ID or natural language) into medical query terms
        
        Args:
            user_input: User's input (could be UniProt ID like "P01308" or natural language like "human insulin")
            protein_info: Optional protein information from UniProt (if already fetched)
        
        Returns:
            Dictionary with:
            - medical_query: Medical/biological query terms optimized for research
            - protein_id: Extracted or inferred UniProt ID (if available)
            - keywords: List of key medical/biological terms
            - search_terms: Terms optimized for PubMed/search engines
        """
        if not self.model:
            return self._fallback_conversion(user_input, protein_info)
        
        try:
            # Build context from protein_info if available
            context = ""
            if protein_info:
                context = f"""
Protein Information:
- Name: {protein_info.get('name', 'Unknown')}
- Organism: {protein_info.get('organism', 'Unknown')}
- Gene: {protein_info.get('gene', 'Unknown')}
- Function: {protein_info.get('function', 'Unknown')}
- Keywords: {protein_info.get('keywords', '')}
"""
            
            # Create prompt for medical query conversion
            prompt = f"""You are a biomedical research query expert. Convert the user's input into optimized medical/biological query terms for protein research and PubMed searches.

User Input: "{user_input}"
{context}

Your task:
1. If the input is a UniProt ID (like P01308), identify what protein it represents
2. Extract key medical/biological terms related to the protein
3. Create search-optimized query terms for:
   - PubMed searches
   - Academic research databases
   - Medical literature searches

Return a JSON object with:
- medical_query: A comprehensive medical/biological query string (e.g., "insulin hormone glucose metabolism diabetes mellitus")
- protein_id: The UniProt ID if provided or can be inferred (null if unknown)
- keywords: Array of key medical/biological terms (e.g., ["insulin", "glucose", "diabetes", "metabolism"])
- search_terms: Optimized terms for search engines (e.g., "insulin AND glucose AND metabolism")
- protein_name: The protein name if identified (null if unknown)

Focus on:
- Medical terminology
- Biological processes
- Disease associations
- Therapeutic applications
- Research domains

Example for "P01308" or "human insulin":
{{
  "medical_query": "insulin hormone glucose metabolism diabetes mellitus type 1 type 2",
  "protein_id": "P01308",
  "keywords": ["insulin", "glucose", "diabetes", "metabolism", "hormone", "pancreas", "beta cells"],
  "search_terms": "insulin AND (glucose OR diabetes OR metabolism)",
  "protein_name": "Insulin"
}}

Return ONLY valid JSON, no markdown or explanations.
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
            import json
            result = json.loads(response_text)
            
            # Validate and ensure all fields
            converted = {
                "medical_query": result.get("medical_query", user_input),
                "protein_id": result.get("protein_id"),
                "keywords": result.get("keywords", []),
                "search_terms": result.get("search_terms", result.get("medical_query", user_input)),
                "protein_name": result.get("protein_name")
            }
            
            logger.info(f"Converted query: '{user_input}' -> Medical query: '{converted['medical_query']}'")
            return converted
        
        except Exception as e:
            logger.error(f"Error in query conversion: {e}")
            return self._fallback_conversion(user_input, protein_info)
    
    def _fallback_conversion(
        self, 
        user_input: str,
        protein_info: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Fallback conversion when Gemini is not available
        """
        # Check if input looks like a UniProt ID
        uniprot_pattern = r'^[A-Z0-9]{6,10}$'
        import re
        is_uniprot_id = bool(re.match(uniprot_pattern, user_input.upper()))
        
        if is_uniprot_id:
            protein_id = user_input.upper()
            # Use protein_info if available
            if protein_info:
                name = protein_info.get('name', protein_id)
                keywords = [name.lower()]
                if protein_info.get('gene'):
                    keywords.append(protein_info['gene'].lower())
                medical_query = f"{name} {protein_info.get('function', '')}"
            else:
                medical_query = protein_id
                keywords = [protein_id]
                name = None
        else:
            # Natural language input
            protein_id = None
            medical_query = user_input
            keywords = user_input.lower().split()
            name = None
        
        return {
            "medical_query": medical_query,
            "protein_id": protein_id,
            "keywords": keywords,
            "search_terms": medical_query,
            "protein_name": name
        }

