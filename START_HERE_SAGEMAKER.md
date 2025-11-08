# 🚀 Start Here: SageMaker Notebook Training

**This is the recommended method for training with GPU access.**

## Quick Overview

1. Create SageMaker notebook instance (5 min)
2. Upload notebook and files (5 min)
3. Run training (2-20 hours)
4. Save model to S3 (5 min)
5. Deploy to SageMaker endpoint (30 min)

---

## Step-by-Step

### 1. Create Notebook Instance

**Go to**: https://console.aws.amazon.com/sagemaker/

1. Click **"Notebook"** → **"Notebook instances"** → **"Create notebook instance"**
2. **Name**: `protein-ppi-training`
3. **Instance type**: `ml.g4dn.xlarge` (GPU, ~$0.74/hour)
4. **IAM role**: Create new role with S3 access
5. Click **"Create notebook instance"**
6. Wait 2-5 minutes for "InService"
7. Click **"Open JupyterLab"**

### 2. Upload Files

**In JupyterLab**:
1. Click **"Upload"** button
2. Upload these files:
   - `model/notebook_training.ipynb` (the notebook)
   - `model/train_model.py` (training script)
   - `model/HomoSapiens_binary_hq.txt` (dataset)
3. Open `notebook_training.ipynb`

### 3. Run Training

**In the notebook**:

1. **Run Cell 1**: Install dependencies
   - Wait 5-10 minutes for installation
   - Should show: "✅ Dependencies installed"

2. **Run Cell 2**: Verify installation
   - Should show: `CUDA available: True`
   - Should show: `✅ ESM installed successfully`

3. **Run Cell 3**: Verify files
   - Should show: ✅ for both `train_model.py` and `HomoSapiens_binary_hq.txt`

4. **Run Cell 4**: Start training
   - This will take 2-20 hours
   - You can close the browser - training continues
   - Check back later to see progress

5. **Run Cell 5**: Verify model files
   - Should show: ✅ for `model.pth` and `embeddings_cache.pkl`

6. **Run Cell 6**: Save to S3
   - Change `BUCKET_NAME` to your bucket name
   - Files will be uploaded to S3
   - Note the S3 paths for deployment

### 4. Stop Instance (Save Money!)

**Important**: Stop the notebook instance when not in use!

**In notebook** (last cell):
```python
import boto3
sagemaker = boto3.client('sagemaker')
sagemaker.stop_notebook_instance(NotebookInstanceName='protein-ppi-training')
```

**Or via console**:
- Go to **Notebook instances**
- Select `protein-ppi-training`
- Click **"Stop"**

### 5. Deploy to SageMaker Endpoint

See `AWS_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

**Quick summary**:
1. Build Docker image
2. Push to ECR
3. Create SageMaker model (use S3 paths from step 3)
4. Create endpoint configuration
5. Create endpoint
6. Wait for "InService" status

---

## Files You Need

- ✅ `model/notebook_training.ipynb` - Ready-to-use notebook
- ✅ `model/train_model.py` - Training script
- ⏳ `model/HomoSapiens_binary_hq.txt` - Dataset (you need to download this)

---

## Documentation

- **Quick start**: `QUICK_START_SAGEMAKER_NOTEBOOK.md`
- **Detailed guide**: `SAGEMAKER_NOTEBOOK_TRAINING.md`
- **Deployment**: `AWS_DEPLOYMENT_GUIDE.md`
- **Notebook**: `model/notebook_training.ipynb`

---

## Cost Estimate

- **ml.g4dn.xlarge**: ~$0.736/hour
- **Training time**: 2-20 hours
- **Total**: ~$1.50 - $15 (one-time)

**Remember to stop the instance when not in use!**

---

## Troubleshooting

### CUDA not available
- Make sure instance type has GPU (`ml.g4dn.xlarge` or higher)
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

---

## Next Steps

1. ✅ Model trained and saved to S3
2. ➡️ Deploy to SageMaker endpoint
3. ➡️ Update backend to use SageMaker endpoint
4. ➡️ Test end-to-end

Good luck! 🚀

