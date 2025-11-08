# 🎯 Complete Step-by-Step Guide

This guide covers everything from fixing the torch error to deploying to SageMaker to integrating the frontend.

---

## Part 1: Fix "No module named 'torch'" Error

### Quick Fix (Copy & Paste)

```bash
# 1. Go to model directory
cd /Users/ranveersingh/GenLab/model

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install PyTorch
pip install --upgrade pip
pip install torch torchvision torchaudio

# 4. Install other dependencies
pip install -r requirements.txt

# 5. Verify it works
python -c "import torch; print(f'✅ PyTorch {torch.__version__} installed!')"
python -c "import esm; print('✅ ESM installed!')"
```

### Test Training Works

```bash
# Quick test (uses small dataset, fast)
head -100 HomoSapiens_binary_hq.txt > test_hint.txt

python train_model.py \
  --hint_file test_hint.txt \
  --model_save_path test_model.pth \
  --embeddings_cache_path test_embeddings.pkl \
  --negative_ratio 0.1 \
  --batch_size 4 \
  --num_epochs 1 \
  --device cpu
```

If this completes successfully, you're ready for full training!

---

## Part 2: Train the Model

### Option A: Local Training (Slow but Works)

**Full Training**:
```bash
cd model
source venv/bin/activate

python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 8 \
  --num_epochs 10 \
  --device cpu
```

**Time**: 10-50 hours on CPU

### Option B: AWS EC2 Training (Fast, Recommended)

#### Step 1: Launch EC2 Instance

1. Go to: https://console.aws.amazon.com/ec2/
2. Click "Launch Instances"
3. Configure:
   - **Name**: `protein-ppi-training`
   - **AMI**: Search for "Deep Learning AMI (Ubuntu 20.04)"
   - **Instance Type**: `g4dn.xlarge` (has GPU, ~$0.53/hour)
   - **Storage**: 100 GB
   - **Security Group**: Allow SSH (port 22) from your IP
   - **Key Pair**: Create new or use existing
4. Click "Launch Instance"
5. Wait for instance to be "Running"
6. Note the **Public IPv4 address**

#### Step 2: Connect to EC2

```bash
# On your local machine
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>

# Example:
# ssh -i "my-key.pem" ubuntu@54.123.45.67
```

#### Step 3: Set Up Environment on EC2

```bash
# Activate PyTorch (already installed on Deep Learning AMI!)
source activate pytorch_latest_p39
# OR try: conda activate pytorch_latest_p39

# Verify PyTorch and CUDA
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"

# Install ESM and other packages
pip install fair-esm biopython requests pandas scikit-learn tqdm

# Verify ESM
python -c "import esm; print('ESM installed!')"
```

#### Step 4: Upload Training Files

**On your LOCAL machine** (new terminal):
```bash
cd /Users/ranveersingh/GenLab

# Upload files to EC2
scp -i "your-key.pem" model/train_model.py ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/HomoSapiens_binary_hq.txt ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/requirements.txt ubuntu@<ec2-ip>:~/

# Example:
# scp -i "my-key.pem" model/train_model.py ubuntu@54.123.45.67:~/
```

#### Step 5: Run Training on EC2

**Back on EC2 instance**:
```bash
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
# You can now close the terminal - training continues!

# To reattach later:
# ssh back into EC2
# screen -r training
```

#### Step 6: Monitor Training

```bash
# Check if training is running
ps aux | grep train_model.py

# View logs (if using nohup)
tail -f training.log
```

#### Step 7: Download Trained Model

**After training completes** (on your LOCAL machine):
```bash
cd /Users/ranveersingh/GenLab

# Download model files
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/model.pth ./model/
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/embeddings_cache.pkl ./model/

# Verify files downloaded
ls -lh model/model.pth model/embeddings_cache.pkl
```

#### Step 8: Terminate EC2 Instance

```bash
# In AWS Console → EC2 → Instances
# Select instance → Actions → Instance State → Terminate

# OR via CLI:
aws ec2 terminate-instances --instance-ids <instance-id>
```

---

## Part 3: Deploy to SageMaker

### Step 1: Prepare Files

Make sure you have:
- `model/model.pth` (trained model)
- `model/embeddings_cache.pkl` (embeddings cache)
- `model/Dockerfile`
- `model/ml_service.py`

### Step 2: Build Docker Image

```bash
cd model

# Build image
docker build -t protein-ppi-service .

# Verify image was created
docker images | grep protein-ppi-service
```

### Step 3: Push to Amazon ECR

```bash
# Set your AWS region
export AWS_REGION="us-east-1"

# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository --repository-name protein-ppi-service --region $AWS_REGION

# Get login token and login
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag image
docker tag protein-ppi-service:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/protein-ppi-service:latest

# Push image (this uploads your model - may take 10-30 minutes)
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/protein-ppi-service:latest

# Note the image URI (you'll need it):
echo "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/protein-ppi-service:latest"
```

### Step 4: Upload Model Files to S3

```bash
# Create S3 bucket (if not exists)
aws s3 mb s3://protein-ppi-models --region us-east-1

# Upload model files
aws s3 cp model/model.pth s3://protein-ppi-models/model.pth
aws s3 cp model/embeddings_cache.pkl s3://protein-ppi-models/embeddings_cache.pkl

# Note the S3 paths:
# s3://protein-ppi-models/model.pth
# s3://protein-ppi-models/embeddings_cache.pkl
```

### Step 5: Create SageMaker Model

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Navigate to: **Inference** → **Models** → **Create model**
3. Configure:
   - **Model name**: `protein-ppi-model`
   - **Container definition**: Select **"Provide model artifacts and inference image location"**
   - **Inference image location**: Paste your ECR image URI:
     ```
     <account-id>.dkr.ecr.us-east-1.amazonaws.com/protein-ppi-service:latest
     ```
   - **Model artifacts location (S3)**: 
     ```
     s3://protein-ppi-models/
     ```
   - **Execution role**: Create new role or use existing (needs S3 and SageMaker access)
4. Click **"Create model"**

### Step 6: Create Endpoint Configuration

1. Go to: **Inference** → **Endpoint configurations** → **Create endpoint configuration**
2. Configure:
   - **Name**: `protein-ppi-endpoint-config`
   - **Production variants** → Click **"Add model"**:
     - **Model**: Select `protein-ppi-model`
     - **Variant name**: `AllTraffic`
     - **Instance type**: `ml.g4dn.xlarge` (GPU instance)
     - **Initial instance count**: 1
     - **Initial weight**: 1
   - Click **"Save"**
3. Click **"Create endpoint configuration"**

### Step 7: Create Endpoint

1. Go to: **Inference** → **Endpoints** → **Create endpoint**
2. Configure:
   - **Name**: `protein-ppi-endpoint`
   - **Endpoint configuration**: Select `protein-ppi-endpoint-config`
3. Click **"Create endpoint"**
4. **Wait 5-10 minutes** for endpoint status to change to **"InService"**
   - You can refresh the page to check status
   - Status will show: Creating → Updating → InService

### Step 8: Test Endpoint

```bash
# Test the endpoint
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --content-type application/json \
  --body '{"protein_a":"P01308","protein_b":"P04637"}' \
  output.json

# View results
cat output.json
```

**Expected output**:
```json
{
  "interacts": true,
  "interaction_probability": 0.85,
  "confidence": "high",
  "interaction_type": "binding",
  "protein_a": "P01308",
  "protein_b": "P04637"
}
```

---

## Part 4: Set Environment Variables

### Step 1: Create .env File

```bash
cd /Users/ranveersingh/GenLab/backend
cp .env.example .env
```

### Step 2: Get API Keys

**Gemini API Key** (Required):
1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key (starts with `AIza...`)

**OpenAI API Key** (Optional):
1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-...`)

**AWS Credentials** (Required for SageMaker):
1. Go to: https://console.aws.amazon.com/iam/
2. Click **"Users"** → Your user → **"Security credentials"**
3. Click **"Create access key"**
4. Copy **Access Key ID** and **Secret Access Key**

### Step 3: Edit .env File

```bash
# Open .env in your editor
nano backend/.env
# OR
code backend/.env
# OR
open -e backend/.env
```

**Fill in your actual keys**:
```bash
# Required: Gemini API Key
GEMINI_API_KEY=AIzaSyD...your_actual_key_here...

# Optional: OpenAI API Key
OPENAI_API_KEY=sk-...your_actual_key_here...

# Required for SageMaker
AWS_ACCESS_KEY_ID=AKIA...your_actual_key_id...
AWS_SECRET_ACCESS_KEY=...your_actual_secret_key...
AWS_REGION=us-east-1

# SageMaker Endpoint (after deployment)
SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint

# Development mode (use local service instead of SageMaker)
USE_LOCAL_PPI=false  # Set to true for local dev without SageMaker
```

### Step 4: Verify Configuration

```bash
# Check .env is not tracked by git
git status | grep .env
# Should return nothing

# Verify .env exists
ls -la backend/.env
# Should show the file

# Check security
./check_security.sh
# Should show all checks passing
```

---

## Part 5: Integrate Frontend

### Step 1: Verify Component Exists

```bash
# Check PPIPrediction component exists
ls frontend/src/components/PPIPrediction.jsx
ls frontend/src/components/PPIPrediction.css

# Check App.jsx includes it
grep "PPIPrediction" frontend/src/App.jsx
# Should show the import and usage
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start Backend

**Terminal 1**:
```bash
cd /Users/ranveersingh/GenLab/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Verify backend is running**:
- Open: http://localhost:8000/docs
- You should see the API documentation

### Step 4: Start Frontend

**Terminal 2**:
```bash
cd /Users/ranveersingh/GenLab/frontend
npm run dev
```

**Verify frontend is running**:
- Open: http://localhost:3000
- You should see the application

### Step 5: Test End-to-End

1. **Open browser**: http://localhost:3000
2. **Click "PPI Prediction" tab**
3. **Search for protein**:
   - Enter: "human insulin"
   - Click "Search"
   - Select a protein from results
4. **Search for second protein**:
   - Enter: "human receptor"
   - Click "Search"
   - Select a protein from results
5. **Predict interaction**:
   - Click "Predict Interaction"
   - Wait for results
6. **View results**:
   - See interaction probability
   - See confidence level
   - See interaction type
   - View 3D visualization (if structures available)

---

## Complete Checklist

### Training
- [ ] Fix PyTorch installation: `pip install torch torchvision torchaudio`
- [ ] Install ESM: `pip install fair-esm`
- [ ] Test training: Run on small dataset
- [ ] Train model: Local or EC2
- [ ] Download model: `model.pth` and `embeddings_cache.pkl`

### Deployment
- [ ] Build Docker image: `docker build -t protein-ppi-service .`
- [ ] Push to ECR: Follow ECR push steps
- [ ] Upload model to S3: `model.pth` and `embeddings_cache.pkl`
- [ ] Create SageMaker model: Via console
- [ ] Create endpoint configuration: Via console
- [ ] Create endpoint: Via console
- [ ] Test endpoint: Use AWS CLI

### Configuration
- [ ] Create .env: `cp .env.example .env`
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
# Reduce batch size or use CPU
python train_model.py --batch_size 4 --device cpu
```

### Deployment Issues

**"Docker build fails"**
- Check Docker is installed: `docker --version`
- Check Docker is running
- Check you're in the `model/` directory

**"ECR push fails"**
- Check AWS credentials are configured: `aws configure`
- Check you're logged in to ECR
- Check repository exists: `aws ecr describe-repositories`

**"SageMaker endpoint fails"**
- Check endpoint is "InService"
- Check CloudWatch logs for errors
- Verify model files are in S3

### Configuration Issues

**"Gemini service not available"**
- Check `GEMINI_API_KEY` is set in `.env`
- Verify API key is correct
- Check `.env` file is in `backend/` directory

**"SageMaker endpoint not found"**
- Set `USE_LOCAL_PPI=true` for local dev
- Or verify endpoint name is correct
- Check AWS region matches

### Frontend Issues

**"Cannot connect to backend"**
- Check backend is running on port 8000
- Check CORS settings in backend
- Check browser console for errors

**"Component not found"**
- Check `PPIPrediction.jsx` exists in `frontend/src/components/`
- Check `App.jsx` imports it
- Check for typos in component name

---

## Quick Reference Commands

### Training
```bash
cd model
source venv/bin/activate
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10
```

### Deployment
```bash
docker build -t protein-ppi-service .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/protein-ppi-service:latest
```

### Configuration
```bash
cd backend
cp .env.example .env
# Edit .env with your keys
```

### Testing
```bash
# Test backend
curl -X POST "http://localhost:8000/search_proteins" -H "Content-Type: application/json" -d '{"query":"human insulin"}'

# Test SageMaker
aws sagemaker-runtime invoke-endpoint --endpoint-name protein-ppi-endpoint --content-type application/json --body '{"protein_a":"P01308","protein_b":"P04637"}' output.json
```

---

## Next Steps

1. ✅ Fix PyTorch installation
2. ✅ Train model (local or EC2)
3. ✅ Deploy to SageMaker
4. ✅ Set environment variables
5. ✅ Test frontend
6. ✅ Win hackathon! 🏆

Good luck! 🚀

