"""
Protein Architect - Expressibility-Aware Designer
FastAPI backend for protein design and optimization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
from dotenv import load_dotenv

from services.protein_generator import ProteinGenerator
from services.oracle import ExpressibilityOracle
from services.manufacturing_agent import ManufacturingAgent
from services.llm_agent import LLMAgent

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


@app.get("/")
async def root():
    return {
        "message": "Protein Architect API",
        "version": "1.0.0",
        "endpoints": ["/generate_protein", "/refine_protein", "/health"]
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

