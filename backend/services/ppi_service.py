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
        
        # Check if we're in production (Render, Heroku, etc.)
        self.is_production = os.getenv("ENVIRONMENT") == "production" or os.getenv("RENDER") is not None
        
        if use_local:
            if self.is_production:
                # In production, don't try to connect to localhost - use mock predictions directly
                logger.info("Using mock PPI predictions (production mode, local service not available)")
                self.use_mock_only = True
            else:
                # In development, try to connect to local service
                logger.info(f"Using local PPI service at {local_url}")
                self.use_mock_only = False
            self.sagemaker_runtime = None
            self.endpoint_name = None
        else:
            self.endpoint_name = endpoint_name or os.getenv("SAGEMAKER_PPI_ENDPOINT", "protein-ppi-endpoint")
            self.region = region
            self.use_mock_only = False
            
            try:
                self.sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
                logger.info(f"Initialized SageMaker client for endpoint: {self.endpoint_name}")
            except Exception as e:
                logger.warning(f"Could not initialize SageMaker client: {e}. Using mock predictions.")
                self.use_local = True
                self.use_mock_only = True
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
            if self.use_mock_only:
                # In production, use mock predictions directly
                return self._mock_prediction(protein_a, protein_b)
            else:
                # In development, try local service first
                return self._predict_local(protein_a, protein_b)
        else:
            return self._predict_sagemaker(protein_a, protein_b)
    
    def _predict_local(self, protein_a: str, protein_b: str) -> Dict:
        """Predict using local service (development only)"""
        try:
            response = requests.post(
                f"{self.local_url}/invocations",
                json={"protein_a": protein_a, "protein_b": protein_b},
                timeout=5  # Shorter timeout for local service
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.ConnectionError:
            logger.warning(f"Local PPI service at {self.local_url} not available. Using mock predictions.")
            return self._mock_prediction(protein_a, protein_b)
        except Exception as e:
            logger.warning(f"Error in local prediction: {e}. Using mock predictions.")
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
        # Use abs() to ensure positive hash for consistent results
        hash_value = abs(hash(f"{protein_a}_{protein_b}")) % 100
        interacts = hash_value > 40  # 60% chance of interaction
        
        # Determine confidence based on hash value
        if hash_value > 70 or hash_value < 30:
            confidence = "high"
        elif hash_value > 60 or hash_value < 40:
            confidence = "medium"
        else:
            confidence = "low"
        
        return {
            "interacts": interacts,
            "interaction_probability": float(hash_value) / 100.0,
            "confidence": confidence,
            "interaction_type": "binding" if interacts else "no_interaction",
            "type_confidence": 0.7 if interacts else 0.6,
            "protein_a": protein_a,
            "protein_b": protein_b,
            "note": "Mock prediction - actual model not configured. Set up SageMaker endpoint or local service for real predictions."
        }

