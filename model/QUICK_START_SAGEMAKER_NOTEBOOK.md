# ⚡ Quick Start: Train on SageMaker Notebook

This is the fastest way to train with GPU access. Follow these steps:

## Prerequisites

- AWS account with SageMaker access
- IAM role with S3 permissions
- Training files: `train_model.py`, `HomoSapiens_binary_hq.txt`

---

## Step 1: Create Notebook Instance (5 minutes)

1. Go to: https://console.aws.amazon.com/sagemaker/
2. **Notebook** → **Notebook instances** → **Create notebook instance**
3. Configure:
   - **Name**: `protein-ppi-training`
   - **Instance type**: `ml.g4dn.xlarge` (GPU, ~$0.74/hour)
   - **IAM role**: Create new (with S3 access) or use existing
4. Click **"Create notebook instance"**
5. Wait 2-5 minutes for "InService" status
6. Click **"Open JupyterLab"**

---

## Step 2: Upload Notebook (2 minutes)

**Option A: Upload pre-made notebook**
1. In JupyterLab, click **"Upload"**
2. Upload: `model/notebook_training.ipynb`
3. Open the notebook

**Option B: Create new notebook**
1. Click **"New"** → **"Python 3"**
2. Copy cells from `SAGEMAKER_NOTEBOOK_TRAINING.md`

---

## Step 3: Upload Training Files (2 minutes)

1. In JupyterLab, click **"Upload"**
2. Upload:
   - `model/train_model.py`
   - `model/HomoSapiens_binary_hq.txt`
3. Verify files are in the notebook directory

---

## Step 4: Run Training (2-20 hours)

1. **Run Cell 1**: Install dependencies (5-10 minutes)
   ```python
   !pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   !pip install fair-esm biopython requests pandas scikit-learn tqdm numpy
   ```

2. **Run Cell 2**: Verify installation
   - Should show: `CUDA available: True`

3. **Run Cell 3**: Verify files exist
   - Should show: ✅ for both files

4. **Run Cell 4**: Start training
   ```python
   !python train_model.py \
     --hint_file HomoSapiens_binary_hq.txt \
     --num_epochs 10 \
     --device cuda \
     --batch_size 32
   ```

5. **Wait for completion** (2-20 hours)
   - You can close the browser - training continues
   - Check back later to see progress

---

## Step 5: Save to S3 (5 minutes)

1. **Run Cell 5**: Upload to S3
   ```python
   import boto3
   s3 = boto3.client('s3')
   BUCKET_NAME = 'protein-ppi-models'  # Change this!
   
   s3.upload_file('model.pth', BUCKET_NAME, 'model.pth')
   s3.upload_file('embeddings_cache.pkl', BUCKET_NAME, 'embeddings_cache.pkl')
   ```

2. **Note the S3 paths**:
   - `s3://protein-ppi-models/model.pth`
   - `s3://protein-ppi-models/embeddings_cache.pkl`

---

## Step 6: Stop Instance (Save Money!)

**Important**: Stop the notebook instance when not in use!

```python
import boto3
sagemaker = boto3.client('sagemaker')
sagemaker.stop_notebook_instance(NotebookInstanceName='protein-ppi-training')
```

Or via console: **Notebook instances** → Select instance → **Stop**

---

## Next Steps

1. ✅ Model trained and saved to S3
2. ➡️ Deploy to SageMaker endpoint (see `AWS_DEPLOYMENT_GUIDE.md`)
3. ➡️ Use S3 paths when creating SageMaker model

---

## Troubleshooting

### CUDA not available
- Check instance type has GPU (`ml.g4dn.xlarge` or higher)
- Restart kernel and rerun installation cell

### Files not found
- Check current directory: `!pwd`
- List files: `!ls -la`
- Upload files again

### Out of memory
- Reduce batch size: `--batch_size 16`
- Use larger instance: `ml.p3.2xlarge`

### Training stops
- SageMaker notebooks stay running even if browser closes
- Reopen notebook to check progress
- Training continues in background

---

## Cost Estimate

- **ml.g4dn.xlarge**: ~$0.736/hour
- **Training time**: 2-20 hours
- **Total**: ~$1.50 - $15 (one-time)

**Remember to stop the instance when not in use!**

---

## Full Documentation

- **Detailed guide**: `SAGEMAKER_NOTEBOOK_TRAINING.md`
- **Deployment**: `AWS_DEPLOYMENT_GUIDE.md`
- **Notebook file**: `notebook_training.ipynb`

Good luck! 🚀

