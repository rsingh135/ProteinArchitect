# 📋 Step-by-Step Setup Guide

## Part 1: Fix "No module named 'torch'" Error

### Quick Fix (5 minutes)

```bash
# 1. Go to model directory
cd model

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install PyTorch
pip install torch torchvision torchaudio

# 4. Install other dependencies
pip install -r requirements.txt

# 5. Verify it works
python -c "import torch; print('PyTorch installed!')"
```

### Or Use Install Script

```bash
cd model
./install_dependencies.sh
```

### Test Training Works

```bash
# Quick test (uses small dataset)
head -100 HomoSapiens_binary_hq.txt > test_hint.txt

python train_model.py \
  --hint_file test_hint.txt \
  --model_save_path test_model.pth \
  --negative_ratio 0.1 \
  --batch_size 4 \
  --num_epochs 1 \
  --device cpu
```

If this works, you're ready for full training!

---

## Part 2: Train the Model

### Option A: Local Training (Slow but Works)

```bash
cd model
source venv/bin/activate

# Full training (will take 10-50 hours on CPU)
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 8 \
  --num_epochs 10 \
  --device cpu
```

### Option B: AWS EC2 Training (Fast, Recommended)

#### Step 1: Launch EC2 Instance

1. Go to: https://console.aws.amazon.com/ec2/
2. Click "Launch Instances"
3. Choose:
   - **AMI**: "Deep Learning AMI (Ubuntu 20.04)"
   - **Instance Type**: `g4dn.xlarge` (has GPU)
   - **Storage**: 100 GB
   - **Key Pair**: Create new or use existing
4. Click "Launch Instance"

#### Step 2: Connect to EC2

```bash
# On your local machine
ssh -i "your-key.pem" ubuntu@<ec2-public-ip>

# Find IP in: EC2 Console → Instances → Public IPv4 address
```

#### Step 3: Set Up on EC2

```bash
# Activate PyTorch (already installed!)
source activate pytorch_latest_p39

# Install ESM
pip install fair-esm biopython requests pandas scikit-learn tqdm

# Verify
python -c "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')"
```

#### Step 4: Upload Files

```bash
# On your LOCAL machine
cd /Users/ranveersingh/GenLab
scp -i "your-key.pem" model/train_model.py ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/HomoSapiens_binary_hq.txt ubuntu@<ec2-ip>:~/
```

#### Step 5: Run Training

```bash
# On EC2, start screen session
screen -S training

# Run training
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda

# Detach: Ctrl+A, then D
# Reattach later: screen -r training
```

#### Step 6: Download Model

```bash
# On your LOCAL machine (after training completes)
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/model.pth ./model/
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/embeddings_cache.pkl ./model/
```

---

## Part 3: Deploy to SageMaker

### Step 1: Prepare Docker Image

```bash
# Make sure you have:
# - model/model.pth (trained model)
# - model/embeddings_cache.pkl (embeddings)
# - model/Dockerfile
# - model/ml_service.py

cd model
docker build -t protein-ppi-service .
```

### Step 2: Push to ECR

```bash
# Set your AWS region and account
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository --repository-name protein-ppi-service --region $AWS_REGION

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push
docker tag protein-ppi-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/protein-ppi-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/protein-ppi-service:latest
```

### Step 3: Create SageMaker Model

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Navigate to: "Inference" → "Models" → "Create model"
3. Fill in:
   - **Model name**: `protein-ppi-model`
   - **Container**: "Provide model artifacts and inference image"
   - **Inference image**: `<account-id>.dkr.ecr.<region>.amazonaws.com/protein-ppi-service:latest`
   - **Model artifacts**: Upload `model.pth` and `embeddings_cache.pkl` to S3, provide S3 path
4. Click "Create model"

### Step 4: Create Endpoint Configuration

1. Go to: "Inference" → "Endpoint configurations" → "Create endpoint configuration"
2. Fill in:
   - **Name**: `protein-ppi-endpoint-config`
   - **Add model**: Select `protein-ppi-model`
   - **Instance type**: `ml.g4dn.xlarge`
   - **Initial instance count**: 1
3. Click "Create endpoint configuration"

### Step 5: Create Endpoint

1. Go to: "Inference" → "Endpoints" → "Create endpoint"
2. Fill in:
   - **Name**: `protein-ppi-endpoint`
   - **Endpoint configuration**: `protein-ppi-endpoint-config`
3. Click "Create endpoint"
4. Wait 5-10 minutes for "InService" status

### Step 6: Test Endpoint

```bash
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --content-type application/json \
  --body '{"protein_a":"P01308","protein_b":"P04637"}' \
  output.json

cat output.json
```

---

## Part 4: Set Environment Variables

### Step 1: Create .env File

```bash
cd backend
cp .env.example .env
```

### Step 2: Get API Keys

**Gemini API Key** (Required):
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

**OpenAI API Key** (Optional):
1. Go to: https://platform.openai.com/api-keys
2. Create new key
3. Copy the key

**AWS Credentials** (For SageMaker):
1. Go to: https://console.aws.amazon.com/iam/
2. Create access keys
3. Copy Access Key ID and Secret Access Key

### Step 3: Edit .env File

```bash
# Open .env in editor
nano backend/.env
# OR
code backend/.env
```

Add your keys:
```bash
GEMINI_API_KEY=your_actual_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint
USE_LOCAL_PPI=false
```

### Step 4: Verify

```bash
# Check .env is not in git
git status | grep .env
# Should return nothing

# Verify .env exists
ls -la backend/.env
```

---

## Part 5: Integrate Frontend

### Step 1: Check Frontend Already Updated

The `App.jsx` has already been updated with the PPI Prediction component. Just verify:

```bash
# Check if PPIPrediction component exists
ls frontend/src/components/PPIPrediction.jsx

# Check if App.jsx imports it
grep "PPIPrediction" frontend/src/App.jsx
```

### Step 2: Install Frontend Dependencies (if needed)

```bash
cd frontend
npm install
```

### Step 3: Start Backend and Frontend

**Terminal 1 (Backend)**:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

### Step 4: Test

1. Open http://localhost:3000
2. Click "PPI Prediction" tab
3. Test the workflow:
   - Search for "human insulin"
   - Select a protein
   - Search for another protein
   - Select second protein
   - Click "Predict Interaction"
   - View results

---

## Complete Checklist

### Training
- [ ] Install PyTorch: `pip install torch torchvision torchaudio`
- [ ] Install ESM: `pip install fair-esm`
- [ ] Test training works: Run on small dataset
- [ ] Train model: Local or EC2
- [ ] Download model files: `model.pth` and `embeddings_cache.pkl`

### Deployment
- [ ] Build Docker image: `docker build -t protein-ppi-service .`
- [ ] Push to ECR: Follow ECR push steps
- [ ] Create SageMaker model: Via console
- [ ] Create endpoint configuration: Via console
- [ ] Create endpoint: Via console
- [ ] Test endpoint: Use AWS CLI or console

### Configuration
- [ ] Create .env file: `cp .env.example .env`
- [ ] Add Gemini API key
- [ ] Add OpenAI API key (optional)
- [ ] Add AWS credentials
- [ ] Set SageMaker endpoint name
- [ ] Verify .env is not in git

### Frontend
- [ ] Verify PPIPrediction component exists
- [ ] Verify App.jsx includes PPIPrediction
- [ ] Install dependencies: `npm install`
- [ ] Start backend: `uvicorn main:app --reload --port 8000`
- [ ] Start frontend: `npm run dev`
- [ ] Test end-to-end workflow

---

## Quick Commands Reference

### Training
```bash
# Install dependencies
cd model
./install_dependencies.sh

# Quick test
python train_model.py --hint_file test_hint.txt --num_epochs 1 --device cpu

# Full training
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10 --device cuda
```

### Deployment
```bash
# Build Docker
docker build -t protein-ppi-service .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/protein-ppi-service:latest
```

### Configuration
```bash
# Create .env
cd backend
cp .env.example .env
# Edit .env with your keys
```

### Testing
```bash
# Test backend
curl -X POST "http://localhost:8000/search_proteins" -H "Content-Type: application/json" -d '{"query":"human insulin"}'

# Test SageMaker endpoint
aws sagemaker-runtime invoke-endpoint --endpoint-name protein-ppi-endpoint --content-type application/json --body '{"protein_a":"P01308","protein_b":"P04637"}' output.json
```

---

## Troubleshooting

### "No module named 'torch'"
**Fix**: `pip install torch torchvision torchaudio`

### "No module named 'esm'"
**Fix**: `pip install fair-esm`

### "CUDA out of memory"
**Fix**: Use CPU or reduce batch size: `--batch_size 8 --device cpu`

### "Endpoint not found"
**Fix**: Check endpoint name, verify it's "InService", check AWS region

### "Cannot connect to backend"
**Fix**: Check backend is running, check CORS settings, check browser console

---

## Next Steps

1. ✅ Fix PyTorch installation
2. ✅ Train model (local or EC2)
3. ✅ Deploy to SageMaker
4. ✅ Set environment variables
5. ✅ Test frontend
6. ✅ Win hackathon! 🏆

Good luck! 🚀

