# 🚀 Setup Instructions for Protein Architect

## Quick Start (24-Hour Hackathon Setup)

### Step 1: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate virtual environment:**
```bash
# On macOS/Linux:
# Option A: Use installation script (recommended)
./install.sh

# Option B: Manual installation
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# On Windows:
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Note:** If you encounter Python 3.13 compatibility issues, use Python 3.11 or 3.12:
```bash
# Check if Python 3.11 is available
python3.11 --version

# Create venv with Python 3.11 (more stable)
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Optional: Set up environment variables**
Create a `.env` file in the `backend` directory:
```
OPENAI_API_KEY=your_openai_api_key_here
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
AWS_REGION=us-east-1
```

**Note:** The application works without OpenAI API key (uses mock LLM), but for full functionality, add your OpenAI API key.

5. **Start the backend server:**
```bash
# Option 1: Use the startup script
./run.sh

# Option 2: Manual start
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Step 2: Frontend Setup

1. **Open a new terminal and navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
# Option 1: Use the startup script
./run.sh

# Option 2: Manual start
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3000

### Step 3: Verify Installation

1. **Check backend is running:**
   - Visit http://localhost:8000/docs
   - You should see the FastAPI documentation

2. **Check frontend is running:**
   - Visit http://localhost:3000
   - You should see the Protein Architect interface

3. **Test the application:**
   - Fill in the protein design form
   - Click "Generate Protein"
   - Explore the 3D visualization and manufacturing views

## 🧪 Testing the API

### Test Protein Generation

```bash
curl -X POST "http://localhost:8000/generate_protein" \
  -H "Content-Type: application/json" \
  -d '{
    "target_name": "Test Protein",
    "max_length": 150,
    "max_cysteines": 5
  }'
```

### Test Protein Refinement

```bash
curl -X POST "http://localhost:8000/refine_protein" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL",
    "refinement_prompt": "Reduce predicted immunogenicity by 20%"
  }'
```

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
- **Solution:** Make sure virtual environment is activated and dependencies are installed

**Problem:** Port 8000 already in use
- **Solution:** Change port in `uvicorn` command: `uvicorn main:app --reload --port 8001`

**Problem:** CORS errors
- **Solution:** Check that frontend URL is in `allow_origins` in `main.py`

### Frontend Issues

**Problem:** `Cannot find module` errors
- **Solution:** Run `npm install` again

**Problem:** Frontend can't connect to backend
- **Solution:** 
  1. Check backend is running on port 8000
  2. Check browser console for CORS errors
  3. Verify `vite.config.js` proxy settings

**Problem:** 3D visualization not showing
- **Solution:** 
  1. Check browser console for Three.js errors
  2. Make sure WebGL is enabled in your browser
  3. Try a different browser (Chrome/Firefox recommended)

## 📦 Project Structure

```
GenLab/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── services/
│   │   ├── protein_generator.py    # Protein sequence generation
│   │   ├── oracle.py               # Expressibility Oracle
│   │   ├── aws_sagemaker.py        # AWS SageMaker integration (mock)
│   │   ├── manufacturing_agent.py  # Manufacturing protocol generation
│   │   └── llm_agent.py            # LLM-powered refinement
│   └── run.sh                  # Startup script
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── components/
│   │   │   ├── ProteinDesignForm.jsx
│   │   │   ├── ProteinVisualization.jsx
│   │   │   ├── ManufacturingView.jsx
│   │   │   └── RefinementDialog.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── run.sh                  # Startup script
│
└── README.md
```

## 🎯 Features to Demo

1. **Protein Design**: Generate novel protein sequences with constraints
2. **3D Visualization**: Interactive protein structure viewer
3. **Manufacturing Protocol**: Automatic generation of production recipes
4. **Cost Optimization**: Real-time cost penalty calculations
5. **LLM Refinement**: Natural language protein design refinement
6. **AWS Integration**: SageMaker endpoint integration (mock)

## 💡 Tips for Hackathon Demo

1. **Start with a simple example**: Use "Anti-TNF-alpha Antibody" as target name
2. **Show the 3D visualization**: Rotate and zoom to demonstrate interactivity
3. **Demonstrate refinement**: Use "Reduce immunogenicity by 20%" as refinement prompt
4. **Highlight AWS integration**: Show the SageMaker prediction source in API response
5. **Explain the closed-loop**: Show how cost penalties guide design optimization

## 🔧 Development Notes

- **Mock Mode**: The application works in mock mode without API keys
- **AWS SageMaker**: Currently uses mock implementation for hackathon
- **LLM Agent**: Falls back to mock if OpenAI API key is not provided
- **3D Visualization**: Uses simplified representation (production would use AlphaFold)

## 📞 Support

For issues or questions during the hackathon, check:
1. Backend logs in terminal
2. Frontend console in browser
3. API documentation at http://localhost:8000/docs

Good luck with your hackathon! 🚀

