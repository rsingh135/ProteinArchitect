# ⚡ Quick Start Guide - Protein Architect

## 🎯 Get Running in 5 Minutes

### Prerequisites Check
- ✅ Python 3.9+ installed
- ✅ Node.js 18+ installed
- ✅ Terminal/Command Prompt ready

### Step 1: Backend (2 minutes)

```bash
# Terminal 1
cd backend

# Option A: Use installation script (easiest)
./install.sh
source venv/bin/activate

# Option B: Manual installation
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

**If you get errors:** Use Python 3.11 instead:
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

✅ Backend running at http://localhost:8000

### Step 2: Frontend (2 minutes)

```bash
# Terminal 2
cd frontend
npm install
npm run dev
```

✅ Frontend running at http://localhost:3000

### Step 3: Test It!

1. Open http://localhost:3000 in your browser
2. Fill in the form:
   - Target Name: `Test Protein`
   - Max Length: `150`
   - Max Cysteines: `5`
3. Click **"Generate Protein"**
4. Explore the 3D visualization and manufacturing tabs!

## 🎨 Demo Flow

1. **Design Tab**: Generate a protein
2. **3D Structure Tab**: View the interactive protein structure
3. **Manufacturing Tab**: See production protocol and cost estimates
4. **Refine Design**: Click "Refine Design" to use LLM-powered refinement

## 🚨 Common Issues

**Backend won't start?**
- Check Python version: `python3 --version`
- Make sure port 8000 is free

**Frontend won't start?**
- Check Node version: `node --version`
- Try deleting `node_modules` and running `npm install` again

**3D visualization not working?**
- Try Chrome or Firefox
- Check browser console for errors

## 💡 Pro Tips

- **No OpenAI API key?** The app works in mock mode!
- **Want to see AWS integration?** Check the API response - it shows `prediction_source: "aws_sagemaker"`
- **Testing API directly?** Visit http://localhost:8000/docs for interactive API documentation

## 🎯 Hackathon Demo Script

1. **Introduction** (30s): "Protein Architect solves the expressibility cliff problem"
2. **Generate Protein** (1min): Show the design form and generate a sequence
3. **3D Visualization** (1min): Rotate and zoom the protein structure
4. **Manufacturing View** (1min): Show cost optimization and protocol generation
5. **LLM Refinement** (1min): Demonstrate natural language refinement
6. **AWS Integration** (30s): Show SageMaker prediction source in API response

**Total: ~5 minutes demo**

---

Ready to build? Let's go! 🚀

