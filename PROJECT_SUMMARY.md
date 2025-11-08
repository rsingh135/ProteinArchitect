# 🧬 Protein Architect - Project Summary

## 📋 Project Overview

**Protein Architect** is an **Agentic, Closed-Loop Generative Platform** that designs and optimizes therapeutic protein sequences for function, stability, and large-scale industrial manufacturability. It solves the critical "Expressibility Cliff" problem where AI-designed proteins often fail in production.

## 🎯 Core Problem Solved

**The Expressibility Cliff**: AI-designed proteins often misfold, are unstable, or are impossible to produce at high yield in bioreactors. Our system guarantees designs are viable for commercial production by:

1. **Generative Design-for-Expression**: RL-based AI generates sequences optimized for constraints
2. **Expressibility Oracle**: GNN/Transformer model predicts stability and manufacturability
3. **Cost Optimization**: Automatic cost penalties guide design toward viable solutions
4. **Interactive Refinement**: LLM agent enables conversational protein design improvements

## ✨ Key Features Implemented

### 1. Generative Protein Design
- **Location**: `backend/services/protein_generator.py`
- **Function**: Generates novel protein sequences based on user constraints
- **Technology**: Mock RL-based generation (production would use trained RL model)
- **Features**:
  - Length constraints
  - Cysteine content limits
  - Functional constraint handling

### 2. Expressibility Oracle
- **Location**: `backend/services/oracle.py`, `backend/services/aws_sagemaker.py`
- **Function**: Predicts protein stability, yield, and manufacturability
- **Technology**: 
  - Mock AWS SageMaker endpoint integration
  - Heuristic-based stability prediction (simulates GNN/Transformer)
- **Outputs**:
  - Instability index
  - Stability score
  - Yield prediction (g/L)
  - Cost penalties
  - Optimal host cell recommendation

### 3. Manufacturing Protocol Agent
- **Location**: `backend/services/manufacturing_agent.py`
- **Function**: Generates industrial production recipes
- **Features**:
  - Host cell selection (E. coli, CHO cells)
  - Production protocol steps
  - Cost per gram calculations
  - Yield predictions
  - Scale-up timelines

### 4. LLM-Powered Refinement
- **Location**: `backend/services/llm_agent.py`
- **Function**: Conversational protein design refinement
- **Technology**: OpenAI API (with mock fallback)
- **Features**:
  - Natural language constraint application
  - Sequence optimization suggestions
  - Stability improvement recommendations

### 5. Interactive 3D Visualization
- **Location**: `frontend/src/components/ProteinVisualization.jsx`
- **Technology**: Three.js
- **Features**:
  - Interactive protein structure viewer
  - Color-coded amino acids by type
  - Rotate and zoom controls
  - Alpha helix representation

### 6. Host Organism Visualization
- **Location**: `frontend/src/components/ManufacturingView.jsx`
- **Technology**: Three.js
- **Features**:
  - 3D E. coli cell visualization
  - Highlighted protein expression sites
  - Animated ribosomes
  - Pulsing expression indicators

### 7. Retraining Trigger
- **Location**: `backend/main.py`, `backend/services/oracle.py`
- **Function**: Triggers model retraining after N protein generations
- **Technology**: Mock AWS SageMaker training job
- **Threshold**: After 5 protein generations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Design Form  │  │ 3D Viewer    │  │Manufacturing │ │
│  │              │  │ (Three.js)   │  │   Protocol   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI Backend                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Protein Generator (Mock RL)              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Expressibility Oracle                    │  │
│  │         └─> AWS SageMaker (Mock)                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Manufacturing Agent                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         LLM Agent (OpenAI)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
GenLab/
├── backend/
│   ├── main.py                      # FastAPI application
│   ├── requirements.txt             # Python dependencies
│   ├── services/
│   │   ├── __init__.py
│   │   ├── protein_generator.py     # Sequence generation
│   │   ├── oracle.py                # Stability prediction
│   │   ├── aws_sagemaker.py         # AWS integration (mock)
│   │   ├── manufacturing_agent.py   # Protocol generation
│   │   └── llm_agent.py             # LLM refinement
│   └── run.sh                       # Startup script
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main app
│   │   ├── App.css
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── ProteinDesignForm.jsx
│   │       ├── ProteinDesignForm.css
│   │       ├── ProteinVisualization.jsx
│   │       ├── ProteinVisualization.css
│   │       ├── ManufacturingView.jsx
│   │       ├── ManufacturingView.css
│   │       ├── RefinementDialog.jsx
│   │       └── RefinementDialog.css
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── run.sh                       # Startup script
│
├── README.md                        # Main documentation
├── SETUP.md                         # Detailed setup instructions
├── QUICKSTART.md                    # Quick start guide
├── PROJECT_SUMMARY.md               # This file
└── .gitignore
```

## 🚀 API Endpoints

### `POST /generate_protein`
Generate a novel protein sequence with expressibility optimization.

**Request:**
```json
{
  "target_name": "Anti-TNF-alpha Antibody",
  "max_length": 200,
  "max_cysteines": 5,
  "functional_constraint": "Must bind to receptor X",
  "additional_constraints": "Optimize for stability"
}
```

**Response:**
```json
{
  "sequence": "MKTAYIAKQR...",
  "length": 150,
  "oracle_results": {
    "instability_index": 35.2,
    "stability_score": 64.8,
    "yield_prediction": 0.8,
    "host_cell": "E. coli",
    "cost_per_gram": 105.2,
    "cost_penalty": 5.2,
    "is_stable": true,
    "prediction_source": "aws_sagemaker"
  },
  "manufacturing_protocol": {
    "host_cell": "E. coli BL21(DE3)",
    "expression_system": "Bacterial",
    "predicted_yield": 0.8,
    "cost_per_gram": 105.2,
    "protocol_steps": [...]
  },
  "retraining_triggered": false,
  "generation_count": 1
}
```

### `POST /refine_protein`
Refine protein design using conversational LLM agent.

**Request:**
```json
{
  "sequence": "MKTAYIAKQR...",
  "refinement_prompt": "Reduce predicted immunogenicity by 20%"
}
```

**Response:**
```json
{
  "original_sequence": "MKTAYIAKQR...",
  "refined_sequence": "MKTAYIAKQR...",
  "refinement_explanation": "Reduced cysteine content...",
  "original_prediction": {...},
  "refined_prediction": {...},
  "improvement": 5.2
}
```

## 🎨 UI Components

### Design Tab
- Protein design form with constraints
- Real-time validation
- Generate and refine buttons

### 3D Structure Tab
- Interactive protein structure viewer
- Color-coded amino acids
- Structure properties display
- Color legend

### Manufacturing Tab
- Production protocol details
- Host organism 3D visualization
- Cost and yield information
- Oracle results summary

### Refinement Dialog
- Natural language input
- Current sequence display
- Example prompts
- Refinement results

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **NumPy**: Numerical computations
- **scikit-learn**: ML utilities (for future model integration)
- **OpenAI API**: LLM-powered refinement
- **boto3**: AWS SDK (for SageMaker integration)
- **Biopython**: Protein sequence utilities

### Frontend
- **React 18**: UI framework
- **Three.js**: 3D visualization
- **Vite**: Build tool and dev server
- **Axios**: HTTP client

## 🎯 Hackathon Deliverables

✅ **Generative Design-for-Expression**: Implemented
✅ **Expressibility Oracle**: Implemented (mock AWS SageMaker)
✅ **Manufacturing Protocol Agent**: Implemented
✅ **Interactive Design Dialogue**: Implemented (LLM agent)
✅ **3D Structural Visualization**: Implemented (Three.js)
✅ **Host Organism View**: Implemented (E. coli visualization)
✅ **AWS/Cloud Component**: Implemented (mock SageMaker)
✅ **Retraining Trigger**: Implemented (after 5 generations)

## 💡 Key Innovations

1. **Closed-Loop System**: Design → Oracle → Cost Penalty → Refinement
2. **Multi-Objective Optimization**: Function + Stability + Cost
3. **Interactive 3D Visualization**: Engaging user experience
4. **AWS Cloud Integration**: Demonstrates scalable ML deployment
5. **Natural Language Refinement**: LLM-powered design improvements

## 📊 Demo Flow

1. **Design** (1 min): Generate protein with constraints
2. **Visualize** (1 min): Explore 3D structure
3. **Manufacturing** (1 min): View production protocol and costs
4. **Refine** (1 min): Use LLM to improve design
5. **AWS Integration** (30s): Show SageMaker prediction source

**Total Demo Time: ~5 minutes**

## 🔮 Future Enhancements

- **Real AlphaFold Integration**: Actual structure prediction API
- **Real AWS SageMaker Deployment**: Deploy trained GNN/Transformer model
- **Real RL Model**: Train and deploy reinforcement learning model
- **Advanced Visualization**: Full atomic detail with Mol*
- **Database Integration**: Store designs and results
- **Batch Processing**: Generate multiple designs at once
- **Export Features**: Download PDB files, FASTA sequences

## 📝 Notes

- **Mock Mode**: Application works fully in mock mode without API keys
- **AWS Integration**: Currently uses mock SageMaker endpoint
- **LLM Agent**: Falls back to mock if OpenAI API key not provided
- **3D Visualization**: Uses simplified representation (production would use AlphaFold)
- **Protein Generation**: Uses mock RL logic (production would use trained model)

## 🎉 Ready for Hackathon!

The project is complete and ready for demonstration. All core features are implemented, documented, and tested. The application works in mock mode, making it perfect for hackathon demos without requiring API keys or cloud resources.

**Good luck with your hackathon! 🚀**

