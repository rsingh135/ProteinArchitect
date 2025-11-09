"""
Protein Architect - Expressibility-Aware Designer
FastAPI backend for protein design and optimization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables FIRST before initializing services
load_dotenv()

from services.protein_generator import ProteinGenerator
from services.oracle import ExpressibilityOracle
from services.manufacturing_agent import ManufacturingAgent
from services.gemini_service import GeminiProteinSearchService
from services.ppi_service import PPIService
from services.chat_service import ProteinChatService
from services.alphafold_ppi_service import AlphaFoldPPIService
from services.veo_video_service import VeoVideoService

# Initialize agentic research service (optional - may fail if DEDALUS_API_KEY not set)
try:
    from services.AgenticResearch import AgenticResearchService
    agentic_research_service = AgenticResearchService()
    logger.info("AgenticResearch service initialized successfully")
except ImportError as e:
    logger.error(f"Could not import AgenticResearch service: {e}")
    logger.error("This usually means dedalus-labs is not installed in the current Python environment.")
    import traceback
    logger.error(f"Full traceback:\n{traceback.format_exc()}")
    logger.warning("Try: pip install dedalus-labs (or restart the server if you just installed it)")
    agentic_research_service = None
except ValueError as e:
    logger.warning(f"Could not initialize AgenticResearch service: {e}")
    logger.warning("This usually means DEDALUS_API_KEY is not set in your .env file")
    logger.warning(f"Current DEDALUS_API_KEY value: {'SET' if os.getenv('DEDALUS_API_KEY') else 'NOT SET'}")
    agentic_research_service = None
except Exception as e:
    logger.warning(f"Unexpected error initializing AgenticResearch service: {e}")
    import traceback
    logger.warning(traceback.format_exc())
    agentic_research_service = None

app = FastAPI(title="Protein Architect API", version="1.0.0")

# CORS middleware for frontend communication
# Allow all localhost ports for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
protein_generator = ProteinGenerator()
oracle = ExpressibilityOracle()
manufacturing_agent = ManufacturingAgent()

# Initialize PPI services
try:
    gemini_service = GeminiProteinSearchService()
except Exception as e:
    logger.warning(f"Could not initialize Gemini service: {e}")
    gemini_service = None

# Initialize chat service
try:
    chat_service = ProteinChatService()
except Exception as e:
    logger.warning(f"Could not initialize chat service: {e}")
    chat_service = None

# Initialize PPI prediction service (use local for development, SageMaker for production)
use_local_ppi = os.getenv("USE_LOCAL_PPI", "true").lower() == "true"
ppi_service = PPIService(use_local=use_local_ppi)

# Initialize AlphaFold PPI service for sequence-based predictions
try:
    alphafold_ppi_service = AlphaFoldPPIService()
    logger.info("AlphaFold PPI service initialized successfully")
except Exception as e:
    logger.warning(f"Could not initialize AlphaFold PPI service: {e}")
    alphafold_ppi_service = None

# Initialize Veo video service
try:
    veo_video_service = VeoVideoService()
    logger.info("Veo video service initialized successfully")
except Exception as e:
    logger.warning(f"Could not initialize Veo video service: {e}")
    logger.warning("GEMINI_API_KEY is required for video generation")
    veo_video_service = None

# Global counter for retraining trigger
protein_generation_count = 0


class ProteinDesignRequest(BaseModel):
    target_name: str
    max_length: Optional[int] = 200
    max_cysteines: Optional[int] = 5
    functional_constraint: Optional[str] = None
    additional_constraints: Optional[str] = None


class ProteinSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5


class PPIPredictionRequest(BaseModel):
    protein_a: str  # UniProt ID
    protein_b: str  # UniProt ID


class PPISequenceRequest(BaseModel):
    sequence_a: str  # Amino acid sequence
    sequence_b: str  # Amino acid sequence
    protein_a_name: Optional[str] = None
    protein_b_name: Optional[str] = None


class PPIVideoRequest(BaseModel):
    protein_a_image: Optional[str] = None  # Base64 encoded image
    protein_b_image: Optional[str] = None  # Base64 encoded image
    complex_image: Optional[str] = None    # Base64 encoded image
    protein_a_pdb: Optional[str] = None   # PDB data for Protein A (fallback)
    protein_b_pdb: Optional[str] = None    # PDB data for Protein B (fallback)
    complex_pdb: Optional[str] = None     # PDB data for complex (fallback)
    protein_a_uniprot_id: Optional[str] = None  # UniProt ID for Protein A
    protein_b_uniprot_id: Optional[str] = None  # UniProt ID for Protein B
    protein_a_name: Optional[str] = "Protein A"
    protein_b_name: Optional[str] = "Protein B"


class ProteinResearchRequest(BaseModel):
    protein_id: str  # UniProt ID (e.g., "P01308")
    model: Optional[str] = "google/gemini-2.0-flash-lite"  # Model: "google/gemini-2.0-flash-lite" (default)
    include_novel: Optional[bool] = True  # Include novel research section
    months_recent: Optional[int] = 6  # Months to consider for novel research


class ChatMessageRequest(BaseModel):
    message: str
    target_protein: Optional[Dict] = None
    binder_protein: Optional[Dict] = None
    interaction_stats: Optional[Dict] = None


@app.get("/")
async def root():
    return {
        "message": "Protein Architect API",
        "version": "1.0.0",
        "endpoints": [
            "/generate_protein",
            "/search_proteins",
            "/predict_ppi",
            "/research_protein",
            "/list_models",
            "/chat",
            "/health"
        ]
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/generate_protein")
async def generate_protein(request: ProteinDesignRequest):
    """
    Generate a novel protein sequence with expressibility optimization
    """
    global protein_generation_count
    
    try:
        # Generate protein sequence (mock RL-based generation)
        sequence = protein_generator.generate(
            target_name=request.target_name,
            max_length=request.max_length,
            max_cysteines=request.max_cysteines,
            functional_constraint=request.functional_constraint
        )
        
        # Query Expressibility Oracle for stability and manufacturability
        oracle_result = oracle.predict(sequence)
        
        # Generate manufacturing protocol
        manufacturing_protocol = manufacturing_agent.generate_protocol(
            sequence=sequence,
            stability_score=oracle_result["stability_score"],
            instability_index=oracle_result["instability_index"]
        )
        
        # Increment counter and check for retraining trigger
        protein_generation_count += 1
        retraining_triggered = False
        retraining_result = None
        if protein_generation_count > 5:
            retraining_triggered = True
            # Trigger retraining in AWS SageMaker (mock)
            print(f"[RETRAINING TRIGGER] Protein count: {protein_generation_count}")
            retraining_result = oracle.trigger_retraining([])
            print(f"[RETRAINING] {retraining_result}")
        
        return {
            "sequence": sequence,
            "length": len(sequence),
            "oracle_results": oracle_result,
            "manufacturing_protocol": manufacturing_protocol,
            "retraining_triggered": retraining_triggered,
            "retraining_result": retraining_result,
            "generation_count": protein_generation_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/protein_count")
async def get_protein_count():
    """Get current protein generation count"""
    return {"count": protein_generation_count}


@app.post("/search_proteins")
async def search_proteins(request: ProteinSearchRequest):
    """
    Search for proteins using natural language query (Gemini API)
    
    Returns list of candidate proteins with UniProt IDs
    """
    try:
        if not gemini_service:
            raise HTTPException(
                status_code=503, 
                detail="Gemini service not available. Please set GEMINI_API_KEY environment variable."
            )
        
        results = gemini_service.search_proteins(
            query=request.query,
            max_results=request.max_results or 5
        )
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        logger.error(f"Error in protein search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict_ppi")
async def predict_ppi(request: PPIPredictionRequest):
    """
    Predict protein-protein interaction between two proteins
    
    Args:
        protein_a: UniProt ID of first protein
        protein_b: UniProt ID of second protein
    
    Returns:
        Prediction results with interaction probability, confidence, and type
    """
    try:
        # Validate protein IDs (basic check)
        if not request.protein_a or not request.protein_b:
            raise HTTPException(status_code=400, detail="Both protein_a and protein_b are required")
        
        # Make prediction
        prediction = ppi_service.predict(request.protein_a, request.protein_b)
        
        # Add metadata
        prediction["protein_a"] = request.protein_a
        prediction["protein_b"] = request.protein_b
        
        return prediction
    
    except Exception as e:
        logger.error(f"Error in PPI prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict_ppi_from_sequences")
async def predict_ppi_from_sequences(request: PPISequenceRequest):
    """
    Predict protein-protein interaction from amino acid sequences using AlphaFold
    
    Args:
        sequence_a: Amino acid sequence for protein A
        sequence_b: Amino acid sequence for protein B
        protein_a_name: Optional name for protein A
        protein_b_name: Optional name for protein B
    
    Returns:
        Prediction results with structures, interaction probability, and 3D complex
    """
    try:
        if not alphafold_ppi_service:
            raise HTTPException(
                status_code=503, 
                detail="AlphaFold PPI service not available"
            )
        
        # Validate sequences
        if not request.sequence_a or not request.sequence_b:
            raise HTTPException(
                status_code=400, 
                detail="Both sequence_a and sequence_b are required"
            )
        
        # Make prediction
        prediction = await alphafold_ppi_service.predict_from_sequences(
            request.sequence_a,
            request.sequence_b,
            request.protein_a_name,
            request.protein_b_name
        )
        
        return prediction
    
    except ValueError as e:
        logger.error(f"Validation error in PPI sequence prediction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in PPI sequence prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_ppi_video")
async def generate_ppi_video(request: PPIVideoRequest):
    """
    Generate a video of protein-protein interaction using Veo 3.1 Fast Preview API
    
    Args:
        protein_a_image: Base64 encoded image of Protein A
        protein_b_image: Base64 encoded image of Protein B
        complex_image: Base64 encoded image of the docked complex
        protein_a_name: Optional name for Protein A
        protein_b_name: Optional name for Protein B
    
    Returns:
        Video data (base64 encoded) and mime type
    """
    try:
        if not veo_video_service:
            raise HTTPException(
                status_code=503,
                detail="Veo video service not available. GEMINI_API_KEY is required."
            )
        
        # Validate we have either images or PDB data/UniProt IDs
        has_images = request.protein_a_image and request.protein_b_image and request.complex_image
        has_pdb_data = (request.protein_a_pdb or request.protein_a_uniprot_id) and \
                      (request.protein_b_pdb or request.protein_b_uniprot_id) and \
                      (request.complex_pdb or (request.protein_a_pdb and request.protein_b_pdb))
        
        if not has_images and not has_pdb_data:
            raise HTTPException(
                status_code=400,
                detail="Either images (protein_a_image, protein_b_image, complex_image) or PDB data/UniProt IDs are required"
            )
        
        # Generate video
        result = await veo_video_service.generate_interaction_video(
            protein_a_image=request.protein_a_image,
            protein_b_image=request.protein_b_image,
            complex_image=request.complex_image,
            protein_a_pdb=request.protein_a_pdb,
            protein_b_pdb=request.protein_b_pdb,
            complex_pdb=request.complex_pdb,
            protein_a_uniprot_id=request.protein_a_uniprot_id,
            protein_b_uniprot_id=request.protein_b_uniprot_id,
            protein_a_name=request.protein_a_name,
            protein_b_name=request.protein_b_name
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PPI video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/list_models")
async def list_models():
    """
    List available models for research.
    Helps identify which models are actually supported by Dedalus Labs.
    """
    try:
        if not agentic_research_service:
            raise HTTPException(
                status_code=503,
                detail="AgenticResearch service not available. Please set DEDALUS_API_KEY environment variable."
            )
        
        models = await agentic_research_service.list_available_models()
        return {
            "available_models": models,
            "note": "These are common models. Try them to see which ones work with your Dedalus Labs API key."
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@app.post("/research_protein")
async def research_protein(request: ProteinResearchRequest):
    """
    Conduct comprehensive research on a protein using AI agents (Dedalus Labs).
    
    Uses multiple MCP servers to gather:
    - Academic papers and publications
    - Use cases and applications
    - Drug development references
    - Novel research findings
    - Citations with hyperlinks
    
    Args:
        protein_id: UniProt protein ID (e.g., "P01308" for insulin)
        model: Model to use for research (default: "google/gemini-1.5-flash" - fast, 10 sources max)
        include_novel: Whether to include novel/recent research section
        months_recent: Number of months to consider for "novel" research
    
    Returns:
        Structured research results with citations, papers, use cases, 
        drug development info, novel research, and summary
    """
    try:
        if not agentic_research_service:
            raise HTTPException(
                status_code=503,
                detail="AgenticResearch service not available. Please set DEDALUS_API_KEY environment variable."
            )
        
        # Validate protein ID format (basic check)
        if not request.protein_id or len(request.protein_id.strip()) == 0:
            raise HTTPException(status_code=400, detail="protein_id is required")
        
        # Conduct research
        results = await agentic_research_service.research_protein(
            protein_id=request.protein_id.strip(),
            model=request.model or "google/gemini-2.0-flash-lite",
            include_novel=request.include_novel if request.include_novel is not None else True,
            months_recent=request.months_recent or 6
        )
        
        return results
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in protein research: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@app.post("/chat")
async def chat(request: ChatMessageRequest):
    """
    Chat with AI assistant about proteins currently loaded in the viewer.
    
    Uses Gemini API to answer questions about:
    - Target protein structure, function, and properties
    - Partner/binder protein (if loaded)
    - Protein-protein interactions (if available)
    - Binding sites, confidence scores, functional domains, etc.
    
    Args:
        message: User's question
        target_protein: Target protein data (optional)
        binder_protein: Partner protein data (optional)
        interaction_stats: Interaction statistics (optional)
    
    Returns:
        AI response with answer to the question
    """
    try:
        if not chat_service:
            raise HTTPException(
                status_code=503,
                detail="Chat service not available. Please set GEMINI_API_KEY environment variable."
            )
        
        if not request.message or len(request.message.strip()) == 0:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Get chat response
        response = chat_service.chat(
            message=request.message,
            target_protein=request.target_protein,
            binder_protein=request.binder_protein,
            interaction_stats=request.interaction_stats
        )
        
        return {
            "message": request.message,
            "response": response,
            "has_target_protein": request.target_protein is not None,
            "has_binder_protein": request.binder_protein is not None,
            "has_interactions": request.interaction_stats is not None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

