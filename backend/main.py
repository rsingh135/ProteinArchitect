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

from services.protein_generator import ProteinGenerator
from services.oracle import ExpressibilityOracle
from services.manufacturing_agent import ManufacturingAgent
from services.llm_agent import LLMAgent
from services.docking_service import DockingService
from services.gemini_service import GeminiProteinSearchService
from services.ppi_service import PPIService

# Initialize agentic research service (optional - may fail if DEDALUS_API_KEY not set)
try:
    from services.AgenticResearch import AgenticResearchService
    agentic_research_service = AgenticResearchService()
except (ImportError, ValueError) as e:
    logger.warning(f"Could not initialize AgenticResearch service: {e}")
    agentic_research_service = None

load_dotenv()

app = FastAPI(title="Protein Architect API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
protein_generator = ProteinGenerator()
oracle = ExpressibilityOracle()
manufacturing_agent = ManufacturingAgent()
llm_agent = LLMAgent()
docking_service = DockingService()

# Initialize PPI services
try:
    gemini_service = GeminiProteinSearchService()
except Exception as e:
    print(f"Warning: Could not initialize Gemini service: {e}")
    gemini_service = None

# Initialize PPI prediction service (use local for development, SageMaker for production)
use_local_ppi = os.getenv("USE_LOCAL_PPI", "true").lower() == "true"
ppi_service = PPIService(use_local=use_local_ppi)

# Global counter for retraining trigger
protein_generation_count = 0


class ProteinDesignRequest(BaseModel):
    target_name: str
    max_length: Optional[int] = 200
    max_cysteines: Optional[int] = 5
    functional_constraint: Optional[str] = None
    additional_constraints: Optional[str] = None


class RefinementRequest(BaseModel):
    sequence: str
    refinement_prompt: str


class DockingRequest(BaseModel):
    protein_pdb: str
    ligand_smiles: Optional[str] = None
    ligand_mol2: Optional[str] = None
    ligand_pdb: Optional[str] = None
    tool: str = "vina"  # vina, diffdock, swissdock, rdock
    center: Optional[List[float]] = None  # [x, y, z]
    size: Optional[List[float]] = None  # [x, y, z]
    exhaustiveness: Optional[int] = 8
    num_modes: Optional[int] = 9


class ProteinSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5


class PPIPredictionRequest(BaseModel):
    protein_a: str  # UniProt ID
    protein_b: str  # UniProt ID


class ProteinResearchRequest(BaseModel):
    protein_id: str  # UniProt ID (e.g., "P01308")
    model: Optional[str] = "google/gemini-1.5-pro"  # Model: "google/gemini-1.5-pro" (default), "google/gemini-1.5-flash", "gemini", "openai/gpt-4.1", etc.
    include_novel: Optional[bool] = True  # Include novel research section
    months_recent: Optional[int] = 6  # Months to consider for novel research


@app.get("/")
async def root():
    return {
        "message": "Protein Architect API",
        "version": "1.0.0",
        "endpoints": [
            "/generate_protein",
            "/refine_protein",
            "/dock_ligand",
            "/docking_tools",
            "/search_proteins",
            "/predict_ppi",
            "/research_protein",
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


@app.post("/refine_protein")
async def refine_protein(request: RefinementRequest):
    """
    Refine protein design using conversational LLM agent
    """
    try:
        # Use LLM agent to refine the sequence
        refinement_result = llm_agent.refine_protein(
            sequence=request.sequence,
            refinement_prompt=request.refinement_prompt,
            oracle=oracle
        )
        
        return refinement_result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/protein_count")
async def get_protein_count():
    """Get current protein generation count"""
    return {"count": protein_generation_count}


@app.post("/dock_ligand")
async def dock_ligand(request: DockingRequest):
    """
    Perform molecular docking of a ligand to a protein structure.
    
    Input:
    - protein_pdb: Protein structure in PDB format
    - ligand_smiles, ligand_mol2, or ligand_pdb: Ligand structure
    - tool: Docking tool to use (vina, diffdock, swissdock, rdock)
    - center: Optional binding site center [x, y, z]
    - size: Optional search space size [x, y, z]
    
    Returns:
    - Docking results with binding poses and affinities
    """
    try:
        center_tuple = tuple(request.center) if request.center else None
        size_tuple = tuple(request.size) if request.size else (20, 20, 20)
        
        results = docking_service.dock_ligand(
            protein_pdb=request.protein_pdb,
            ligand_smiles=request.ligand_smiles,
            ligand_mol2=request.ligand_mol2,
            ligand_pdb=request.ligand_pdb,
            tool=request.tool,
            center=center_tuple,
            size=size_tuple,
            exhaustiveness=request.exhaustiveness or 8,
            num_modes=request.num_modes or 9
        )
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/docking_tools")
async def get_docking_tools():
    """Get list of available docking tools and their status."""
    return docking_service.get_available_tools()


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
        model: Model to use for research (default: "openai/gpt-4.1")
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
            model=request.model or "google/gemini-1.5-pro",
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

