# 🚀 AWS Deployment Guide for PPI Prediction System

This guide walks you through deploying the Protein-Protein Interaction (PPI) prediction system to AWS.

## Overview

The system consists of:
1. **Training Phase** (Pre-hackathon): Train model on HINT dataset
2. **Inference Service** (SageMaker): Deploy trained model to GPU endpoint
3. **Backend API** (FastAPI): Integrates Gemini API + SageMaker
4. **Frontend** (React): User interface with NGL Viewer

## Phase 1: Pre-Hackathon Training on AWS EC2

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click "Launch Instances"
3. Configure:
   - **AMI**: Deep Learning AMI (Ubuntu 20.04) or Deep Learning AMI (Amazon Linux 2)
   - **Instance Type**: `g4dn.xlarge` (GPU) or `g5.xlarge` (better performance)
   - **Storage**: 100 GB (for dataset and embeddings)
   - **Security Group**: Allow SSH (port 22) from your IP
4. Launch with key pair

### Step 2: Connect and Setup

```bash
# SSH into instance
ssh -i "your-key.pem" ec2-user@<your-instance-ip>

# Activate PyTorch environment (check login message for exact command)
source activate pytorch_latest_p39
# OR
conda activate pytorch_latest_p39

# Install additional dependencies
pip install fair-esm biopython requests pandas scikit-learn tqdm

# Install Google Generative AI (for Gemini)
pip install google-generativeai
```

### Step 3: Upload Files

```bash
# On your local machine
scp -i "your-key.pem" model/train_model.py ec2-user@<instance-ip>:~/
scp -i "your-key.pem" model/HomoSapiens_binary_hq.txt ec2-user@<instance-ip>:~/
```

### Step 4: Run Training

```bash
# On EC2 instance
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda
```

**Note**: This will take 2-20 hours depending on dataset size and instance type.

### Step 5: Download Model

```bash
# On your local machine
scp -i "your-key.pem" ec2-user@<instance-ip>:~/model.pth ./model/
scp -i "your-key.pem" ec2-user@<instance-ip>:~/embeddings_cache.pkl ./model/
```

### Step 6: Terminate EC2 Instance

Once training is complete and model is downloaded, terminate the instance to save costs.

## Phase 2: SageMaker Deployment

### Step 1: Build and Push Docker Image to ECR

```bash
# Set variables
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPOSITORY_NAME="protein-ppi-service"

# Create ECR repository
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION

# Get login token
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
cd model
docker build -t $REPOSITORY_NAME .

# Tag image
docker tag $REPOSITORY_NAME:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest

# Push image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest
```

### Step 2: Create SageMaker Model

1. Go to SageMaker Console → Inference → Models → Create model
2. Configure:
   - **Model name**: `protein-ppi-model`
   - **Container definition**: Select "Provide model artifacts and inference image location"
   - **Inference image location**: Paste your ECR image URI:
     ```
     <account-id>.dkr.ecr.<region>.amazonaws.com/protein-ppi-service:latest
     ```
   - **Model artifacts**: Upload `model.pth` and `embeddings_cache.pkl` to S3, or use local path
3. Click "Create model"

### Step 3: Create Endpoint Configuration

1. Go to SageMaker Console → Inference → Endpoint configurations → Create endpoint configuration
2. Configure:
   - **Name**: `protein-ppi-endpoint-config`
   - **Production variants**: Add model
     - **Model**: Select `protein-ppi-model`
     - **Variant name**: `AllTraffic`
     - **Instance type**: `ml.g4dn.xlarge` (GPU instance)
     - **Initial instance count**: 1
     - **Initial weight**: 1
3. Click "Create endpoint configuration"

### Step 4: Create Endpoint

1. Go to SageMaker Console → Inference → Endpoints → Create endpoint
2. Configure:
   - **Name**: `protein-ppi-endpoint`
   - **Endpoint configuration**: Select `protein-ppi-endpoint-config`
3. Click "Create endpoint"

**Wait 5-10 minutes** for endpoint to be "InService"

### Step 5: Test Endpoint

```bash
# Test the endpoint
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --content-type application/json \
  --body '{"protein_a":"P01308","protein_b":"P04637"}' \
  output.json

cat output.json
```

## Phase 3: Backend Configuration

### Step 1: Set Environment Variables

Create `.env` file in `backend/`:

```bash
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# SageMaker
SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint
AWS_REGION=us-east-1
USE_LOCAL_PPI=false  # Set to true for local development
```

### Step 2: Update Backend Code

The backend is already configured to use SageMaker. Just set the environment variables.

### Step 3: Test Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Test endpoints
curl -X POST "http://localhost:8000/search_proteins" \
  -H "Content-Type: application/json" \
  -d '{"query": "human insulin", "max_results": 5}'

curl -X POST "http://localhost:8000/predict_ppi" \
  -H "Content-Type: application/json" \
  -d '{"protein_a": "P01308", "protein_b": "P04637"}'
```

## Phase 4: Frontend Integration

### Step 1: Update App.jsx

Add the PPI Prediction component to your app:

```jsx
import PPIPrediction from './components/PPIPrediction';

// In your App component, add a new tab or route
<PPIPrediction />
```

### Step 2: Install NGL Viewer

NGL Viewer is loaded via CDN in the component, so no additional installation is needed.

### Step 3: Test Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to the PPI Prediction page and test the workflow.

## Cost Estimates

### EC2 Training (One-time)
- **g4dn.xlarge**: ~$0.526/hour
- **Training time**: 2-20 hours
- **Total**: ~$10-50 (one-time)

### SageMaker Endpoint (Ongoing)
- **ml.g4dn.xlarge**: ~$0.736/hour
- **Monthly** (if running 24/7): ~$530/month
- **Recommendation**: Use on-demand or implement auto-scaling

### Gemini API
- **Free tier**: 60 requests/minute
- **Paid**: Very affordable, ~$0.001 per request

## Optimization Tips

1. **Auto-scaling**: Configure SageMaker endpoint to scale to 0 when not in use
2. **Spot Instances**: Use Spot instances for training to save 70% cost
3. **Model Compression**: Consider quantizing the model to reduce inference time
4. **Caching**: Cache embeddings to avoid recomputation

## Troubleshooting

### SageMaker Endpoint Issues

```bash
# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name protein-ppi-endpoint

# Check endpoint logs
aws logs tail /aws/sagemaker/Endpoints/protein-ppi-endpoint --follow
```

### Local Testing

```bash
# Run local inference service
cd model
python ml_service.py --model_dir . --port 8080

# Test locally
curl -X POST "http://localhost:8080/invocations" \
  -H "Content-Type: application/json" \
  -d '{"protein_a":"P01308","protein_b":"P04637"}'
```

## Next Steps

1. ✅ Train model on EC2
2. ✅ Deploy to SageMaker
3. ✅ Configure backend
4. ✅ Integrate frontend
5. ✅ Test end-to-end workflow
6. ✅ Optimize for production

## Support

For issues, check:
- SageMaker logs in CloudWatch
- Backend logs in terminal
- Browser console for frontend errors

Good luck with your deployment! 🚀

