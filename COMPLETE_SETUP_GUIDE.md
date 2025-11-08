# 🚀 Complete Setup Guide - Step by Step

This guide walks you through everything from training to deployment to frontend integration.

---

## Part 1: Training the Model

### Problem: "No module named 'torch'"

This means PyTorch isn't installed. Let's fix it:

### Solution: Install Dependencies

#### Option A: Local Training (For Testing)

```bash
# 1. Navigate to model directory
cd model

# 2. Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Upgrade pip
pip install --upgrade pip setuptools wheel

# 4. Install PyTorch (CPU version - works everywhere)
pip install torch torchvision torchaudio

# 5. Install other dependencies
pip install -r requirements.txt

# 6. Verify installation
python -c "import torch; print(f'PyTorch {torch.__version__} installed!')"
python -c "import esm; print('ESM installed!')"
```

#### Option B: AWS EC2 Training (Recommended - Much Faster)

**Step 1: Launch EC2 Instance**

1. Go to: https://console.aws.amazon.com/ec2/
2. Click "Launch Instances"
3. Settings:
   - **AMI**: Search for "Deep Learning AMI (Ubuntu 20.04)" 
   - **Instance Type**: `g4dn.xlarge` (has GPU, ~$0.526/hour)
   - **Storage**: 100 GB
   - **Security Group**: Allow SSH (port 22) from your IP
4. Launch and download key pair (`.pem` file)

**Step 2: Connect to EC2**

```bash
# On your local machine
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>

# Find your IP in EC2 console → Instances → Public IPv4 address
```

**Step 3: Set Up Environment on EC2**

```bash
# Activate PyTorch environment (already installed on Deep Learning AMI)
source activate pytorch_latest_p39
# OR
conda activate pytorch_latest_p39

# Verify PyTorch (should already be installed)
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"

# Install ESM and other packages
pip install fair-esm biopython requests pandas scikit-learn tqdm

# Verify ESM
python -c "import esm; print('ESM installed!')"
```

**Step 4: Upload Training Files**

```bash
# On your LOCAL machine (in a new terminal)
cd /Users/ranveersingh/GenLab

# Upload files to EC2
scp -i "your-key.pem" model/train_model.py ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/HomoSapiens_binary_hq.txt ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/requirements.txt ubuntu@<ec2-ip>:~/
```

**Step 5: Run Training on EC2**

```bash
# Back on EC2 instance
cd ~

# Start screen session (so training continues if you disconnect)
screen -S training
# OR use tmux: tmux new -s training

# Run training
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda

# Detach from screen: Press Ctrl+A, then D
# Reattach later: screen -r training
```

**Step 6: Download Trained Model**

```bash
# On your LOCAL machine (after training completes)
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/model.pth ./model/
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/embeddings_cache.pkl ./model/
```

**Step 7: Terminate EC2 Instance** (to save money)

```bash
# In AWS Console → EC2 → Instances → Terminate
```

---

## Part 2: Deploy to SageMaker

### Step 1: Build Docker Image

```bash
# Make sure you have Docker installed
docker --version

# Navigate to model directory
cd model

# Make sure you have these files:
# - Dockerfile
# - ml_service.py
# - model.pth (trained model)
# - embeddings_cache.pkl (embeddings cache)

# Build Docker image
docker build -t protein-ppi-service .
```

### Step 2: Push to Amazon ECR

```bash
# Set variables (replace with your values)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPOSITORY_NAME="protein-ppi-service"

# Create ECR repository
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION

# Get login token
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag image
docker tag protein-ppi-service:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest

# Push image (this uploads your model to AWS)
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest
```

### Step 3: Create SageMaker Model

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Navigate to "Inference" → "Models" → "Create model"
3. Configure:
   - **Model name**: `protein-ppi-model`
   - **Container definition**: "Provide model artifacts and inference image location"
   - **Inference image location**: Paste your ECR URI:
     ```
     <account-id>.dkr.ecr.<region>.amazonaws.com/protein-ppi-service:latest
     ```
   - **Model artifacts**: Upload `model.pth` and `embeddings_cache.pkl` to S3, then provide S3 path
4. Click "Create model"

### Step 4: Create Endpoint Configuration

1. Go to "Inference" → "Endpoint configurations" → "Create endpoint configuration"
2. Configure:
   - **Name**: `protein-ppi-endpoint-config`
   - **Production variants** → "Add model":
     - **Model**: `protein-ppi-model`
     - **Instance type**: `ml.g4dn.xlarge` (GPU instance)
     - **Initial instance count**: 1
3. Click "Create endpoint configuration"

### Step 5: Create Endpoint

1. Go to "Inference" → "Endpoints" → "Create endpoint"
2. Configure:
   - **Name**: `protein-ppi-endpoint`
   - **Endpoint configuration**: `protein-ppi-endpoint-config`
3. Click "Create endpoint"
4. **Wait 5-10 minutes** for endpoint to become "InService"

### Step 6: Test Endpoint

```bash
# Test the endpoint
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --content-type application/json \
  --body '{"protein_a":"P01308","protein_b":"P04637}"}' \
  output.json

cat output.json
```

---

## Part 3: Set Environment Variables

### Step 1: Create .env File

```bash
cd backend
cp .env.example .env
```

### Step 2: Edit .env File

```bash
# Open .env in your editor
nano .env
# OR
code .env
```

### Step 3: Add Your Keys

```bash
# Required: Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Required for SageMaker
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint

# Development mode (use local service instead of SageMaker)
USE_LOCAL_PPI=false  # Set to true for local dev
```

### Step 4: Verify

```bash
# Check .env is not in git
git status | grep .env
# Should return nothing

# Verify .env exists
ls -la backend/.env
# Should show the file
```

---

## Part 4: Integrate Frontend

### Step 1: Add Component to App

Edit `frontend/src/App.jsx`:

```jsx
import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DualViewer from './components/viewer/DualViewer';
import AnalysisDashboard from './components/analysis/AnalysisDashboard';
import PPIPrediction from './components/PPIPrediction'; // ADD THIS
import AIChat from './components/chat/AIChat';
import { Layers, BarChart3, Dna } from 'lucide-react'; // ADD Dna icon

function App() {
  const [activeView, setActiveView] = useState('viewer');

  return (
    <MainLayout>
      <div className="h-full w-full flex flex-col">
        {/* View Toggle */}
        <div className="flex items-center justify-center p-4 bg-white border-b border-gray-200">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setActiveView('viewer')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'viewer'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3D Viewer</span>
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'analysis'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analysis Dashboard</span>
            </button>
            {/* ADD THIS BUTTON */}
            <button
              onClick={() => setActiveView('ppi')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'ppi'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Dna className="w-4 h-4" />
              <span>PPI Prediction</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full overflow-hidden bg-gray-50">
          {activeView === 'viewer' && <DualViewer />}
          {activeView === 'analysis' && <AnalysisDashboard />}
          {activeView === 'ppi' && <PPIPrediction />} {/* ADD THIS */}
        </div>
      </div>

      {/* AI Chat (Floating) */}
      <AIChat />
    </MainLayout>
  );
}

export default App;
```

### Step 2: Install NGL Viewer (Optional - loaded via CDN)

The component loads NGL Viewer from CDN automatically, so no installation needed.

### Step 3: Test Frontend

```bash
# Start backend (in one terminal)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Step 4: Test the Workflow

1. Open http://localhost:3000
2. Click "PPI Prediction" tab
3. Search for "human insulin"
4. Select a protein
5. Search for another protein
6. Select second protein
7. Click "Predict Interaction"
8. View results and 3D visualization

---

## Troubleshooting

### Training Issues

**"No module named 'torch'"**
```bash
pip install torch torchvision torchaudio
```

**"No module named 'esm'"**
```bash
pip install fair-esm
```

**"CUDA out of memory"**
```bash
# Reduce batch size
python train_model.py --batch_size 8 --device cpu
```

### SageMaker Issues

**"Endpoint not found"**
- Check endpoint name is correct
- Verify endpoint is "InService"
- Check AWS region matches

**"Access denied"**
- Verify AWS credentials are correct
- Check IAM permissions for SageMaker

### Frontend Issues

**"Cannot connect to backend"**
- Check backend is running on port 8000
- Check CORS settings in backend
- Check browser console for errors

**"NGL Viewer not loading"**
- Check internet connection (loads from CDN)
- Check browser console for errors
- Try different browser

---

## Quick Reference

### Training
```bash
cd model
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10
```

### Deployment
```bash
# Build and push Docker image
docker build -t protein-ppi-service .
# ... (see Part 2 for ECR push)

# Create SageMaker endpoint (via console or CLI)
```

### Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your keys
```

### Frontend
```bash
cd frontend
# Add PPIPrediction component to App.jsx
npm run dev
```

---

## Next Steps

1. ✅ Install PyTorch and dependencies
2. ✅ Train model (local or EC2)
3. ✅ Deploy to SageMaker
4. ✅ Set environment variables
5. ✅ Integrate frontend
6. ✅ Test end-to-end
7. ✅ Win hackathon! 🏆

Good luck! 🚀

