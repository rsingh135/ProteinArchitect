"""
Protein Generator - Mock RL-based sequence generation
"""

import random
import string

AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWY"


class ProteinGenerator:
    """Generates protein sequences based on constraints"""
    
    def generate(
        self,
        target_name: str,  # noqa: ARG002
        max_length: int = 200,
        max_cysteines: int = 5,
        functional_constraint: str = None  # noqa: ARG002
    ) -> str:
        """
        Generate a protein sequence using mock RL logic
        In a real system, this would use a trained RL model
        """
        # Determine target length (with some randomness)
        length = min(max_length, random.randint(100, max_length))
        
        # Generate sequence with constraint on cysteines
        sequence = []
        cysteine_count = 0
        
        for _ in range(length):
            # Apply constraints
            if cysteine_count >= max_cysteines:
                # Exclude cysteine from available amino acids
                available_aa = "".join([aa for aa in AMINO_ACIDS if aa != "C"])
            else:
                available_aa = AMINO_ACIDS
            
            # Select amino acid (mock RL: prefer stable amino acids)
            # In real RL, this would be based on learned policy
            aa = random.choice(available_aa)
            if aa == "C":
                cysteine_count += 1
            
            sequence.append(aa)
        
        return "".join(sequence)
    
    def apply_functional_constraint(self, sequence: str, constraint: str) -> str:
        """
        Apply functional constraints to sequence
        Mock implementation - in real system would use domain knowledge
        """
        # Simple mock: ensure certain amino acids are present for binding
        if "binding" in constraint.lower():
            # Add some hydrophobic residues that might be important for binding
            if "W" not in sequence:
                idx = len(sequence) // 2
                sequence = sequence[:idx] + "W" + sequence[idx+1:]
        
        return sequence

