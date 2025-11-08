"""
SageMaker Inference Service for PPI Prediction
Handles /ping and /invocations endpoints for SageMaker deployment
"""

import json
import logging
import os
import pickle
import torch
import torch.nn as nn
import requests
from typing import Dict, List, Optional, Tuple
import numpy as np

# Try to import ESM
try:
    import esm
    ESM_AVAILABLE = True
except ImportError:
    ESM_AVAILABLE = False
    print("Warning: ESM not available. Install with: pip install fair-esm")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model architecture (must match train_model.py)
class PPIPredictor(nn.Module):
    """Neural network for predicting protein-protein interactions"""
    
    def __init__(self, input_dim: int = 2560, hidden_dims: List[int] = [512, 256, 128], 
                 num_interaction_types: int = 5, dropout: float = 0.3):
        super(PPIPredictor, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        self.feature_extractor = nn.Sequential(*layers)
        self.binary_classifier = nn.Sequential(
            nn.Linear(prev_dim, 1),
            nn.Sigmoid()
        )
        self.type_classifier = nn.Sequential(
            nn.Linear(prev_dim, num_interaction_types),
            nn.Softmax(dim=1)
        )
    
    def forward(self, x):
        features = self.feature_extractor(x)
        binary_prob = self.binary_classifier(features)
        interaction_type = self.type_classifier(features)
        return binary_prob, interaction_type


class PPIPredictionService:
    """Service for predicting protein-protein interactions"""
    
    def __init__(self, model_path: str = "/opt/ml/model/model.pth", 
                 embeddings_cache_path: str = "/opt/ml/model/embeddings_cache.pkl",
                 device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        """
        Initialize the PPI prediction service
        
        Args:
            model_path: Path to trained model file
            embeddings_cache_path: Path to embeddings cache file
            device: Device to run inference on
        """
        self.device = device
        logger.info(f"Initializing PPI Prediction Service on {device}")
        
        # Load embeddings cache
        if os.path.exists(embeddings_cache_path):
            logger.info(f"Loading embeddings cache from {embeddings_cache_path}")
            with open(embeddings_cache_path, 'rb') as f:
                self.embeddings_cache = pickle.load(f)
        else:
            logger.warning(f"Embeddings cache not found at {embeddings_cache_path}")
            self.embeddings_cache = {}
        
        # Load model
        if os.path.exists(model_path):
            logger.info(f"Loading model from {model_path}")
            checkpoint = torch.load(model_path, map_location=device)
            
            # Initialize model
            self.model = PPIPredictor(input_dim=2560)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model = self.model.to(device)
            self.model.eval()
            
            logger.info("Model loaded successfully")
        else:
            logger.error(f"Model not found at {model_path}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load ESM model for computing embeddings on-the-fly if needed
        if ESM_AVAILABLE:
            try:
                logger.info("Loading ESM model for on-the-fly embedding computation")
                self.esm_model, self.esm_alphabet = esm.pretrained.load_model_and_alphabet_hub(
                    "facebook/esm2_t33_650M_UR50D"
                )
                self.esm_model = self.esm_model.to(device)
                self.esm_model.eval()
                self.esm_batch_converter = self.esm_alphabet.get_batch_converter()
                self.esm_available = True
            except Exception as e:
                logger.warning(f"Could not load ESM model: {e}")
                self.esm_available = False
        else:
            self.esm_available = False
    
    def get_protein_sequence(self, uniprot_id: str) -> Optional[str]:
        """Fetch protein sequence from UniProt API"""
        try:
            url = f"https://www.uniprot.org/uniprot/{uniprot_id}.fasta"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                sequence = ''.join(lines[1:])
                return sequence
            return None
        except Exception as e:
            logger.error(f"Error fetching sequence for {uniprot_id}: {e}")
            return None
    
    def compute_embedding(self, protein_id: str) -> Optional[torch.Tensor]:
        """Compute or retrieve embedding for a protein"""
        # Check cache first
        if protein_id in self.embeddings_cache:
            return self.embeddings_cache[protein_id].to(self.device)
        
        # If not in cache and ESM available, compute on-the-fly
        if self.esm_available:
            sequence = self.get_protein_sequence(protein_id)
            if sequence:
                if len(sequence) > 1024:
                    sequence = sequence[:1024]
                
                # Convert to batch format
                batch_labels, batch_strs, batch_tokens = self.esm_batch_converter([("", sequence)])
                batch_tokens = batch_tokens.to(self.device)
                
                # Compute embedding
                with torch.no_grad():
                    results = self.esm_model(batch_tokens, repr_layers=[33])
                    token_embeddings = results["representations"][33]
                    embedding = token_embeddings[:, 1:-1, :].mean(dim=1).squeeze(0)
                
                return embedding
        
        # Fallback: return zero vector
        logger.warning(f"Embedding not found for {protein_id}, using zero vector")
        return torch.zeros(1280).to(self.device)
    
    def predict(self, protein_a: str, protein_b: str) -> Dict:
        """
        Predict protein-protein interaction
        
        Args:
            protein_a: UniProt ID of first protein
            protein_b: UniProt ID of second protein
        
        Returns:
            Dictionary with prediction results
        """
        # Get embeddings
        emb_a = self.compute_embedding(protein_a)
        emb_b = self.compute_embedding(protein_b)
        
        # Concatenate embeddings
        combined_emb = torch.cat([emb_a, emb_b]).unsqueeze(0)
        
        # Predict
        with torch.no_grad():
            binary_prob, interaction_type = self.model(combined_emb)
            binary_prob = binary_prob.item()
            interaction_type_probs = interaction_type.squeeze().cpu().numpy()
        
        # Determine interaction type (simplified - you can map to actual types)
        interaction_types = ["binding", "regulatory", "catalytic", "structural", "other"]
        predicted_type_idx = np.argmax(interaction_type_probs)
        predicted_type = interaction_types[predicted_type_idx]
        type_confidence = float(interaction_type_probs[predicted_type_idx])
        
        # Determine confidence level
        if binary_prob > 0.8:
            confidence_level = "high"
        elif binary_prob > 0.6:
            confidence_level = "medium"
        elif binary_prob > 0.4:
            confidence_level = "low"
        else:
            confidence_level = "very_low"
        
        return {
            "interacts": binary_prob > 0.5,
            "interaction_probability": float(binary_prob),
            "confidence": confidence_level,
            "interaction_type": predicted_type,
            "type_confidence": type_confidence,
            "protein_a": protein_a,
            "protein_b": protein_b
        }


# Global service instance
service = None


def model_fn(model_dir: str):
    """
    Load the model for inference
    This function is called by SageMaker when the endpoint starts
    """
    global service
    logger.info(f"Loading model from {model_dir}")
    
    model_path = os.path.join(model_dir, "model.pth")
    embeddings_cache_path = os.path.join(model_dir, "embeddings_cache.pkl")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    service = PPIPredictionService(
        model_path=model_path,
        embeddings_cache_path=embeddings_cache_path,
        device=device
    )
    
    return service


def input_fn(request_body: str, request_content_type: str):
    """
    Deserialize and prepare the prediction input
    """
    if request_content_type == "application/json":
        input_data = json.loads(request_body)
        return input_data
    else:
        raise ValueError(f"Unsupported content type: {request_content_type}")


def predict_fn(input_data: Dict, model):
    """
    Perform prediction on the deserialized input
    """
    protein_a = input_data.get("protein_a")
    protein_b = input_data.get("protein_b")
    
    if not protein_a or not protein_b:
        raise ValueError("Both protein_a and protein_b must be provided")
    
    prediction = model.predict(protein_a, protein_b)
    return prediction


def output_fn(prediction: Dict, content_type: str):
    """
    Serialize the prediction result
    """
    if content_type == "application/json":
        return json.dumps(prediction)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")


# Flask app for local testing and SageMaker
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route("/ping", methods=["GET"])
def ping():
    """Health check endpoint for SageMaker"""
    return jsonify({"status": "healthy"}), 200


@app.route("/invocations", methods=["POST"])
def invocations():
    """
    Inference endpoint for SageMaker
    Expects JSON: {"protein_a": "P01308", "protein_b": "P04637"}
    """
    try:
        # Get input data
        input_data = request.get_json()
        
        if not input_data:
            return jsonify({"error": "No input data provided"}), 400
        
        protein_a = input_data.get("protein_a")
        protein_b = input_data.get("protein_b")
        
        if not protein_a or not protein_b:
            return jsonify({"error": "Both protein_a and protein_b must be provided"}), 400
        
        # Make prediction
        prediction = service.predict(protein_a, protein_b)
        
        return jsonify(prediction), 200
    
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # For local testing
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_dir", type=str, default="./model",
                       help="Directory containing model files")
    parser.add_argument("--port", type=int, default=8080,
                       help="Port to run the service on")
    
    args = parser.parse_args()
    
    # Initialize service
    model_fn(args.model_dir)
    
    # Run Flask app
    app.run(host="0.0.0.0", port=args.port, debug=False)

