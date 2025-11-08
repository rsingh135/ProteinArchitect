# 🧬 Protein Architect - Expressibility-Aware Designer

**Hack Princeton Fall 2025**

An **Agentic, Closed-Loop Generative Platform** that designs and optimizes therapeutic protein sequences for function, stability, and large-scale industrial manufacturability.

## 📚 Quick Links

- **🚀 START HERE**: See `START_HERE.md` for quick setup
- **🔧 Fix PyTorch Error**: See `QUICK_FIX.md` or `FIX_TORCH_ERROR.md`
- **📖 Complete Setup**: See `COMPLETE_STEP_BY_STEP.md`
- **🔒 Security**: See `SECURITY.md`

---

## ⚙️ Configuration & Setup (REQUIRED BEFORE RUNNING)

### 🔐 Step 1: Configure API Keys and Environment Variables

**CRITICAL**: You must set up API keys before running the application. Follow these steps:

1. **Create Environment File**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Get API Keys** (Required):
   
   **Gemini API Key** (Required for Protein Search):
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key
   
   **OpenAI API Key** (Optional - for LLM refinement):
   - Visit: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key
   
   **AWS Credentials** (Required for SageMaker deployment):
   - Visit: https://console.aws.amazon.com/iam/
   - Create access keys
   - Copy Access Key ID and Secret Access Key

3. **Edit `.env` File**:
   ```bash
   # Open backend/.env in your editor
   nano backend/.env
   # or
   code backend/.env
   ```

4. **Fill in Your Keys**:
   ```bash
   # Required
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # Optional (for LLM refinement)
   OPENAI_API_KEY=your_actual_openai_api_key_here
   
   # Required for SageMaker (if deploying)
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint
   
   # Development mode (uses local service instead of SageMaker)
   USE_LOCAL_PPI=true
   ```

5. **Verify Configuration**:
   ```bash
   # Check that .env is in .gitignore (should be)
   cat .gitignore | grep .env
   
   # Verify .env file is NOT tracked by git
   git status | grep .env
   # Should return nothing (file should not appear)
   ```

### 🚨 Security Checklist

Before committing code, verify:
- [ ] `.env` file is in `.gitignore`
- [ ] `.env` file is NOT committed to git
- [ ] API keys are kept secret and never shared
- [ ] Different keys used for development vs production
- [ ] Keys are rotated regularly

**Quick Security Check**:
```bash
# Run the security check script
./check_security.sh

# Or manually check:
git status | grep .env  # Should return nothing
git ls-files | grep .env  # Should only show .env.example
```

### 📋 Quick Setup Summary

```bash
# 1. Clone repository
git clone <your-repo-url>
cd GenLab

# 2. Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your API keys (see above)

# 3. Install backend dependencies
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. Set up frontend
cd ../frontend
npm install

# 5. Start backend (in one terminal)
cd ../backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# 6. Start frontend (in another terminal)
cd frontend
npm run dev
```

### 🆘 Troubleshooting

**Error: "Gemini service not available"**
- Check that `GEMINI_API_KEY` is set in `.env`
- Verify the API key is correct
- Check that `.env` file is in the `backend/` directory

**Error: "SageMaker endpoint not found"**
- Set `USE_LOCAL_PPI=true` for local development
- Or deploy model to SageMaker and set `SAGEMAKER_PPI_ENDPOINT`

**Error: "Module not found"**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

**Environment variables not loading**
- Ensure `.env` file is in `backend/` directory
- Check file is named exactly `.env` (not `env` or `.env.txt`)
- Restart the backend server after changing `.env`

---

## 🎯 Problem Solved: The Expressibility Cliff

The major bottleneck in biologics development is that AI-designed proteins often misfold, are unstable, or are impossible to produce at high yield in a bioreactor. This system guarantees that designs are viable for commercial production.

## ✨ Key Features

- **Generative Design-for-Expression**: RL-based AI generates novel protein sequences optimized for your constraints
- **Expressibility Oracle**: GNN/Transformer model (deployed on AWS SageMaker) predicts stability and manufacturability
- **Interactive Design Dialogue**: LLM agent enables conversational protein refinement
- **3D Structural Visualization**: Interactive 3D protein structure viewer using Three.js
- **Host Organism View**: Visual representation of protein expression in host cells (E. coli/CHO)
- **Manufacturing Protocol Generation**: Automatic generation of industrial production recipes with cost/yield predictions

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Three.js 3D)  │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────────────────┐
│     FastAPI Backend              │
│  ┌──────────────────────────┐   │
│  │  Protein Generator       │   │
│  │  (Mock RL-based)         │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Expressibility Oracle   │   │
│  │  └─> AWS SageMaker       │   │
│  │      (Mock endpoint)     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Manufacturing Agent     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  LLM Agent (OpenAI)      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+ (Python 3.11 recommended for better compatibility)
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
# Option A: Use installation script (recommended)
./install.sh

# Option B: Manual installation
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Note:** If you encounter Python 3.13 compatibility issues, use Python 3.11:
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

3. **Configure Environment Variables** (REQUIRED):
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your API keys
   # See "Configuration & Setup" section at top of README for details
   ```
   
   **Required API Keys**:
   - `GEMINI_API_KEY` - Get from https://makersuite.google.com/app/apikey
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys (optional)
   - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` - For SageMaker deployment
   
   **Important**: Never commit `.env` to git! It's already in `.gitignore`.

4. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📖 Usage

1. **Design a Protein**: Fill in the target name and constraints in the Design tab
2. **View 3D Structure**: See the generated protein structure in the 3D Structure tab
3. **Check Manufacturing**: View the production protocol and cost estimates in the Manufacturing tab
4. **Refine Design**: Use the "Refine Design" button to interactively improve your protein using natural language

## 🧪 API Endpoints

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
    "is_stable": true
  },
  "manufacturing_protocol": {...},
  "retraining_triggered": false
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

## 🎨 Features Demo

### 3D Visualization
- Interactive protein structure viewer
- Color-coded amino acids by type
- Rotate and zoom controls

### Host Organism View
- 3D visualization of E. coli or CHO cells
- Highlighted protein expression sites
- Animated ribosomes

### Expressibility Oracle
- Real-time stability predictions
- Cost penalty calculations
- Yield predictions

## 🔧 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- OpenAI API (LLM agent)
- AWS SageMaker (mock for hackathon)
- NumPy, scikit-learn (ML utilities)

**Frontend:**
- React 18
- Three.js (3D visualization)
- Vite (build tool)
- Axios (HTTP client)

## 📝 Notes for Hackathon

- **AWS SageMaker Integration**: Currently uses a mock implementation. In production, this would connect to an actual SageMaker endpoint hosting a trained GNN/Transformer model.
- **Protein Generation**: Uses mock RL-based generation. In production, this would use a trained reinforcement learning model.
- **3D Structure**: Uses simplified visualization. In production, this would integrate with AlphaFold/ESMFold API for accurate structure prediction.

## 🎯 Hackathon Highlights

1. **Closed-Loop System**: Demonstrates the complete pipeline from design to manufacturing
2. **AWS Cloud Integration**: Shows SageMaker deployment architecture (mock)
3. **Interactive 3D Visualization**: Engaging user experience with Three.js
4. **LLM-Powered Refinement**: Natural language protein design refinement
5. **Cost Optimization**: Automatic cost penalty system guides design optimization

## 📄 License

See LICENSE file for details.

## 🙏 Acknowledgments

Built for Hack Princeton Fall 2025. Inspired by the need to bridge the gap between AI-designed proteins and industrial manufacturability.
