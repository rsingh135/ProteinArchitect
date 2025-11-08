"""
LLM-Powered UniProt Query Generator
-----------------------------------
Converts natural language descriptions into UniProt API queries
to find relevant proteins.
"""

import logging
import json
import re
import os
from typing import Optional, Dict, List
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Try to load .env file if dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, will use environment variables directly

logger = logging.getLogger(__name__)


class UniProtQueryGenerator:
    """
    Uses LLM to convert natural language to UniProt queries.
    
    Example:
        Input: "Find proteins that can survive in extreme heat"
        Output: "keyword:KW-0809 AND reviewed:true"
    """
    
    def __init__(
        self, 
        model_name: str = "microsoft/biogpt", 
        use_openai: bool = False, 
        use_xai: bool = False,
        api_key: Optional[str] = None,
        xai_model: str = "grok-3"  # xAI model: "grok-3" (grok-beta deprecated), "grok-2-1212", "grok-2", etc.
    ):
        """
        Initialize the query generator.
        
        Args:
            model_name: Hugging Face model name for local LLM
            use_openai: If True, use OpenAI API instead of local model
            use_xai: If True, use xAI (Grok) API instead of local model
            api_key: API key (OpenAI or xAI, depending on which is enabled)
            xai_model: xAI model name (default: "grok-beta", also supports "grok-2-1212", "grok-2")
        """
        self.use_openai = use_openai
        self.use_xai = use_xai
        self.xai_model = xai_model
        
        # Validate that only one API is used at a time
        if use_xai and use_openai:
            raise ValueError("Cannot use both xAI and OpenAI. Choose one.")
        
        if use_xai:
            try:
                import requests
                if not api_key:
                    api_key = os.getenv("XAI_API_KEY")
                # Check if key is empty string (common .env issue)
                if not api_key or api_key.strip() == "":
                    raise ValueError(
                        "xAI API key required when use_xai=True. "
                        "Set XAI_API_KEY in .env file or environment variable. "
                        "Get your key from: https://x.ai"
                    )
                self.xai_api_key = api_key.strip()
                self.xai_base_url = "https://api.x.ai/v1"
                logger.info("Using xAI (Grok) API for query generation")
            except ValueError:
                raise  # Re-raise ValueError as-is
            except Exception as e:
                raise ImportError(f"xAI API setup failed: {e}")
        elif use_openai:
            try:
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
        Convert natural language to UniProt query via medical term extraction.
        
        Two-step process:
        1. Extract medical terms, traits, and biological concepts from natural language
        2. Convert extracted terms to UniProt query syntax
        
        Args:
            user_query: Natural language description (e.g., "proteins that survive extreme heat")
            max_results: Maximum number of results (not used in query, but for context)
            reviewed_only: Whether to only search reviewed proteins
        
        Returns:
            UniProt query string
        """
        print(f"\n[DEBUG] =========================================")
        print(f"[DEBUG] Medical Term Extraction & Query Generation")
        print(f"[DEBUG] =========================================")
        print(f"[DEBUG] Step 1: Extracting medical terms from: '{user_query}'")
        print(f"[DEBUG] Using LLM: {'xAI (Grok)' if self.use_xai else 'OpenAI' if self.use_openai else 'Local (BioGPT)'}")
        
        # Step 1: Extract medical terms and traits
        medical_terms = self._extract_medical_terms(user_query, max_results, reviewed_only)
        
        print(f"[DEBUG] Step 2: Converting medical terms to UniProt query")
        print(f"[DEBUG] Extracted terms: {medical_terms}")
        
        # Step 2: Convert medical terms to UniProt query
        uniprot_query = self._medical_terms_to_uniprot_query(medical_terms, reviewed_only)
        
        print(f"[DEBUG] =========================================")
        print(f"[DEBUG] Final UniProt Query: {uniprot_query}")
        print(f"[DEBUG] =========================================\n")
        
        return uniprot_query
    
    def _extract_medical_terms(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> Dict[str, any]:
        """
        Extract medical terms, traits, and biological concepts from natural language.
        
        Returns a dictionary with:
        - organism: organism name or scientific name
        - organism_id: NCBI taxonomy ID if known
        - keywords: list of protein keywords (e.g., "thermostable", "membrane", "enzyme")
        - traits: list of functional traits (e.g., "heat-resistant", "antimicrobial")
        - enzyme_class: enzyme classification if mentioned
        - length_range: protein length range if specified
        - disease_related: boolean if disease-related
        - medical_context: additional medical/biological context
        """
        if self.use_xai:
            return self._extract_medical_terms_xai(user_query, max_results, reviewed_only)
        elif self.use_openai:
            return self._extract_medical_terms_openai(user_query, max_results, reviewed_only)
        else:
            return self._extract_medical_terms_local(user_query, max_results, reviewed_only)
    
    def _extract_medical_terms_xai(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> Dict[str, any]:
        """Extract medical terms using xAI (Grok) API."""
        import requests
        import json
        
        system_prompt = """You are a biomedical expert that extracts structured medical and biological information from natural language protein search queries.

Extract the following information from the user's query and return it as JSON:

{
  "organism": "organism name or scientific name (e.g., 'Homo sapiens', 'E. coli', 'S. cerevisiae') or null if not specified",
  "organism_id": "NCBI taxonomy ID if known (e.g., 9606 for human) or null",
  "keywords": ["thermostable", "membrane", "enzyme", "antimicrobial", etc.],
  "traits": ["heat-resistant", "disease-associated", "therapeutic", etc.],
  "enzyme_class": "all" or specific EC number or null,
  "length_range": {"min": 100, "max": 500} or null,
  "disease_related": true or false,
  "medical_context": "brief description of medical/biological context"
}

Extract ANY organism mentioned - don't limit to specific ones. Use the actual organism name or scientific name from the query.

Common keywords to recognize:
- Heat/temperature resistant → "thermostable"
- Membrane proteins → "membrane"
- Enzymes → "enzyme"
- DNA-binding → "dna-binding"
- Antimicrobial → "antimicrobial"
- Signal peptide → "signal-peptide"
- Disease-related → "disease-mutation"

Return ONLY valid JSON, nothing else."""

        user_message = f"""Extract medical and biological information from this protein search query:

"{user_query}"

Return the information as JSON."""

        try:
            response = requests.post(
                f"{self.xai_base_url}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.xai_api_key}"
                },
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "model": self.xai_model,
                    "stream": False,
                    "temperature": 0.2,  # Lower temperature for more structured output
                    "max_tokens": 300
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            raw_output = result["choices"][0]["message"]["content"].strip()
            print(f"[DEBUG] xAI Medical Terms Extraction Raw Output: {raw_output}")
            
            # Try to extract JSON from the response
            # Remove markdown code blocks if present
            if "```json" in raw_output:
                raw_output = raw_output.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_output:
                raw_output = raw_output.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            try:
                medical_terms = json.loads(raw_output)
                print(f"[DEBUG] Parsed medical terms: {json.dumps(medical_terms, indent=2)}")
                return medical_terms
            except json.JSONDecodeError:
                print(f"[DEBUG] Failed to parse JSON, using fallback extraction")
                return self._fallback_medical_extraction(user_query)
                
        except Exception as e:
            logger.error(f"Error extracting medical terms with xAI: {e}")
            return self._fallback_medical_extraction(user_query)
    
    def _extract_medical_terms_openai(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> Dict[str, any]:
        """Extract medical terms using OpenAI API."""
        import json
        
        system_prompt = """You are a biomedical expert that extracts structured medical and biological information from natural language protein search queries.

Extract the following information and return it as JSON:
{
  "organism": "organism name or scientific name (any organism mentioned) or null",
  "organism_id": "NCBI taxonomy ID if known or null",
  "keywords": ["thermostable", "membrane", "enzyme", etc.],
  "traits": ["heat-resistant", "disease-associated", etc.],
  "enzyme_class": "all" or specific EC number or null,
  "length_range": {"min": 100, "max": 500} or null,
  "disease_related": true or false,
  "medical_context": "brief description"
}

Extract ANY organism mentioned - use the actual name from the query.

Return ONLY valid JSON."""

        user_message = f"""Extract medical and biological information from: "{user_query}"

Return as JSON."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.2,
                max_tokens=300
            )
            
            raw_output = response.choices[0].message.content.strip()
            print(f"[DEBUG] OpenAI Medical Terms Extraction Raw Output: {raw_output}")
            
            # Extract JSON
            if "```json" in raw_output:
                raw_output = raw_output.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_output:
                raw_output = raw_output.split("```")[1].split("```")[0].strip()
            
            try:
                medical_terms = json.loads(raw_output)
                print(f"[DEBUG] Parsed medical terms: {json.dumps(medical_terms, indent=2)}")
                return medical_terms
            except json.JSONDecodeError:
                return self._fallback_medical_extraction(user_query)
                
        except Exception as e:
            logger.error(f"Error extracting medical terms with OpenAI: {e}")
            return self._fallback_medical_extraction(user_query)
    
    def _extract_medical_terms_local(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> Dict[str, any]:
        """Extract medical terms using local model (fallback to rule-based)."""
        print(f"[DEBUG] Using fallback medical term extraction")
        return self._fallback_medical_extraction(user_query)
    
    def _fallback_medical_extraction(self, user_query: str) -> Dict[str, any]:
        """Fallback rule-based medical term extraction."""
        query_lower = user_query.lower()
        
        medical_terms = {
            "organism": None,
            "organism_id": None,
            "keywords": [],
            "traits": [],
            "enzyme_class": None,
            "length_range": None,
            "disease_related": False,
            "medical_context": ""
        }
        
        # Extract organism dynamically - look for common patterns
        # Try to extract organism name from query (not hard-coded)
        organism_patterns = [
            (r'\b(human|homo\s+sapiens)\b', "Homo sapiens", "9606"),
            (r'\b(mouse|mus\s+musculus|murine)\b', "Mus musculus", "10090"),
            (r'\b(yeast|saccharomyces|s\.\s*cerevisiae)\b', "Saccharomyces cerevisiae", "559292"),
            (r'\b(e\.\s*coli|escherichia\s+coli)\b', "Escherichia coli", "562"),
            (r'\b(bacteria|bacterial)\b', "bacteria", None),
        ]
        
        for pattern, name, org_id in organism_patterns:
            if re.search(pattern, query_lower, re.IGNORECASE):
                medical_terms["organism"] = name
                if org_id:
                    medical_terms["organism_id"] = org_id
                break
        
        # Extract keywords and traits
        if any(word in query_lower for word in ["heat", "temperature", "thermostable"]):
            medical_terms["keywords"].append("thermostable")
            medical_terms["traits"].append("heat-resistant")
        
        if "membrane" in query_lower:
            medical_terms["keywords"].append("membrane")
        
        if "enzyme" in query_lower or "enzymes" in query_lower:
            medical_terms["keywords"].append("enzyme")
            medical_terms["enzyme_class"] = "all"
        
        if "antimicrobial" in query_lower or "antibacterial" in query_lower:
            medical_terms["keywords"].append("antimicrobial")
            medical_terms["traits"].append("antimicrobial")
        
        if any(word in query_lower for word in ["disease", "cancer", "alzheimer", "diabetes"]):
            medical_terms["disease_related"] = True
            medical_terms["traits"].append("disease-associated")
        
        # Extract length range
        length_match = re.search(r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:amino|aa|residue)', query_lower)
        if length_match:
            medical_terms["length_range"] = {
                "min": int(length_match.group(1)),
                "max": int(length_match.group(2)) if length_match.group(2) else 10000
            }
        
        return medical_terms
    
    def _medical_terms_to_uniprot_query(
        self,
        medical_terms: Dict[str, any],
        reviewed_only: bool
    ) -> str:
        """
        Convert extracted medical terms to UniProt query syntax.
        
        Args:
            medical_terms: Dictionary with extracted medical/biological information
            reviewed_only: Whether to only search reviewed proteins
        
        Returns:
            UniProt query string
        """
        query_parts = []
        
        # Handle organism - use organism_id if provided, otherwise try to look up or use organism name
        if medical_terms.get("organism_id"):
            query_parts.append(f"organism_id:{medical_terms['organism_id']}")
        elif medical_terms.get("organism"):
            # Try to map common organism names to IDs, or use organism name search
            org_name = medical_terms["organism"].lower()
            # Common organism mappings (can be expanded)
            common_organisms = {
                "homo sapiens": "9606",
                "human": "9606",
                "mus musculus": "10090",
                "mouse": "10090",
                "saccharomyces cerevisiae": "559292",
                "yeast": "559292",
                "escherichia coli": "562",
                "e. coli": "562",
            }
            
            if org_name in common_organisms:
                query_parts.append(f"organism_id:{common_organisms[org_name]}")
            else:
                # Use organism name search if ID not available
                # UniProt supports organism name search
                org_clean = medical_terms["organism"].replace(" ", "_")
                query_parts.append(f"organism_name:{org_clean}")
        
        # Map keywords to UniProt keywords
        keyword_map = {
            "thermostable": "keyword:KW-0809",
            "membrane": "keyword:KW-0472",
            "signal-peptide": "keyword:KW-0329",
            "dna-binding": "keyword:KW-0044",
            "antimicrobial": "keyword:KW-1185",
            "disease-mutation": "keyword:KW-0564"
        }
        
        for keyword in medical_terms.get("keywords", []):
            keyword_lower = keyword.lower()
            if keyword_lower in keyword_map:
                query_parts.append(keyword_map[keyword_lower])
            elif keyword_lower == "enzyme":
                # Handle enzyme separately
                if medical_terms.get("enzyme_class") == "all":
                    query_parts.append("ec:*")
                elif medical_terms.get("enzyme_class"):
                    query_parts.append(f"ec:{medical_terms['enzyme_class']}")
        
        # Handle enzyme class
        if medical_terms.get("enzyme_class") and "ec:" not in " ".join(query_parts):
            if medical_terms["enzyme_class"] == "all":
                query_parts.append("ec:*")
            else:
                query_parts.append(f"ec:{medical_terms['enzyme_class']}")
        
        # Handle length range
        if medical_terms.get("length_range"):
            length = medical_terms["length_range"]
            query_parts.append(f"length:[{length['min']} TO {length['max']}]")
        
        # Build query
        if query_parts:
            query = " AND ".join(query_parts)
        else:
            query = "reviewed:true"  # Fallback
        
        # Add reviewed filter
        if reviewed_only and "reviewed:" not in query:
            query = f"{query} AND reviewed:true"
        
        return query
    
    def _xai_query_generation(
        self,
        user_query: str,
        max_results: int,
        reviewed_only: bool
    ) -> str:
        """Generate query using xAI (Grok) API with medical/biological context."""
        import requests
        import os
        
        system_prompt = """You are a biomedical database query expert specializing in UniProt protein database queries. 
You convert natural language protein search requests into valid UniProt query syntax for medical and biological research.

UniProt Query Syntax Guide:
- reviewed:true - Only manually reviewed proteins (Swiss-Prot, highest quality)
- length:[X TO Y] - Protein length range in amino acids
- organism_id:9606 - Specific organism (9606 = Homo sapiens/human)
- organism_id:10090 - Mus musculus (mouse)
- organism_id:559292 - Saccharomyces cerevisiae (yeast)
- keyword:KW-XXXX - Protein keywords (e.g., KW-0809 = thermostable)
- ec:* - All enzymes
- ec:1.1.1.1 - Specific enzyme classification
- name:protein_name - Search by protein name
- gene:gene_name - Search by gene name

Common medical/biological keywords:
- KW-0809: Thermostable (heat-resistant proteins)
- KW-0472: Membrane protein (cell membrane proteins)
- KW-0329: Signal peptide (secreted proteins)
- KW-0044: DNA-binding (transcription factors)
- KW-0135: Enzyme (catalytic proteins)
- KW-0564: Disease mutation (disease-associated variants)
- KW-1185: Antimicrobial (antibacterial/antifungal proteins)

Medical/Biological Examples:
Input: "Find heat-resistant proteins"
Output: "keyword:KW-0809 AND reviewed:true"

Input: "Find enzymes that break down proteins"
Output: "ec:* AND reviewed:true"

Input: "Find membrane proteins between 100 and 500 amino acids"
Output: "keyword:KW-0472 AND length:[100 TO 500] AND reviewed:true"

Input: "Find disease-associated proteins"
Output: "keyword:KW-0564 AND reviewed:true"

Return ONLY the UniProt query string, nothing else. Focus on medical and biological accuracy."""

        user_message = f"""Convert this biomedical protein search request to a UniProt query:

"{user_query}"

Context:
- This is for medical/biological research
- Maximum results needed: {max_results}
- Reviewed only: {reviewed_only}
- Return only the UniProt query string in valid syntax"""

        try:
            response = requests.post(
                f"{self.xai_base_url}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.xai_api_key}"
                },
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "model": self.xai_model,  # xAI model (grok-beta, grok-2-1212, grok-2, etc.)
                    "stream": False,
                    "temperature": 0.3,  # Lower temperature for more consistent, accurate queries
                    "max_tokens": 200
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            raw_query = result["choices"][0]["message"]["content"].strip()
            print(f"\n[DEBUG] xAI LLM Raw Output: {raw_query}")
            
            # Clean up the query (remove markdown, quotes, etc.)
            query = self._clean_query(raw_query)
            print(f"[DEBUG] After cleaning: {query}")
            
            # Post-process to fix common mistakes
            # Fix "enzymes:" or "enzyme:" to "ec:*"
            if ("enzyme" in query.lower() or "enzymes" in query.lower()) and "ec:" not in query:
                query = re.sub(r'\benzymes?\s*:\s*', 'ec:* ', query, flags=re.IGNORECASE)
                if "ec:" not in query:
                    if "organism_id:" in query:
                        query = query.replace("organism_id:", "ec:* AND organism_id:")
                    else:
                        query = f"ec:* AND {query}" if query else "ec:*"
                print(f"[DEBUG] After enzyme fix: {query}")
            
            # Add reviewed filter if requested
            if reviewed_only and "reviewed:" not in query:
                if "AND" in query or "OR" in query:
                    query = f"({query}) AND reviewed:true"
                else:
                    query = f"{query} AND reviewed:true"
                print(f"[DEBUG] After reviewed filter: {query}")
            
            logger.info(f"Generated UniProt query (xAI): {query}")
            print(f"[DEBUG] Final UniProt Query: {query}")
            return query
            
        except requests.RequestException as e:
            logger.error(f"Error generating query with xAI: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            # Fallback to keyword-based query
            return self._fallback_query(user_query, reviewed_only)
        except Exception as e:
            logger.error(f"Error generating query with xAI: {e}")
            return self._fallback_query(user_query, reviewed_only)
    
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

Input: "Find enzymes that break down proteins"
Output: "ec:* AND reviewed:true"

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
            
            raw_query = response.choices[0].message.content.strip()
            print(f"\n[DEBUG] OpenAI LLM Raw Output: {raw_query}")
            
            # Clean up the query (remove markdown, quotes, etc.)
            query = self._clean_query(raw_query)
            print(f"[DEBUG] After cleaning: {query}")
            
            # Add reviewed filter if requested
            if reviewed_only and "reviewed:" not in query:
                if "AND" in query or "OR" in query:
                    query = f"({query}) AND reviewed:true"
                else:
                    query = f"{query} AND reviewed:true"
                print(f"[DEBUG] After reviewed filter: {query}")
            
            logger.info(f"Generated UniProt query: {query}")
            print(f"[DEBUG] Final UniProt Query: {query}")
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
- Enzymes: ec:* AND reviewed:true
- Membrane proteins: keyword:KW-0472 AND reviewed:true

Query:"""
        
        try:
            response = self.generator(
                prompt,
                max_length=200,
                temperature=0.3,
                num_return_sequences=1
            )[0]["generated_text"]
            
            raw_response = response
            print(f"\n[DEBUG] Local LLM Raw Output: {raw_response[:500]}...")  # Show first 500 chars
            
            # Extract query from response
            # Try multiple patterns to extract the query
            if "Query:" in response:
                query = response.split("Query:")[-1].strip()
                print(f"[DEBUG] Found 'Query:' pattern, extracted: {query[:100]}")
            elif "query:" in response.lower():
                # Find the last occurrence of query: pattern
                parts = re.split(r'[Qq]uery:\s*', response)
                if len(parts) > 1:
                    query = parts[-1].strip()
                    print(f"[DEBUG] Found 'query:' pattern, extracted: {query[:100]}")
                else:
                    query = response.strip()
            else:
                # Take the last line or last meaningful part
                lines = [l.strip() for l in response.split('\n') if l.strip()]
                query = lines[-1] if lines else response.strip()
                print(f"[DEBUG] Using last line, extracted: {query[:100]}")
            
            query = self._clean_query(query)
            print(f"[DEBUG] After cleaning: {query}")
            
            # Post-process to fix common LLM mistakes
            # If query contains "enzymes" or "enzyme" but no "ec:", add it
            if ("enzyme" in query.lower() or "enzymes" in query.lower()) and "ec:" not in query:
                # Replace "enzymes:" or "enzyme:" with "ec:*"
                query = re.sub(r'\benzymes?\s*:\s*', 'ec:* ', query, flags=re.IGNORECASE)
                if "ec:" not in query:
                    # Add ec:* if not present
                    if "organism_id:" in query:
                        query = query.replace("organism_id:", "ec:* AND organism_id:")
                    else:
                        query = f"ec:* AND {query}" if query else "ec:*"
                print(f"[DEBUG] After enzyme fix: {query}")
            
            # Add reviewed filter if requested
            if reviewed_only and "reviewed:" not in query:
                if "AND" in query or "OR" in query:
                    query = f"({query}) AND reviewed:true"
                else:
                    query = f"{query} AND reviewed:true"
                print(f"[DEBUG] After reviewed filter: {query}")
            
            logger.info(f"Generated UniProt query: {query}")
            print(f"[DEBUG] Final UniProt Query: {query}")
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
        
        # Remove descriptive text before actual query (e.g., "human enzymes: organism_id:...")
        # Extract only the part that contains UniProt keywords
        if ':' in query:
            # Find the first occurrence of a UniProt keyword pattern
            keyword_patterns = [
                r'keyword:\s*\w+',
                r'organism_id:\s*\d+',
                r'ec:\s*[\d\.\*]+',
                r'length:\s*\[.*?\]',
                r'reviewed:\s*\w+'
            ]
            for pattern in keyword_patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    # Extract from the first keyword match onwards
                    query = query[match.start():]
                    break
        
        # CRITICAL FIX: Replace "enzymes:" or "enzyme:" with "ec:*" FIRST
        # This is a common LLM mistake that breaks UniProt queries (400 error)
        if re.search(r'\benzymes?\s*:', query, re.IGNORECASE):
            # Replace "enzymes: something" with "ec:* AND something"
            # Handle cases like "enzymes: organism_id:9606" -> "ec:* AND organism_id:9606"
            query = re.sub(r'\benzymes?\s*:\s*', 'ec:* AND ', query, flags=re.IGNORECASE)
            # Clean up double ANDs
            query = re.sub(r'AND\s+AND', 'AND', query, flags=re.IGNORECASE)
        
        # Fix common spacing issues in keywords
        query = re.sub(r'organism\s+_?\s*id\s*:', 'organism_id:', query, flags=re.IGNORECASE)
        query = re.sub(r'ec\s*:', 'ec:', query, flags=re.IGNORECASE)
        query = re.sub(r'keyword\s*:', 'keyword:', query, flags=re.IGNORECASE)
        query = re.sub(r'length\s*:', 'length:', query, flags=re.IGNORECASE)
        query = re.sub(r'reviewed\s*:', 'reviewed:', query, flags=re.IGNORECASE)
        
        # Remove extra spaces around operators
        query = re.sub(r'\s+AND\s+', ' AND ', query, flags=re.IGNORECASE)
        query = re.sub(r'\s+OR\s+', ' OR ', query, flags=re.IGNORECASE)
        
        # Remove any remaining descriptive text at the start (words before first keyword)
        # Match pattern: "word word: keyword:" -> "keyword:"
        # But be careful not to remove valid keywords
        query = re.sub(r'^[^:]*?([a-z_]+:\s)', r'\1', query, flags=re.IGNORECASE)
        
        # Fix incomplete keywords (e.g., "keyword: KW" -> remove, "keyword:KW-0809" -> keep)
        # Remove incomplete keyword patterns like "keyword: KW" or "keyword: " without value
        query = re.sub(r'keyword:\s+KW\s+AND', '', query, flags=re.IGNORECASE)
        query = re.sub(r'keyword:\s+KW\s*$', '', query, flags=re.IGNORECASE)
        query = re.sub(r'keyword:\s+(?!KW-)[A-Z]+\s+AND', '', query, flags=re.IGNORECASE)
        
        # Clean up multiple spaces
        query = re.sub(r'\s+', ' ', query)
        
        # Remove leading/trailing operators
        query = query.strip().strip('AND').strip('OR').strip()
        
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
        
        # Check for organism mentions dynamically using patterns
        organism_patterns = [
            (r'\b(human|homo\s+sapiens)\b', "organism_id:9606"),
            (r'\b(mouse|mus\s+musculus|murine)\b', "organism_id:10090"),
            (r'\b(yeast|saccharomyces|s\.\s*cerevisiae)\b', "organism_id:559292"),
            (r'\b(e\.\s*coli|escherichia\s+coli)\b', "organism_id:562"),
        ]
        
        for pattern, org_query in organism_patterns:
            if re.search(pattern, query_lower, re.IGNORECASE):
                query_parts.append(org_query)
                break
        
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
    use_xai: bool = False,
    api_key: Optional[str] = None,
    reviewed_only: bool = True
):
    """
    High-level function: Convert natural language to UniProt query and fetch proteins.
    
    Args:
        natural_language_query: Natural language description
        size: Number of proteins to fetch
        use_openai: Use OpenAI API for query generation
        use_xai: Use xAI (Grok) API for query generation (optimized for medical/biological text)
        api_key: API key (OpenAI or xAI, depending on which is enabled)
        reviewed_only: Only search reviewed proteins
    
    Returns:
        Tuple of (uniprot_query, dataset)
    """
    from .dataloader import create_protein_dataset
    
    # Generate query from natural language
    query_gen = UniProtQueryGenerator(
        use_openai=use_openai, 
        use_xai=use_xai,
        api_key=api_key
    )
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


def search_and_get_sequence(
    natural_language_query: str,
    max_results: int = 10,
    top_n: int = 5,
    use_openai: bool = False,
    use_xai: bool = False,
    api_key: Optional[str] = None,
    reviewed_only: bool = True
) -> Optional[List[Dict[str, str]]]:
    """
    Search UniProt with natural language query, print first 10 results, and return top N sequences.
    
    Args:
        natural_language_query: Natural language protein search query
        max_results: Maximum number of results to fetch and display (default: 10)
        top_n: Number of top sequences to return (default: 5)
        use_openai: Use OpenAI API for query generation
        use_xai: Use xAI (Grok) API for query generation
        api_key: API key (OpenAI or xAI)
        reviewed_only: Only search reviewed proteins
    
    Returns:
        List of dictionaries with 'protein_id', 'sequence', 'url', and 'function' for top N proteins,
        or None if no results
    """
    from .dataloader import fetch_uniprot
    
    # Generate query from natural language
    query_gen = UniProtQueryGenerator(
        use_openai=use_openai,
        use_xai=use_xai,
        api_key=api_key
    )
    
    print("=" * 70)
    print(f"Searching UniProt: '{natural_language_query}'")
    print("=" * 70)
    
    uniprot_query = query_gen.natural_language_to_query(
        natural_language_query,
        max_results=max_results,
        reviewed_only=reviewed_only
    )
    
    print(f"\nGenerated UniProt Query: {uniprot_query}")
    print(f"\nFetching up to {max_results} proteins...\n")
    
    # Fetch proteins
    try:
        df = fetch_uniprot(query=uniprot_query, size=max_results)
        
        if len(df) == 0:
            print("[WARNING] No proteins found matching the query.")
            return None
        
        # Limit to first 10 for display
        display_count = min(len(df), max_results)
        df_display = df.head(display_count)
        
        print(f"Found {len(df)} protein(s). Showing first {display_count}:\n")
        print("-" * 70)
        
        # Print each result
        for idx, row in df_display.iterrows():
            protein_id = row.get('id', f'Protein_{idx+1}')
            function = row.get('function', 'N/A')
            sequence = row.get('sequence', '')
            seq_length = len(sequence) if sequence else 0
            
            print(f"\n[{idx+1}] Protein ID: {protein_id}")
            print(f"    Function: {function[:150]}{'...' if len(function) > 150 else ''}")
            print(f"    Sequence Length: {seq_length} amino acids")
            if sequence:
                print(f"    Sequence Preview: {sequence[:50]}...")
            print("-" * 70)
        
        # Return the top N sequences with IDs and URLs
        results = []
        return_count = min(top_n, len(df))
        
        print(f"\n[RETURNING] Top {return_count} sequences with UniProt links:")
        print("=" * 70)
        
        for i in range(return_count):
            row = df.iloc[i]
            sequence = row.get('sequence', None)
            protein_id = row.get('id', f'Protein_{i+1}')
            function = row.get('function', 'N/A')
            
            if sequence:
                # Generate UniProt URL
                uniprot_url = f"https://www.uniprot.org/uniprotkb/{protein_id}/entry"
                
                # Store result with all information
                result = {
                    'protein_id': protein_id,
                    'sequence': sequence,
                    'url': uniprot_url,
                    'function': function,
                    'length': len(sequence)
                }
                results.append(result)
                
                print(f"\n[{i+1}] Protein ID: {protein_id}")
                print(f"    UniProt URL: {uniprot_url}")
                print(f"    Function: {function[:100]}{'...' if len(function) > 100 else ''}")
                print(f"    Sequence Length: {len(sequence)} amino acids")
                print(f"    Sequence: {sequence}")
                print("-" * 70)
        
        if results:
            print(f"\n[SUCCESS] Returning {len(results)} sequence(s) with protein IDs and URLs")
            return results
        else:
            print("\n[WARNING] No sequences found in results")
            return None
        
    except Exception as e:
        print(f"\n[ERROR] Failed to fetch proteins: {e}")
        import traceback
        traceback.print_exc()
        return None


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
        "Find enzymes that break down proteins",
        "Find membrane proteins between 100 and 500 amino acids"
    ]
    
    for query in test_queries:
        print(f"\nNatural Language: {query}")
        uniprot_query = query_gen.natural_language_to_query(query)
        print(f"UniProt Query: {uniprot_query}")
    
    # Example 2: Using xAI (Grok) - optimized for medical/biological text
    if os.getenv("XAI_API_KEY"):
        print("\n" + "=" * 60)
        print("Example 2: xAI (Grok) Query Generation (Medical/Biological)")
        print("=" * 60)
        
        query_gen_xai = UniProtQueryGenerator(use_xai=True)
        query = "Find disease-associated proteins involved in cancer"
        uniprot_query = query_gen_xai.natural_language_to_query(query)
        print(f"Natural Language: {query}")
        print(f"UniProt Query: {uniprot_query}")
    
    # Example 3: Using OpenAI (if API key available)
    if os.getenv("OPENAI_API_KEY"):
        print("\n" + "=" * 60)
        print("Example 3: OpenAI Query Generation")
        print("=" * 60)
        
        query_gen_openai = UniProtQueryGenerator(use_openai=True)
        query = "Find heat-resistant proteins from bacteria"
        uniprot_query = query_gen_openai.natural_language_to_query(query)
        print(f"Natural Language: {query}")
        print(f"UniProt Query: {uniprot_query}")
    
    # Example 4: End-to-end search
    print("\n" + "=" * 60)
    print("Example 4: End-to-End Protein Search")
    print("=" * 60)
    
    uniprot_query, dataset = search_proteins_from_natural_language(
        "Find thermostable enzymes",
        size=10
    )
    
    print(f"Generated Query: {uniprot_query}")
    print(f"Found {len(dataset)} proteins")
    print(f"Sample: {dataset[0]}")

