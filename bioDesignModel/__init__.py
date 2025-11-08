""" IMPLEMENTATION FOR BACKEND: 
# backend/app/routes/ai_routes.py
from biogenesis_model import pipeline

bio = pipeline.BioGenesis()

@app.post("/generate_organism")
async def generate_organism(request: Request):
    data = await request.json()
    result = bio.run_pipeline(prompt=data["prompt"])
    return JSONResponse(result)
    
"""

# Import dataloader functions (always available)
from .dataloader import (
    fetch_uniprot,
    create_protein_dataset,
    create_dataloader,
    create_sequence_dataloader
)

# Import other modules (may fail if dependencies missing, but that's okay)
try:
    from .pipline import BioGenesis  # Note: file is named pipline.py (typo in filename)
except (ImportError, ModuleNotFoundError, AttributeError):
    BioGenesis = None

try:
    from .llm_model import BioDesignModel
except (ImportError, ModuleNotFoundError, AttributeError):
    BioDesignModel = None

try:
    from .stability_predictor import StabilityPredictor
except (ImportError, ModuleNotFoundError, AttributeError):
    StabilityPredictor = None

try:
    from .feature_extractor import compute_features
except (ImportError, ModuleNotFoundError, AttributeError):
    compute_features = None

__all__ = [
    "BioGenesis",
    "BioDesignModel",
    "StabilityPredictor",
    "fetch_uniprot",
    "create_protein_dataset",
    "create_dataloader",
    "create_sequence_dataloader",
    "compute_features",
]