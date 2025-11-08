"""
Protein-Protein Interaction (PPI) Prediction Service
Handles communication with SageMaker endpoint for PPI predictions
"""

import os
import logging
import boto3
import json
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)


class PPIService:
    """Service for predicting protein-protein interactions using SageMaker"""
    
    def __init__(self, endpoint_name: Optional[str] = None, 
                 region: str = "us-east-1",
                 use_local: bool = False,
                 local_url: str = "http://localhost:8080"):
        """
        Initialize PPI service
        
        Args:
            endpoint_name: SageMaker endpoint name
            region: AWS region
            use_local: If True, use local service instead of SageMaker
            local_url: Local service URL (if use_local=True)
        """
        self.use_local = use_local
        self.local_url = local_url
        
        if use_local:
            logger.info(f"Using local PPI service at {local_url}")
            self.sagemaker_runtime = None
            self.endpoint_name = None
        else:
            self.endpoint_name = endpoint_name or os.getenv("SAGEMAKER_PPI_ENDPOINT", "protein-ppi-endpoint")
            self.region = region
            
            try:
                self.sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
                logger.info(f"Initialized SageMaker client for endpoint: {self.endpoint_name}")
            except Exception as e:
                logger.warning(f"Could not initialize SageMaker client: {e}. Using local service.")
                self.use_local = True
                self.sagemaker_runtime = None
    
    def predict(self, protein_a: str, protein_b: str) -> Dict:
        """
        Predict protein-protein interaction
        
        Args:
            protein_a: UniProt ID of first protein
            protein_b: UniProt ID of second protein
        
        Returns:
            Dictionary with prediction results
        """
        if self.use_local:
            return self._predict_local(protein_a, protein_b)
        else:
            return self._predict_sagemaker(protein_a, protein_b)
    
    def _predict_local(self, protein_a: str, protein_b: str) -> Dict:
        """Predict using local service"""
        try:
            response = requests.post(
                f"{self.local_url}/invocations",
                json={"protein_a": protein_a, "protein_b": protein_b},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error in local prediction: {e}")
            # Return mock prediction
            return self._mock_prediction(protein_a, protein_b)
    
    def _predict_sagemaker(self, protein_a: str, protein_b: str) -> Dict:
        """Predict using SageMaker endpoint"""
        try:
            payload = json.dumps({
                "protein_a": protein_a,
                "protein_b": protein_b
            })
            
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType='application/json',
                Body=payload
            )
            
            result = json.loads(response['Body'].read().decode())
            return result
        
        except Exception as e:
            logger.error(f"Error in SageMaker prediction: {e}")
            # Return mock prediction as fallback
            return self._mock_prediction(protein_a, protein_b)
    
    def _mock_prediction(self, protein_a: str, protein_b: str) -> Dict:
        """Return mock prediction for testing/fallback"""
        # Simple hash-based mock (deterministic)
        hash_value = hash(f"{protein_a}_{protein_b}") % 100
        interacts = hash_value > 40  # 60% chance of interaction
        
        return {
            "interacts": interacts,
            "interaction_probability": float(hash_value) / 100.0,
            "confidence": "low" if abs(hash_value - 50) < 20 else "medium",
            "interaction_type": "binding",
            "type_confidence": 0.7,
            "protein_a": protein_a,
            "protein_b": protein_b,
            "note": "Mock prediction - model not available"
        }

