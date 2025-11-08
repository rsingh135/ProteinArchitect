"""
Expressibility Oracle - Predicts protein stability and manufacturability
This would normally be deployed on AWS SageMaker
"""

import numpy as np
from typing import Dict
import pickle
import os
from .aws_sagemaker import SageMakerOracle


class ExpressibilityOracle:
    """
    Oracle that predicts protein stability and expressibility
    In production, this would be a GNN/Transformer model on AWS SageMaker
    """
    
    def __init__(self):
        # In production, this would load a pre-trained model
        # For hackathon, we use a simple heuristic-based predictor
        self.instability_threshold = 40.0
        # Initialize SageMaker Oracle (mock for hackathon)
        self.sagemaker_oracle = SageMakerOracle()
    
    def predict(self, sequence: str, use_sagemaker: bool = True) -> Dict:
        """
        Predict stability and manufacturability metrics
        Returns: instability_index, stability_score, yield_prediction, cost_penalty
        """
        # Try to use SageMaker endpoint (mock for hackathon)
        if use_sagemaker:
            try:
                result = self.sagemaker_oracle.predict(sequence)
                result["prediction_source"] = "aws_sagemaker"
                return result
            except Exception as e:
                print(f"SageMaker prediction failed, using local fallback: {e}")
        
        # Fallback to local calculation
        # Calculate instability index using mock GNN logic
        instability_index = self._calculate_instability_index(sequence)
        
        # Stability score (inverse of instability)
        stability_score = max(0, 100 - instability_index)
        
        # Yield prediction based on stability
        if instability_index < 30:
            yield_prediction = 1.5  # g/L
            host_cell = "CHO Cells"
        elif instability_index < 40:
            yield_prediction = 0.8  # g/L
            host_cell = "E. coli"
        else:
            yield_prediction = 0.2  # g/L
            host_cell = "E. coli (Low Yield)"
        
        # Cost penalty based on instability
        base_cost = 100  # $/gram
        cost_penalty = max(0, (instability_index - 30) * 10)
        cost_per_gram = base_cost + cost_penalty
        
        return {
            "instability_index": round(instability_index, 2),
            "stability_score": round(stability_score, 2),
            "yield_prediction": round(yield_prediction, 2),
            "host_cell": host_cell,
            "cost_per_gram": round(cost_per_gram, 2),
            "cost_penalty": round(cost_penalty, 2),
            "is_stable": instability_index < self.instability_threshold,
            "prediction_source": "local_fallback"
        }
    
    def _calculate_instability_index(self, sequence: str) -> float:
        """
        Mock instability index calculation
        In production, this would use a trained model (GNN/Transformer)
        Real implementation would use Dipeptide Instability Index or learned features
        """
        # Simple heuristic: count problematic patterns
        instability = 20.0  # Base instability
        
        # Penalize long sequences
        if len(sequence) > 150:
            instability += (len(sequence) - 150) * 0.1
        
        # Penalize high cysteine content
        cys_count = sequence.count("C")
        if cys_count > 3:
            instability += (cys_count - 3) * 2
        
        # Penalize certain amino acid combinations
        problematic_pairs = ["PP", "GG", "AA", "SS"]
        for pair in problematic_pairs:
            instability += sequence.count(pair) * 0.5
        
        # Add some randomness to simulate model uncertainty
        rng = np.random.default_rng()
        instability += rng.normal(0, 2)
        
        return max(0, min(100, instability))
    
    def query_aws_sagemaker(self, sequence: str) -> Dict:
        """
        Query AWS SageMaker endpoint for prediction
        Mock implementation - in production would call actual SageMaker endpoint
        """
        return self.sagemaker_oracle.predict(sequence)
    
    def trigger_retraining(self, training_data: list) -> Dict:
        """
        Trigger retraining of the SageMaker model
        """
        return self.sagemaker_oracle.trigger_retraining(training_data)

