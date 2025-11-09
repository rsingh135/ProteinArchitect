"""
Chat Service for Protein Analysis using Gemini API
Provides context-aware answers about proteins currently loaded in the viewer
"""

import os
import logging
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google.generativeai not available. Install with: pip install google-generativeai")


class ProteinChatService:
    """Service for answering questions about proteins using Gemini API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize chat service
        
        Args:
            api_key: Gemini API key (if None, will try to get from environment)
        """
        if api_key:
            self.api_key = api_key
        else:
            self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError("Gemini API key required. Set GEMINI_API_KEY environment variable")
        
        if GEMINI_AVAILABLE:
            genai.configure(api_key=self.api_key)
            # List available models and use the first one that supports generateContent
            try:
                available_models = list(genai.list_models())
                model_name = None
                for model in available_models:
                    if 'generateContent' in model.supported_generation_methods:
                        # Prefer flash models (faster), then pro models
                        if 'flash' in model.name.lower():
                            model_name = model.name
                            break
                
                # If no flash model, use first available model
                if not model_name:
                    for model in available_models:
                        if 'generateContent' in model.supported_generation_methods:
                            model_name = model.name
                            break
                
                if model_name:
                    # Extract just the model name (remove 'models/' prefix if present)
                    clean_name = model_name.split('/')[-1] if '/' in model_name else model_name
                    self.model = genai.GenerativeModel(clean_name)
                    logger.info(f"Gemini Chat service initialized successfully with {clean_name}")
                else:
                    logger.error("No suitable Gemini model found")
                    self.model = None
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model: {e}")
                # Fallback: try common model names
                try:
                    self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
                    logger.info("Gemini Chat service initialized with gemini-1.5-flash-latest (fallback)")
                except:
                    try:
                        self.model = genai.GenerativeModel('gemini-pro')
                        logger.info("Gemini Chat service initialized with gemini-pro (fallback)")
                    except Exception as e2:
                        logger.error(f"All Gemini model initialization attempts failed: {e2}")
                        self.model = None
        else:
            self.model = None
            logger.warning("Gemini API not available. Chat functionality will be limited.")
    
    def create_protein_context(self, target_protein: Optional[Dict], binder_protein: Optional[Dict]) -> str:
        """
        Create context string from protein data
        
        Args:
            target_protein: Target protein data
            binder_protein: Partner/binder protein data (optional)
        
        Returns:
            Formatted context string
        """
        context_parts = []
        
        if target_protein:
            context_parts.append("=== TARGET PROTEIN ===")
            context_parts.append(f"UniProt ID: {target_protein.get('uniprotId', 'N/A')}")
            context_parts.append(f"Name: {target_protein.get('name', 'N/A')}")
            context_parts.append(f"Organism: {target_protein.get('organism', 'N/A')}")
            
            if target_protein.get('function'):
                context_parts.append(f"Function: {target_protein.get('function')}")
            
            if target_protein.get('sequence'):
                sequence = str(target_protein.get('sequence', ''))
                if sequence:
                    seq_length = len(sequence)
                    context_parts.append(f"Sequence Length: {seq_length} amino acids")
                    # Include first 50 amino acids as sample
                    if len(sequence) > 50:
                        seq_sample = sequence[:50]
                        context_parts.append(f"Sequence (first 50 aa): {seq_sample}...")
                    else:
                        context_parts.append(f"Sequence: {sequence}")
            
            if target_protein.get('metrics'):
                metrics = target_protein.get('metrics', {})
                if metrics.get('plddt'):
                    context_parts.append(f"pLDDT Score (Confidence): {metrics.get('plddt'):.1f}")
                if metrics.get('length'):
                    context_parts.append(f"Length: {metrics.get('length')} residues")
                if metrics.get('mass'):
                    context_parts.append(f"Molecular Mass: {metrics.get('mass'):.1f} kDa")
            
            context_parts.append("")
        
        if binder_protein:
            context_parts.append("=== PARTNER/BINDER PROTEIN ===")
            context_parts.append(f"UniProt ID: {binder_protein.get('uniprotId', 'N/A')}")
            context_parts.append(f"Name: {binder_protein.get('name', 'N/A')}")
            context_parts.append(f"Organism: {binder_protein.get('organism', 'N/A')}")
            
            if binder_protein.get('function'):
                context_parts.append(f"Function: {binder_protein.get('function')}")
            
            if binder_protein.get('sequence'):
                sequence = str(binder_protein.get('sequence', ''))
                if sequence:
                    seq_length = len(sequence)
                    context_parts.append(f"Sequence Length: {seq_length} amino acids")
                    # Include first 50 amino acids as sample
                    if len(sequence) > 50:
                        seq_sample = sequence[:50]
                        context_parts.append(f"Sequence (first 50 aa): {seq_sample}...")
                    else:
                        context_parts.append(f"Sequence: {sequence}")
            
            if binder_protein.get('metrics'):
                metrics = binder_protein.get('metrics', {})
                if metrics.get('plddt'):
                    context_parts.append(f"pLDDT Score (Confidence): {metrics.get('plddt'):.1f}")
                if metrics.get('length'):
                    context_parts.append(f"Length: {metrics.get('length')} residues")
                if metrics.get('mass'):
                    context_parts.append(f"Molecular Mass: {metrics.get('mass'):.1f} kDa")
            
            context_parts.append("")
        
        return "\n".join(context_parts)
    
    def chat(self, message: str, target_protein: Optional[Dict] = None, 
             binder_protein: Optional[Dict] = None, 
             interaction_stats: Optional[Dict] = None) -> str:
        """
        Answer a question about the proteins using Gemini
        
        Args:
            message: User's question
            target_protein: Target protein data
            binder_protein: Partner protein data (optional)
            interaction_stats: Interaction statistics (optional)
        
        Returns:
            AI response string
        """
        if not self.model:
            return "Chat service is not available. Please ensure Gemini API is properly configured."
        
        try:
            # Create context from protein data
            protein_context = self.create_protein_context(target_protein, binder_protein)
            
            # Add interaction stats if available
            interaction_context = ""
            if interaction_stats and binder_protein:
                interaction_context = "\n=== PROTEIN-PROTEIN INTERACTIONS ===\n"
                if interaction_stats.get('totalContacts'):
                    interaction_context += f"Total Contacts: {interaction_stats.get('totalContacts')}\n"
                if interaction_stats.get('averageDistance'):
                    interaction_context += f"Average Distance: {interaction_stats.get('averageDistance'):.2f} Å\n"
                if interaction_stats.get('minDistance'):
                    interaction_context += f"Closest Contact: {interaction_stats.get('minDistance'):.2f} Å\n"
                if interaction_stats.get('interactionTypes'):
                    interaction_context += f"Interaction Types: {json.dumps(interaction_stats.get('interactionTypes'), indent=2)}\n"
            
            # Determine what information we have
            has_target = target_protein is not None and target_protein.get('uniprotId')
            has_binder = binder_protein is not None and binder_protein.get('uniprotId')
            has_interactions = interaction_stats is not None and has_binder and has_target
            
            # Create system prompt
            system_prompt = """You are an AI assistant specialized in protein analysis and structural biology. 
You provide concise, accurate, and scientifically rigorous answers about proteins, their structures, functions, and interactions.

**INFORMATION HANDLING:**
1. Use the provided protein data as your primary source when available
2. When the provided data is insufficient or missing key information, automatically look up accurate scientific information using the UniProt IDs
3. Synthesize information naturally without mentioning data sources explicitly
4. Answer as if you have direct knowledge - don't say "based on the provided data" or "the web app indicates"

**RESPONSE STYLE:**
- Be CONCISE: 2-4 sentences for simple questions, 1-2 short paragraphs maximum for complex questions
- Be ACCURATE: Use precise scientific terminology and UniProt IDs when relevant
- Be USEFUL: Focus on answering what the user actually asked
- Be IMPRESSIVE: Demonstrate deep protein knowledge but keep it brief
- Use bullet points for lists, but keep lists short (3-5 items max)

**TOPICS TO ADDRESS:**
- Protein structure, function, and interactions
- Binding sites and residues
- Confidence scores (pLDDT when mentioned)
- Functional domains
- Disease-related variants
- Known interactions and pathways

**MARKDOWN FORMATTING:**
- Use **double asterisks** for bold: **protein name**, **binding site**
- Use *single asterisks* for italic: *Homo sapiens*, *in vivo*
- Use dashes (-) for bullet lists
- NEVER use triple asterisks (***)
- NEVER use asterisks as separators
- Use blank lines to separate sections

**EXAMPLES:**

Good (concise):
**Insulin** (P01308) binds the insulin receptor via residues in the A and B chains. Key binding sites include PheB24-PheB25 in the B chain and residues around the C-peptide region.

Bad (too verbose):
Based on the provided data, Insulin (UniProt ID: P01308) is known to interact with the insulin receptor. The web app data indicates that this interaction occurs through specific residues located in the A and B chains of the insulin molecule. Specifically, the binding sites include...

Keep responses brief, scientific, and impactful."""

            # Build full prompt with context guidance
            if has_target or has_binder:
                target_ids = []
                if has_target:
                    target_ids.append(target_protein.get('uniprotId'))
                if has_binder:
                    target_ids.append(binder_protein.get('uniprotId'))
                uniprot_ids_note = f"\n\n**UniProt IDs for reference:** {', '.join(target_ids)}"
            else:
                uniprot_ids_note = ""
            
            # Build full prompt
            full_prompt = f"""{system_prompt}

**PROTEIN INFORMATION:**
{protein_context}
{interaction_context}{uniprot_ids_note}

**USER QUESTION:** {message}

**INSTRUCTIONS:**
1. Use the protein information above when it answers the question
2. If information is missing or insufficient, look up the relevant details using the UniProt IDs
3. Answer concisely (2-4 sentences or 1-2 short paragraphs max)
4. Don't mention data sources - answer naturally as if you have direct knowledge
5. Use proper markdown: **bold**, *italic*, bullet points with dashes
6. Never use triple asterisks or asterisks as separators

Provide a concise, accurate, scientific answer."""
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            # Safely extract text from response
            if hasattr(response, 'text'):
                response_text = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # Alternative way to get text from response
                if response.candidates[0].content.parts:
                    response_text = response.candidates[0].content.parts[0].text
                else:
                    response_text = str(response)
            else:
                response_text = str(response)
            
            # Ensure it's a string and strip whitespace
            if response_text:
                return str(response_text).strip()
            else:
                return "I received an empty response. Please try asking your question again."
        
        except Exception as e:
            logger.error(f"Error in chat service: {e}")
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Full error traceback:\n{error_details}")
            
            # Return a more user-friendly error message
            error_message = str(e)
            if "slice" in error_message.lower():
                return "I encountered an error processing the protein data. Please make sure the proteins are loaded correctly and try again."
            else:
                return f"I encountered an error: {error_message}. Please try again or rephrase your question."

