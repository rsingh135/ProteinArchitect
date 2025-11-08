"""
LLM Agent - Conversational protein design refinement
"""

from typing import Dict, Optional
import os
from openai import OpenAI


class LLMAgent:
    """LLM-powered agent for conversational protein refinement"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = None
            print("Warning: OPENAI_API_KEY not set. LLM features will be mocked.")
    
    def refine_protein(
        self,
        sequence: str,
        refinement_prompt: str,
        oracle
    ) -> Dict:
        """
        Refine protein design using LLM agent with tool use
        """
        if not self.client:
            # Mock refinement if API key not available
            return self._mock_refinement(sequence, refinement_prompt, oracle)
        
        try:
            # System prompt defining the agent's role and capabilities
            system_prompt = """You are the Protein Architect Agent, an expert in protein design and optimization.
You have access to an Expressibility Oracle tool that can predict protein stability and manufacturability.

Your capabilities:
1. Analyze protein sequences
2. Suggest modifications to improve stability, reduce immunogenicity, or optimize expression
3. Use the Oracle tool to validate your suggestions

When the user provides a refinement request, analyze the current sequence and suggest improvements.
Focus on:
- Reducing instability (avoid problematic amino acid patterns)
- Maintaining functional constraints
- Improving manufacturability

Respond with a refined sequence and explanation of changes."""
            
            # Get current oracle prediction
            current_prediction = oracle.predict(sequence)
            
            # User message with context
            user_message = f"""Current protein sequence: {sequence}
Current stability score: {current_prediction['stability_score']}
Current instability index: {current_prediction['instability_index']}

User refinement request: {refinement_prompt}

Please suggest a refined sequence that addresses the user's request while maintaining or improving stability."""
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7
            )
            
            llm_response = response.choices[0].message.content
            
            # Extract refined sequence (simple extraction - in production would use structured output)
            refined_sequence = self._extract_sequence_from_response(llm_response, sequence)
            
            # Validate with Oracle
            refined_prediction = oracle.predict(refined_sequence)
            
            return {
                "original_sequence": sequence,
                "refined_sequence": refined_sequence,
                "refinement_explanation": llm_response,
                "original_prediction": current_prediction,
                "refined_prediction": refined_prediction,
                "improvement": refined_prediction["stability_score"] - current_prediction["stability_score"]
            }
        
        except Exception:
            # Fallback to mock if API call fails
            return self._mock_refinement(sequence, refinement_prompt, oracle)
    
    def _mock_refinement(self, sequence: str, refinement_prompt: str, oracle) -> Dict:
        """Mock refinement when LLM API is not available"""
        current_prediction = oracle.predict(sequence)
        
        # Simple mock: reduce cysteines if requested
        refined_sequence = sequence
        if "immunogenicity" in refinement_prompt.lower() or "reduce" in refinement_prompt.lower():
            # Replace some cysteines with serines
            refined_sequence = sequence.replace("C", "S", 2)
        
        refined_prediction = oracle.predict(refined_sequence)
        
        return {
            "original_sequence": sequence,
            "refined_sequence": refined_sequence,
            "refinement_explanation": f"Mock refinement: Applied constraint '{refinement_prompt}' by reducing cysteine content to improve stability.",
            "original_prediction": current_prediction,
            "refined_prediction": refined_prediction,
            "improvement": refined_prediction["stability_score"] - current_prediction["stability_score"]
        }
    
    def _extract_sequence_from_response(self, response: str, original_sequence: str) -> str:
        """Extract sequence from LLM response"""
        # Look for sequence patterns in response
        import re
        # Look for sequences of 20+ amino acids
        sequence_pattern = r'[ACDEFGHIKLMNPQRSTVWY]{20,}'
        matches = re.findall(sequence_pattern, response.upper())
        
        if matches:
            # Return the longest match
            return max(matches, key=len)
        
        # If no sequence found, return original (LLM might have given instructions only)
        return original_sequence

