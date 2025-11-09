# 🚀 Training on AWS SageMaker Notebook - Complete Guide

This guide walks you through training the PPI model on AWS SageMaker using a Jupyter notebook with GPU access.

## Why SageMaker Notebook?

- ✅ Easy GPU access (no EC2 setup)
- ✅ Pre-configured environments
- ✅ Easy file management (S3 integration)
- ✅ Can run for hours without disconnection
- ✅ Built-in model saving to S3

---

## Step 1: Create SageMaker Notebook Instance

### 1.1 Go to SageMaker Console

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Navigate to: **Notebook** → **Notebook instances** → **Create notebook instance**

### 1.2 Configure Notebook Instance

**Basic Settings**:
- **Notebook instance name**: `protein-ppi-training`
- **Instance type**: `ml.g4dn.xlarge` (GPU, ~$0.736/hour) or `ml.p3.2xlarge` (better GPU, more expensive)
- **Platform identifier**: `notebook-al2-v1` (Amazon Linux 2) or `notebook-al2-v2`

**Permissions**:
- **IAM role**: Create new role or use existing
  - If creating new: Select "Any S3 bucket" (or create custom role with S3 access)
  - Note the role ARN (you'll need it)

**Network** (Optional):
- Leave default (allows internet access for downloading packages)

**Git repositories** (Optional):
- You can clone your repo directly here if it's on GitHub

**Root access** (Optional):
- Enable if you need to install system packages

Click **"Create notebook instance"**

### 1.3 Wait for Instance to Start

- Status will change: **Pending** → **InService** (takes 2-5 minutes)
- Click **"Open Jupyter"** or **"Open JupyterLab"** when ready

---

## Step 2: Set Up Environment in Notebook

### 2.1 Create New Notebook

1. In Jupyter/JupyterLab, click **"New"** → **"Python 3"** (or **" conda_python3"**)
2. Name it: `train_ppi_model.ipynb`

### 2.2 Install Dependencies

**Cell 1: Install PyTorch and Dependencies**
```python
# Install PyTorch with CUDA support
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
!pip install fair-esm biopython requests pandas scikit-learn tqdm numpy

# Verify installations
import torch
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")

import esm
print("ESM installed successfully!")
```

**Run this cell** and wait for installations to complete (5-10 minutes)

### 2.3 Upload Training Files

**Option A: Upload via Jupyter Interface**

1. Click **"Upload"** button in Jupyter
2. Upload:
   - `train_model.py`
   - `HomoSapiens_binary_hq.txt`
3. Files will appear in the notebook directory

**Option B: Upload from S3**

**Cell 2: Upload from S3 (if files are in S3)**
```python
import boto3
s3 = boto3.client('s3')

# Download files from S3
s3.download_file('your-bucket-name', 'train_model.py', 'train_model.py')
s3.download_file('your-bucket-name', 'HomoSapiens_binary_hq.txt', 'HomoSapiens_binary_hq.txt')

print("Files downloaded from S3")
```

**Option C: Clone from GitHub**

**Cell 3: Clone Repository**
```python
!git clone https://github.com/your-username/GenLab.git
!cp GenLab/model/train_model.py .
!cp GenLab/model/HomoSapiens_binary_hq.txt .
```

**Option D: Create Files Directly in Notebook**

**Cell 4: Create train_model.py**
```python
# Copy the contents of train_model.py into a cell and write to file
# Or use %%writefile magic command (see below)
```

---

## Step 3: Prepare Training Script

### 3.1 Option A: Upload train_model.py

Upload `train_model.py` using Jupyter's upload interface.

### 3.2 Option B: Create train_model.py in Notebook

**Cell 5: Create train_model.py**
```python
%%writefile train_model.py
"""
Protein-Protein Interaction (PPI) Prediction Model Training
Trains a model on HINT dataset to predict protein-protein interactions
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
import pickle
import os
from tqdm import tqdm
import logging
from typing import Dict, List, Tuple, Optional
import requests

# [Paste the entire contents of train_model.py here]
# Or import it if uploaded
```

### 3.3 Verify Files Exist

**Cell 6: Verify Files**
```python
import os

# Check files exist
files = ['train_model.py', 'HomoSapiens_binary_hq.txt']
for file in files:
    if os.path.exists(file):
        print(f"✅ {file} exists")
        if file.endswith('.txt'):
            # Check file size
            size = os.path.getsize(file) / (1024 * 1024)  # MB
            print(f"   Size: {size:.2f} MB")
    else:
        print(f"❌ {file} NOT found")
```

---

## Step 4: Run Training

### 4.1 Training Cell

**Cell 7: Run Training**
```python
import subprocess
import sys

# Run training
!python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --test_size 0.2 \
  --batch_size 32 \
  --learning_rate 1e-4 \
  --num_epochs 10 \
  --device cuda

print("\n✅ Training completed!")
```

### 4.2 Monitor Training Progress

The notebook will show:
- Progress bars for embedding computation
- Training progress for each epoch
- Loss and accuracy metrics
- Model saving notifications

### 4.3 Expected Output

```
🧬 Starting PPI Model Training
============================================================
Loading HINT dataset from HomoSapiens_binary_hq.txt
Loaded 50000 protein pairs
Found 10000 unique proteins
Generated 50000 negative samples
Computing embeddings for 10000 proteins...
Computing embeddings: 100%|████████████| 1250/1250 [2:30:00<00:00, 7.2s/it]
Epoch 1/10: 100%|████████████| 2968/2968 [15:30<00:00, 3.2it/s]
  Train Loss: 0.4523, Train Acc: 0.7821, Train AUC: 0.8567
  Test Loss: 0.4234, Test Acc: 0.8012, Test AUC: 0.8723
Saved best model to model.pth
...
Training completed!
Best model saved to model.pth
```

---

## Step 5: Save Model to S3

### 5.1 Upload to S3

**Cell 8: Save Model to S3**
```python
import boto3
import os

# Initialize S3 client
s3 = boto3.client('s3')

# Set your bucket name
BUCKET_NAME = 'protein-ppi-models'  # Change to your bucket name
MODEL_KEY = 'model.pth'
EMBEDDINGS_KEY = 'embeddings_cache.pkl'

# Create bucket if it doesn't exist
try:
    s3.create_bucket(Bucket=BUCKET_NAME)
    print(f"Created bucket: {BUCKET_NAME}")
except Exception as e:
    if 'BucketAlreadyOwnedByYou' in str(e):
        print(f"Bucket {BUCKET_NAME} already exists")
    else:
        print(f"Error: {e}")

# Upload model files
print("Uploading model.pth...")
s3.upload_file('model.pth', BUCKET_NAME, MODEL_KEY)
print(f"✅ Uploaded: s3://{BUCKET_NAME}/{MODEL_KEY}")

print("Uploading embeddings_cache.pkl...")
s3.upload_file('embeddings_cache.pkl', BUCKET_NAME, EMBEDDINGS_KEY)
print(f"✅ Uploaded: s3://{BUCKET_NAME}/{EMBEDDINGS_KEY}")

print("\n✅ All files uploaded to S3!")
print(f"Model: s3://{BUCKET_NAME}/{MODEL_KEY}")
print(f"Embeddings: s3://{BUCKET_NAME}/{EMBEDDINGS_KEY}")
```

### 5.2 Verify Upload

**Cell 9: Verify S3 Upload**
```python
# List files in S3 bucket
response = s3.list_objects_v2(Bucket=BUCKET_NAME)
if 'Contents' in response:
    print("Files in S3 bucket:")
    for obj in response['Contents']:
        size_mb = obj['Size'] / (1024 * 1024)
        print(f"  - {obj['Key']}: {size_mb:.2f} MB")
else:
    print("Bucket is empty")
```

---

## Step 6: Download Model (Optional)

If you want to download the model to your local machine:

**Cell 10: Generate Download Links**
```python
# Generate presigned URLs for downloading (valid for 1 hour)
model_url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': BUCKET_NAME, 'Key': MODEL_KEY},
    ExpiresIn=3600
)

embeddings_url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': BUCKET_NAME, 'Key': EMBEDDINGS_KEY},
    ExpiresIn=3600
)

print("Download URLs (valid for 1 hour):")
print(f"Model: {model_url}")
print(f"Embeddings: {embeddings_url}")
```

Then download from your local machine:
```bash
# On your local machine
wget "<presigned-url>" -O model.pth
wget "<presigned-url>" -O embeddings_cache.pkl
```

---

## Complete Notebook Template

Here's a complete notebook you can use:

```python
# Cell 1: Install Dependencies
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
!pip install fair-esm biopython requests pandas scikit-learn tqdm numpy

# Cell 2: Verify Installation
import torch
print(f"PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}")

# Cell 3: Upload Files (use Jupyter upload interface)
# Upload: train_model.py, HomoSapiens_binary_hq.txt

# Cell 4: Verify Files
import os
assert os.path.exists('train_model.py'), "train_model.py not found"
assert os.path.exists('HomoSapiens_binary_hq.txt'), "HINT file not found"
print("✅ All files ready")

# Cell 5: Run Training
!python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda

# Cell 6: Save to S3
import boto3
s3 = boto3.client('s3')
BUCKET_NAME = 'protein-ppi-models'

s3.upload_file('model.pth', BUCKET_NAME, 'model.pth')
s3.upload_file('embeddings_cache.pkl', BUCKET_NAME, 'embeddings_cache.pkl')
print("✅ Model saved to S3")
```

---

## Step-by-Step Checklist

### Before Starting
- [ ] AWS account with SageMaker access
- [ ] IAM role with S3 and SageMaker permissions
- [ ] Training files ready (`train_model.py`, `HomoSapiens_binary_hq.txt`)

### Create Notebook Instance
- [ ] Go to SageMaker Console
- [ ] Create notebook instance
- [ ] Choose GPU instance type (`ml.g4dn.xlarge`)
- [ ] Create/select IAM role
- [ ] Wait for instance to be "InService"
- [ ] Open Jupyter/JupyterLab

### Set Up Environment
- [ ] Create new notebook
- [ ] Install PyTorch with CUDA
- [ ] Install ESM and other dependencies
- [ ] Verify CUDA is available

### Upload Files
- [ ] Upload `train_model.py`
- [ ] Upload `HomoSapiens_binary_hq.txt`
- [ ] Verify files exist

### Run Training
- [ ] Run training command
- [ ] Monitor progress
- [ ] Wait for completion (2-20 hours)

### Save Results
- [ ] Upload `model.pth` to S3
- [ ] Upload `embeddings_cache.pkl` to S3
- [ ] Verify uploads
- [ ] Note S3 paths for SageMaker deployment

### Clean Up
- [ ] Stop notebook instance (to save costs)
- [ ] Or keep running for testing

---

## Cost Optimization

### Save Money
1. **Stop instance when not training**: Notebook instances charge by the hour
2. **Use Spot instances**: Can save up to 70% (if available)
3. **Use smaller instance for testing**: `ml.t3.medium` for testing, `ml.g4dn.xlarge` for training
4. **Delete instance after training**: Don't leave it running

### Stop Instance
```python
# In notebook, or via console
import boto3
sagemaker = boto3.client('sagemaker')
sagemaker.stop_notebook_instance(NotebookInstanceName='protein-ppi-training')
```

### Start Instance Again
```python
sagemaker.start_notebook_instance(NotebookInstanceName='protein-ppi-training')
# Wait 2-5 minutes for "InService" status
```

---

## Troubleshooting

### Issue: "CUDA not available"
**Solution**: 
- Check instance type has GPU
- Verify PyTorch CUDA installation
- Restart kernel and rerun installation cell

### Issue: "Out of memory"
**Solution**:
- Reduce batch size: `--batch_size 16`
- Reduce dataset size (use first N rows)
- Use larger instance type

### Issue: "Files not found"
**Solution**:
- Check current directory: `!pwd`
- List files: `!ls -la`
- Upload files again via Jupyter interface

### Issue: "S3 upload fails"
**Solution**:
- Check IAM role has S3 permissions
- Verify bucket name is correct
- Check bucket exists in same region

### Issue: "Training stops/disconnects"
**Solution**:
- SageMaker notebooks stay running even if browser closes
- Check instance status in console
- Reopen notebook - training should still be running
- Use `nohup` or `screen` equivalent in notebook

---

## Advanced: Using SageMaker Training Job (Alternative)

Instead of training in notebook, you can use SageMaker Training Jobs:

### Create Training Job

**Cell: Submit Training Job**
```python
import sagemaker
from sagemaker.pytorch import PyTorch

# Initialize SageMaker session
sess = sagemaker.Session()
role = sagemaker.get_execution_role()  # Or specify your role ARN

# Create PyTorch estimator
estimator = PyTorch(
    entry_point='train_model.py',
    source_dir='.',  # Current directory
    role=role,
    instance_count=1,
    instance_type='ml.g4dn.xlarge',
    framework_version='2.0.1',
    py_version='py310',
    hyperparameters={
        'hint-file': 'HomoSapiens_binary_hq.txt',
        'num-epochs': 10,
        'batch-size': 32,
        'device': 'cuda'
    }
)

# Start training
estimator.fit({'training': 's3://your-bucket/training-data/'})
```

This is more complex but offers better job management.

---

## Next Steps

After training completes:
1. ✅ Model saved to S3
2. ✅ Embeddings cache saved to S3
3. ➡️ Proceed to SageMaker endpoint deployment (see `AWS_DEPLOYMENT_GUIDE.md`)
4. ➡️ Use S3 paths when creating SageMaker model

---

## Quick Reference

### Create Notebook Instance
- Console → SageMaker → Notebook instances → Create
- Instance type: `ml.g4dn.xlarge`
- IAM role: Create new with S3 access

### Install Dependencies
```python
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
!pip install fair-esm biopython requests pandas scikit-learn tqdm numpy
```

### Run Training
```python
!python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10 --device cuda
```

### Save to S3
```python
import boto3
s3 = boto3.client('s3')
s3.upload_file('model.pth', 'protein-ppi-models', 'model.pth')
s3.upload_file('embeddings_cache.pkl', 'protein-ppi-models', 'embeddings_cache.pkl')
```

---

## Cost Estimate (optional)

- **ml.g4dn.xlarge**: ~$0.736/hour
- **Training time**: 2-20 hours
- **Total cost**: ~$1.50 - $15 (one-time)

**Remember to stop the instance when not in use!**

Good luck with your training! 🚀

