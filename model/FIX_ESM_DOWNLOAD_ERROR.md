# Fix ESM Model Download 403 Error

## Problem

ESM2 model download is failing with HTTP 403 Forbidden error:
```
urllib.error.HTTPError: HTTP Error 403: Forbidden
Exception: Could not load https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt
```

## Solutions

### Solution 1: Pre-download Model in Notebook (Recommended)

Before running training, download the model in a notebook cell:

**In SageMaker Notebook**:

```python
# Cell 1: Pre-download ESM model
import torch
import esm

print("Downloading ESM2 model...")
# This will download to cache
model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
print("✅ Model downloaded successfully!")

# Verify the model file location
import os
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
if os.path.exists(model_file):
    print(f"✅ Model cached at: {model_file}")
    print(f"   Size: {os.path.getsize(model_file) / (1024**3):.2f} GB")
```

### Solution 2: Use Hugging Face Transformers (Alternative)

Update the training script to use Hugging Face transformers instead:

```python
from transformers import EsmModel, EsmTokenizer

# Load model from Hugging Face (more reliable)
model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
tokenizer = EsmTokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D")
```

### Solution 3: Download Manually and Upload to S3

1. **Download model locally** (on your machine):
   ```bash
   # Download the model file
   wget https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt
   ```

2. **Upload to S3**:
   ```bash
   aws s3 cp esm2_t33_650M_UR50D.pt s3://your-bucket/models/esm2_t33_650M_UR50D.pt
   ```

3. **Download in notebook**:
   ```python
   import boto3
   import os
   
   s3 = boto3.client('s3')
   cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
   os.makedirs(cache_dir, exist_ok=True)
   
   model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
   s3.download_file('your-bucket', 'models/esm2_t33_650M_UR50D.pt', model_file)
   ```

### Solution 4: Add Retry Logic to Training Script

Update `train_model.py` to retry the download with exponential backoff.

### Solution 5: Use Alternative Model URL

Try loading from Hugging Face directly using transformers library.

## Recommended Approach

**For SageMaker Notebook**:

1. **Add a cell before training** to pre-download the model:
   ```python
   import esm
   import torch
   
   print("Pre-downloading ESM2 model...")
   try:
       model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
       print("✅ Model downloaded and cached!")
   except Exception as e:
       print(f"❌ Error: {e}")
       print("Trying alternative method...")
   ```

2. **Run this cell first** and wait for download to complete (5-10 minutes)

3. **Then run training** - the model will be loaded from cache

## Quick Fix for Current Training

If you're already in the middle of training:

1. **Stop the current training**
2. **Run the pre-download cell** (Solution 1)
3. **Wait for download to complete**
4. **Restart training** - it will use the cached model

## Verify Model is Cached

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")

if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model cached: {model_file}")
    print(f"   Size: {size_gb:.2f} GB")
else:
    print("❌ Model not cached - need to download")
```

## Why This Happens

- **Rate limiting**: Facebook servers may rate-limit downloads
- **Network restrictions**: AWS may have network restrictions
- **Temporary server issues**: Facebook servers may be temporarily unavailable
- **User-Agent blocking**: Some servers block automated downloads

## Next Steps

1. **Try Solution 1 first** (pre-download in notebook)
2. **If that fails**, try Solution 2 (Hugging Face transformers)
3. **If still failing**, use Solution 3 (manual download and S3)

Good luck! 🚀

