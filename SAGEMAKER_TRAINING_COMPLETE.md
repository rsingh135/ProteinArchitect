# ✅ SageMaker Notebook Training - Complete Guide

## 🎯 What You Asked For

You requested **specific and detailed instructions** for training on AWS SageMaker using a notebook (instead of EC2), since that's where you have GPU access.

## 📚 Documentation Created

I've created comprehensive documentation for you:

### 1. **SAGEMAKER_NOTEBOOK_TRAINING.md** (Detailed Guide)
   - Complete step-by-step instructions
   - Console navigation details
   - Code examples for every step
   - Troubleshooting guide
   - Cost optimization tips

### 2. **notebook_training.ipynb** (Ready-to-Use Notebook)
   - Pre-configured Jupyter notebook
   - All cells ready to run
   - Upload this to SageMaker and run!

### 3. **QUICK_START_SAGEMAKER_NOTEBOOK.md** (Quick Reference)
   - Fast summary of steps
   - Essential commands only
   - Perfect for quick reference

### 4. **START_HERE_SAGEMAKER.md** (Getting Started)
   - Clear step-by-step walkthrough
   - What to click, where to go
   - Perfect for first-time setup

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Notebook Instance

1. Go to: https://console.aws.amazon.com/sagemaker/
2. Click **"Notebook"** → **"Notebook instances"** → **"Create notebook instance"**
3. Configure:
   - **Name**: `protein-ppi-training`
   - **Instance type**: `ml.g4dn.xlarge` (GPU)
   - **IAM role**: Create new (with S3 access)
4. Click **"Create notebook instance"**
5. Wait 2-5 minutes, then click **"Open JupyterLab"**

### Step 2: Upload Files

**In JupyterLab**:
1. Click **"Upload"** button
2. Upload:
   - `model/notebook_training.ipynb`
   - `model/train_model.py`
   - `model/HomoSapiens_binary_hq.txt`
3. Open `notebook_training.ipynb`

### Step 3: Run Training

**In the notebook**, run cells in order:

1. **Cell 1**: Install dependencies (5-10 min)
2. **Cell 2**: Verify installation (should show CUDA available)
3. **Cell 3**: Verify files exist
4. **Cell 4**: Start training (2-20 hours)
5. **Cell 5**: Verify model files created
6. **Cell 6**: Save to S3
7. **Cell 7**: Verify S3 upload

### Step 4: Stop Instance (Save Money!)

```python
import boto3
sagemaker = boto3.client('sagemaker')
sagemaker.stop_notebook_instance(NotebookInstanceName='protein-ppi-training')
```

---

## 📋 Detailed Steps

### 1. Create SageMaker Notebook Instance

**Go to AWS Console**:
- URL: https://console.aws.amazon.com/sagemaker/
- Navigate: **Notebook** → **Notebook instances** → **Create notebook instance**

**Configure**:
- **Notebook instance name**: `protein-ppi-training`
- **Instance type**: 
  - `ml.g4dn.xlarge` (recommended, ~$0.74/hour)
  - `ml.p3.2xlarge` (faster, more expensive)
- **Platform identifier**: `notebook-al2-v1` or `notebook-al2-v2`
- **IAM role**: 
  - Click "Create new role"
  - Select "Any S3 bucket" (or create custom role)
  - Note the role ARN
- **Network**: Leave default (allows internet access)
- **Root access**: Enable if needed

**Click "Create notebook instance"**

**Wait**: Status changes from "Pending" → "InService" (2-5 minutes)

**Open**: Click "Open JupyterLab" when ready

### 2. Set Up Environment in Notebook

**Option A: Use Pre-Made Notebook** (Recommended)
1. Upload `model/notebook_training.ipynb` to JupyterLab
2. Open the notebook
3. All cells are ready to run!

**Option B: Create New Notebook**
1. Click "New" → "Python 3"
2. Copy cells from `SAGEMAKER_NOTEBOOK_TRAINING.md`

### 3. Install Dependencies

**Run this cell**:
```python
# Install PyTorch with CUDA support
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
!pip install fair-esm biopython requests pandas scikit-learn tqdm numpy

print("✅ Dependencies installed")
```

**Wait**: 5-10 minutes for installation

**Verify**:
```python
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA device: {torch.cuda.get_device_name(0)}")
```

Should show: `CUDA available: True`

### 4. Upload Training Files

**Option A: Upload via Jupyter Interface**
1. Click "Upload" button in JupyterLab
2. Upload:
   - `train_model.py`
   - `HomoSapiens_binary_hq.txt`
3. Files appear in notebook directory

**Option B: Clone from GitHub** (if repo is public)
```python
!git clone https://github.com/your-username/GenLab.git
!cp GenLab/model/train_model.py .
!cp GenLab/model/HomoSapiens_binary_hq.txt .
```

**Option C: Download from S3** (if files are in S3)
```python
import boto3
s3 = boto3.client('s3')
s3.download_file('your-bucket', 'train_model.py', 'train_model.py')
s3.download_file('your-bucket', 'HomoSapiens_binary_hq.txt', 'HomoSapiens_binary_hq.txt')
```

### 5. Verify Files

**Run this cell**:
```python
import os

required_files = ['train_model.py', 'HomoSapiens_binary_hq.txt']
for file in required_files:
    if os.path.exists(file):
        size_mb = os.path.getsize(file) / (1024 * 1024)
        print(f"✅ {file} exists ({size_mb:.2f} MB)")
    else:
        print(f"❌ {file} NOT found")
```

Should show: ✅ for both files

### 6. Run Training

**Quick test first** (optional):
```python
!head -100 HomoSapiens_binary_hq.txt > test_hint.txt
!python train_model.py --hint_file test_hint.txt --num_epochs 1 --device cuda --batch_size 4
```

**Full training**:
```python
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
```

**This will take 2-20 hours**
- You can close the browser - training continues
- Check back later to see progress
- Notebook instance stays running

### 7. Verify Model Files

**After training completes**, run:
```python
import os

model_files = ['model.pth', 'embeddings_cache.pkl']
for file in model_files:
    if os.path.exists(file):
        size_mb = os.path.getsize(file) / (1024 * 1024)
        print(f"✅ {file} exists ({size_mb:.2f} MB)")
    else:
        print(f"❌ {file} NOT found")
```

Should show: ✅ for both files

### 8. Save Model to S3

**Run this cell**:
```python
import boto3
import os

# Initialize S3 client
s3 = boto3.client('s3')

# Set your bucket name (change this!)
BUCKET_NAME = 'protein-ppi-models'  # Change to your bucket name
MODEL_KEY = 'model.pth'
EMBEDDINGS_KEY = 'embeddings_cache.pkl'

# Create bucket if it doesn't exist
try:
    s3.create_bucket(Bucket=BUCKET_NAME)
    print(f"✅ Created bucket: {BUCKET_NAME}")
except Exception as e:
    if 'BucketAlreadyOwnedByYou' in str(e) or 'BucketAlreadyExists' in str(e):
        print(f"✅ Bucket {BUCKET_NAME} already exists")
    else:
        print(f"⚠️  Error: {e}")

# Upload model files
print("\n📤 Uploading model files to S3...")

if os.path.exists('model.pth'):
    s3.upload_file('model.pth', BUCKET_NAME, MODEL_KEY)
    print(f"✅ Uploaded: s3://{BUCKET_NAME}/{MODEL_KEY}")
else:
    print("❌ model.pth not found")

if os.path.exists('embeddings_cache.pkl'):
    s3.upload_file('embeddings_cache.pkl', BUCKET_NAME, EMBEDDINGS_KEY)
    print(f"✅ Uploaded: s3://{BUCKET_NAME}/{EMBEDDINGS_KEY}")
else:
    print("❌ embeddings_cache.pkl not found")

print("\n✅ All files uploaded to S3!")
print(f"\nS3 Paths for SageMaker deployment:")
print(f"Model: s3://{BUCKET_NAME}/{MODEL_KEY}")
print(f"Embeddings: s3://{BUCKET_NAME}/{EMBEDDINGS_KEY}")
```

**Note the S3 paths** - you'll need them for deployment!

### 9. Stop Instance (Save Money!)

**Important**: Stop the notebook instance when not in use!

```python
import boto3
sagemaker = boto3.client('sagemaker')
sagemaker.stop_notebook_instance(NotebookInstanceName='protein-ppi-training')
```

**Or via console**:
- Go to **Notebook instances**
- Select `protein-ppi-training`
- Click **"Stop"**

---

## 🔧 Troubleshooting

### CUDA not available
**Problem**: `CUDA available: False`

**Solution**:
- Check instance type has GPU (`ml.g4dn.xlarge` or higher)
- Restart kernel and rerun installation cell
- Verify PyTorch CUDA installation

### Files not found
**Problem**: `❌ train_model.py NOT found`

**Solution**:
- Check current directory: `!pwd`
- List files: `!ls -la`
- Upload files again via Jupyter interface
- Make sure files are in the same directory as notebook

### Out of memory
**Problem**: `CUDA out of memory`

**Solution**:
- Reduce batch size: `--batch_size 16` or `--batch_size 8`
- Use larger instance: `ml.p3.2xlarge`
- Reduce dataset size (use first N rows for testing)

### Training stops/disconnects
**Problem**: Training seems to stop

**Solution**:
- SageMaker notebooks stay running even if browser closes
- Reopen notebook to check progress
- Training continues in background
- Check instance status in console

### S3 upload fails
**Problem**: `AccessDenied` or `BucketNotFound`

**Solution**:
- Check IAM role has S3 permissions
- Verify bucket name is correct
- Check bucket exists in same region as notebook
- Create bucket manually if needed

---

## 💰 Cost Estimate

- **ml.g4dn.xlarge**: ~$0.736/hour
- **Training time**: 2-20 hours
- **Total cost**: ~$1.50 - $15 (one-time)

**Remember to stop the instance when not in use!**

### Cost Optimization

1. **Stop instance when not training**: Notebook instances charge by the hour
2. **Use smaller instance for testing**: `ml.t3.medium` for testing
3. **Delete instance after training**: Don't leave it running
4. **Use Spot instances**: Can save up to 70% (if available)

---

## 📁 Files Reference

### Files You Need
- ✅ `model/notebook_training.ipynb` - Ready-to-use notebook
- ✅ `model/train_model.py` - Training script
- ⏳ `model/HomoSapiens_binary_hq.txt` - Dataset (you need to download this)

### Files Created After Training
- ✅ `model.pth` - Trained model
- ✅ `embeddings_cache.pkl` - Embeddings cache
- ✅ S3: `s3://protein-ppi-models/model.pth`
- ✅ S3: `s3://protein-ppi-models/embeddings_cache.pkl`

---

## 🎯 Next Steps

After training completes:

1. ✅ Model trained and saved to S3
2. ➡️ Deploy to SageMaker endpoint (see `AWS_DEPLOYMENT_GUIDE.md`)
3. ➡️ Use S3 paths when creating SageMaker model:
   - Model: `s3://protein-ppi-models/model.pth`
   - Embeddings: `s3://protein-ppi-models/embeddings_cache.pkl`
4. ➡️ Update backend to use SageMaker endpoint
5. ➡️ Test end-to-end

---

## 📚 Documentation Links

- **Quick start**: `QUICK_START_SAGEMAKER_NOTEBOOK.md`
- **Detailed guide**: `SAGEMAKER_NOTEBOOK_TRAINING.md`
- **Getting started**: `START_HERE_SAGEMAKER.md`
- **Deployment**: `AWS_DEPLOYMENT_GUIDE.md`
- **Notebook**: `model/notebook_training.ipynb`

---

## ✅ Checklist

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
- [ ] Open JupyterLab

### Set Up Environment
- [ ] Upload `notebook_training.ipynb` or create new notebook
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

## 🚀 You're Ready!

Follow the steps above, and you'll have a trained model on S3 ready for deployment!

**Questions?** Check the troubleshooting section or refer to the detailed guides.

Good luck with your training! 🎉

