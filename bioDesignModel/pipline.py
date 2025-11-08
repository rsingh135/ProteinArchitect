# biogenesis_model/pipeline.py
"""
BioGenesis Pipeline Module
--------------------------
This file provides a single class interface (BioGenesis) that
coordinates:
 - LLM blueprint & sequence generation
 - Stability evaluation
 - RL optimization
"""

import logging
from .llm_model import BioDesignModel
from .stability_predictor import StabilityPredictor
from .optimizer import optimize_sequence
from .feature_extractor import compute_features

logger = logging.getLogger(__name__)

class BioGenesis:
    """Unified class for running the AI organism design pipeline."""

    def __init__(self, model_name="microsoft/biogpt"):
        self.model = BioDesignModel(model_name=model_name)
        self.predictor = StabilityPredictor()

    def run_pipeline(self, prompt: str, optimization_steps: int = 10):
        """
        Full pipeline for backend integration:
            1. Generate blueprint & sequences
            2. Compute initial stability
            3. Optimize sequences with RL-like mutation
            4. Return processed results
        """
        logger.info(f"Running BioGenesis pipeline for prompt: {prompt}")
        blueprint = self.model.generate_blueprint(prompt)
        sequences = self.model.generate_sequences(blueprint)

        results = {}
        for name, seq in sequences.items():
            seq_clean = seq.split("\n")[-1]  # remove FASTA header
            optimized_seq = optimize_sequence(seq_clean, self.predictor, steps=optimization_steps)
            features = compute_features(optimized_seq)
            results[name] = {
                "optimized_sequence": optimized_seq,
                "biochemical_features": features,
            }

        return {"blueprint": blueprint, "results": results}
