# 🤔 Clarifying Questions for PPI Prediction Pipeline

## Understanding Your Vision

Based on your description, here's the proposed flow:
```
User Input (Natural Language) 
  → Step 1: LLM → Protein ID(s) 
  → Step 2: Two Protein IDs → HINT-trained Model → PPI Prediction 
  → Display Interaction
```

## Critical Questions

### 1. **Protein ID Format & Selection**
- **Question**: When the user enters natural language (e.g., "human insulin"), should the system:
  - Return a single Protein ID (UniProt ID like `P01308`) and allow the user to select a second protein?
  - Return multiple candidate proteins and let the user choose two?
  - Automatically find the "best match" and require two separate searches?
  - Support searching for two proteins in one query (e.g., "human insulin and human receptor")?

**Recommendation**: Return top 3-5 candidates with names/descriptions, let user select two.

### 2. **Protein ID Type for HINT Model**
- **Question**: The HINT dataset uses UniProt IDs (e.g., `A0A024R2I8`, `F1D8Q5`). Should we:
  - Use UniProt IDs directly from the search?
  - Map gene names to UniProt IDs?
  - Handle both formats?

**Current Dataset Format**: `Uniprot_A`, `Uniprot_B` columns
**Recommendation**: Use UniProt IDs directly, add gene name → UniProt mapping for user-friendly display.

### 3. **PPI Prediction Output Format**
- **Question**: What should the model predict?
  - Binary classification (interacts: Yes/No)?
  - Interaction probability/confidence score (0-1)?
  - Interaction type (binding, regulatory, etc.)?
  - Binding affinity/strength?

**HINT Dataset**: Binary interactions with quality scores
**Recommendation**: Probability score (0-1) + confidence level + interaction type if available.

### 4. **Model Architecture & Training**
- **Question**: What model architecture do you want?
  - Graph Neural Network (GNN) - good for PPI prediction
  - Transformer-based (ESM embeddings + classifier)
  - Traditional ML (Random Forest, XGBoost on features)
  - Hybrid approach?

**Recommendation**: Start with ESM2 embeddings + ML classifier (faster to train), can upgrade to GNN later.

### 5. **Negative Sample Generation**
- **Question**: How should we generate negative samples for training?
  - Random protein pairs (not in HINT positive set)?
  - Negative sampling based on different cellular compartments?
  - Use negative examples from HINT dataset if available?
  - Ratio of positive:negative samples?

**Recommendation**: 1:1 or 1:2 ratio, random sampling from proteins not in positive pairs, validate they're truly non-interacting.

### 6. **User Experience Flow**
- **Question**: What should the user see after prediction?
  - Simple "Interacts: Yes/No" with confidence?
  - Detailed visualization (interaction network, binding sites)?
  - Comparison with known interactions from HINT?
  - Suggested related proteins?
  - 3D structure visualization of the interaction?

**Recommendation**: Confidence score + known interaction evidence + 3D visualization if structures available.

### 7. **Real-time vs. Batch Processing**
- **Question**: Should predictions be:
  - Real-time (user waits 1-5 seconds for result)?
  - Async (user gets notification when ready)?
  - Cached (store predictions to avoid recomputation)?

**Recommendation**: Real-time for single predictions, async for batch predictions.

### 8. **Error Handling**
- **Question**: What should happen if:
  - Protein ID not found in HINT dataset?
  - One or both proteins are novel (not in training data)?
  - LLM fails to find a protein match?
  - Model confidence is very low?

**Recommendation**: 
- Fallback to similarity-based prediction (similar proteins)
- Show confidence warning
- Suggest alternative protein IDs
- Use ESM embeddings for out-of-dataset proteins

### 9. **Integration with Existing Codebase**
- **Question**: How should this integrate with existing features?
  - Replace the current protein generation workflow?
  - Add as a new tab/feature alongside existing ones?
  - Combine with docking service (predict interaction → dock)?
  - Use existing LLM agent or create new one?

**Current Features**: Protein generation, docking, manufacturing protocol
**Recommendation**: Add as new "Protein Interaction Prediction" feature, integrate with docking for visualization.

### 10. **AWS Deployment Strategy**
- **Question**: For SageMaker deployment:
  - Single endpoint for both steps (LLM + PPI model)?
  - Separate endpoints (LLM endpoint + PPI endpoint)?
  - Lambda functions for LLM, SageMaker for PPI model?
  - Use existing OpenAI API for LLM, only deploy PPI model?

**Recommendation**: 
- Use OpenAI API directly for Step 1 (no SageMaker needed)
- Deploy PPI model to SageMaker GPU endpoint
- Faster, cheaper, easier to maintain

## Proposed Refined Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  Natural Language Search Bar                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Step 1: Protein ID Resolution              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OpenAI/Gemini API                               │  │
│  │  + UniProt Query Generator (existing)            │  │
│  │  → Returns: List of candidate proteins           │  │
│  │     [{uniprot_id, name, description, score}]     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ User selects 2 proteins
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Step 2: PPI Prediction (SageMaker)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  HINT-trained Model (ESM2 + Classifier)          │  │
│  │  Input: [UniProt_ID_A, UniProt_ID_B]            │  │
│  │  Output: {                                        │  │
│  │    interaction_probability: 0.85,                │  │
│  │    confidence: "high",                           │  │
│  │    interaction_type: "binding",                  │  │
│  │    known_evidence: True/False                    │  │
│  │  }                                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Step 3: Results Display                    │
│  - Interaction probability & confidence                 │
│  - Known interaction evidence (from HINT)               │
│  - 3D structure visualization (if available)            │
│  - Related proteins suggestions                         │
└─────────────────────────────────────────────────────────┘
```

## Next Steps Based on Answers

1. **If you answer these questions**, I can:
   - Create the complete `train_model.py` with proper architecture
   - Set up the SageMaker deployment pipeline
   - Create the API endpoints for the 2-step process
   - Build the frontend components
   - Write the integration code

2. **Immediate actions I can take**:
   - Implement `train_model.py` with a baseline model (ESM2 + classifier)
   - Create the SageMaker inference service
   - Add API endpoints to `main.py`
   - Update frontend search bar to support protein selection

## My Recommendations (Default Plan)

If you want me to proceed with best practices:

1. **Step 1**: Use OpenAI API directly (no SageMaker) - faster, cheaper
2. **Step 2**: Train ESM2-based classifier on HINT dataset
3. **Model**: ESM2 embeddings → MLP classifier (simple, effective)
4. **Output**: Probability score + confidence + known evidence flag
5. **UI**: Multi-select protein interface with results visualization
6. **Deployment**: SageMaker GPU endpoint for PPI model only

Let me know your preferences, and I'll implement the complete solution!

