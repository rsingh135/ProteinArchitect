# 🚀 SageMaker Deployment - Detailed Guide

## Overview

SageMaker deployment requires:
1. Docker image with inference code
2. Model files (model.pth, embeddings_cache.pkl) in S3
3. SageMaker model configuration
4. Endpoint configuration
5. Endpoint creation

## Step 1: Prepare Model Files

### Upload to S3

```bash
# Create S3 bucket
aws s3 mb s3://protein-ppi-models --region us-east-1

# Upload model files
aws s3 cp model/model.pth s3://protein-ppi-models/model.pth
aws s3 cp model/embeddings_cache.pkl s3://protein-ppi-models/embeddings_cache.pkl

# Verify upload
aws s3 ls s3://protein-ppi-models/
```

## Step 2: Build Docker Image

```bash
cd model

# Build image
docker build -t protein-ppi-service .

# Test locally (optional)
docker run -p 8080:8080 protein-ppi-service
```

## Step 3: Push to ECR

```bash
# Set variables
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REPOSITORY_NAME="protein-ppi-service"

# Create repository
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION

# Login
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push
docker tag protein-ppi-service:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest

docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest

# Note the image URI
echo "Image URI: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest"
```

## Step 4: Create IAM Role for SageMaker

1. Go to: https://console.aws.amazon.com/iam/
2. Click "Roles" → "Create role"
3. Select "SageMaker" as service
4. Attach policies:
   - `AmazonS3FullAccess` (to read model files)
   - `AmazonSageMakerFullAccess`
5. Create role and note the ARN

## Step 5: Create SageMaker Model

### Via AWS Console

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Navigate to: **Inference** → **Models** → **Create model**
3. Configure:
   - **Model name**: `protein-ppi-model`
   - **IAM role**: Select the role you created
   - **Container definition**: **"Provide model artifacts and inference image location"**
   - **Inference image location**: 
     ```
     <account-id>.dkr.ecr.us-east-1.amazonaws.com/protein-ppi-service:latest
     ```
   - **Model artifacts location (S3)**:
     ```
     s3://protein-ppi-models/
     ```
4. Click **"Create model"**

### Via AWS CLI

```bash
aws sagemaker create-model \
  --model-name protein-ppi-model \
  --execution-role-arn arn:aws:iam::<account-id>:role/SageMakerExecutionRole \
  --primary-container \
    Image=<account-id>.dkr.ecr.us-east-1.amazonaws.com/protein-ppi-service:latest,\
    ModelDataUrl=s3://protein-ppi-models/
```

## Step 6: Create Endpoint Configuration

### Via AWS Console

1. Go to: **Inference** → **Endpoint configurations** → **Create endpoint configuration**
2. Configure:
   - **Name**: `protein-ppi-endpoint-config`
   - **Production variants** → **Add model**:
     - **Model**: `protein-ppi-model`
     - **Variant name**: `AllTraffic`
     - **Instance type**: `ml.g4dn.xlarge`
     - **Initial instance count**: 1
     - **Initial weight**: 1
3. Click **"Create endpoint configuration"**

### Via AWS CLI

```bash
aws sagemaker create-endpoint-config \
  --endpoint-config-name protein-ppi-endpoint-config \
  --production-variants \
    VariantName=AllTraffic,\
    ModelName=protein-ppi-model,\
    InstanceType=ml.g4dn.xlarge,\
    InitialInstanceCount=1,\
    InitialVariantWeight=1
```

## Step 7: Create Endpoint

### Via AWS Console

1. Go to: **Inference** → **Endpoints** → **Create endpoint**
2. Configure:
   - **Name**: `protein-ppi-endpoint`
   - **Endpoint configuration**: `protein-ppi-endpoint-config`
3. Click **"Create endpoint"**
4. Wait 5-10 minutes for "InService" status

### Via AWS CLI

```bash
aws sagemaker create-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --endpoint-config-name protein-ppi-endpoint-config
```

## Step 8: Test Endpoint

```bash
# Test endpoint
aws sagemaker-runtime invoke-endpoint \
  --endpoint-name protein-ppi-endpoint \
  --content-type application/json \
  --body '{"protein_a":"P01308","protein_b":"P04637"}' \
  output.json

# View results
cat output.json

# Expected output:
# {
#   "interacts": true,
#   "interaction_probability": 0.85,
#   "confidence": "high",
#   "interaction_type": "binding",
#   "protein_a": "P01308",
#   "protein_b": "P04637"
# }
```

## Step 9: Update Backend Configuration

Update `backend/.env`:
```bash
SAGEMAKER_PPI_ENDPOINT=protein-ppi-endpoint
USE_LOCAL_PPI=false
AWS_REGION=us-east-1
```

## Troubleshooting

### Endpoint Creation Fails

1. Check CloudWatch logs: https://console.aws.amazon.com/cloudwatch/
2. Check endpoint status in SageMaker console
3. Verify model files are in S3
4. Verify Docker image is in ECR
5. Check IAM role permissions

### Endpoint Returns Errors

1. Check endpoint logs in CloudWatch
2. Test endpoint directly with AWS CLI
3. Verify model files are correct format
4. Check Docker container logs

### High Latency

1. Use GPU instance type (ml.g4dn.xlarge)
2. Increase instance count
3. Optimize model (quantization, pruning)
4. Use batch inference

## Cost Optimization

- Use Spot instances for development
- Scale to zero when not in use
- Use smaller instance types for testing
- Monitor costs in AWS Cost Explorer

## Next Steps

After deployment:
1. ✅ Test endpoint works
2. ✅ Update backend .env file
3. ✅ Test backend can call endpoint
4. ✅ Test frontend integration
5. ✅ Monitor endpoint metrics

Good luck! 🚀

