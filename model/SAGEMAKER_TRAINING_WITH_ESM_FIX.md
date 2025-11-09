# SageMaker Training - Updated with ESM Fix

## Important: Pre-download ESM Model

**Before running training, you MUST pre-download the ESM model to avoid 403 errors.**

## Updated Training Steps

### Step 1: Install Dependencies
```python
!pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
!pip install fair-esm biopython requests pandas scikit-learn tqdm numpy
```

### Step 2: Verify Installation
```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")

import esm
print("✅ ESM installed")
```

### Step 3: Upload Training Files
Upload `train_model.py` and `HomoSapiens_binary_hq.txt`

### Step 4: Verify Files
```python
import os
assert os.path.exists('train_model.py')
assert os.path.exists('HomoSapiens_binary_hq.txt')
```

### Step 5: ⚠️ PRE-DOWNLOAD ESM MODEL (REQUIRED!)

**This step is CRITICAL to avoid 403 errors:**

```python
import esm
import os

print("📥 Pre-downloading ESM2 model...")
print("This will take 5-10 minutes (~1.3 GB download)")
print("=" * 60)

try:
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("\n✅ Model downloaded and cached successfully!")
    
    # Verify
    cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
    model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
    if os.path.exists(model_file):
        size_gb = os.path.getsize(model_file) / (1024**3)
        print(f"✅ Cached at: {model_file}")
        print(f"   Size: {size_gb:.2f} GB")
        print(f"\n✅ Ready to run training!")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nIf you get a 403 error:")
    print("1. Wait a few minutes and try again")
    print("2. Check your network connection")
    print("3. See FIX_ESM_DOWNLOAD_ERROR.md for alternatives")
```

**Wait for this to complete before proceeding!**

### Step 6: Run Training

```python
!python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --num_epochs 10 \
  --device cuda \
  --batch_size 32
```

The training script will now load the model from cache (no 403 errors!).

### Step 7: Save to S3

```python
import boto3

s3 = boto3.client('s3')
BUCKET_NAME = 'protein-ppi-models'

s3.upload_file('model.pth', BUCKET_NAME, 'model.pth')
s3.upload_file('embeddings_cache.pkl', BUCKET_NAME, 'embeddings_cache.pkl')
```

## Why Pre-download?

- **403 errors** happen when downloading during training
- **Pre-downloading** allows the download to complete successfully
- **Cached model** loads instantly during training
- **No interruptions** during the long training process

## Updated Training Script

The `train_model.py` script now includes:
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Better error messages
- ✅ Automatic cache detection
- ✅ Clear instructions if download fails

## Troubleshooting

### If pre-download fails with 403:

1. **Wait and retry** - Network issues are common
2. **Try at different time** - Server load varies
3. **Use Hugging Face** - Alternative method (see FIX_ESM_DOWNLOAD_ERROR.md)
4. **Download manually** - Download to S3, then load from S3

### If training still fails:

1. **Verify model is cached**:
   ```python
   import os
   cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
   model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
   print(f"Model exists: {os.path.exists(model_file)}")
   ```

2. **Check file size** (should be ~1.3 GB):
   ```python
   if os.path.exists(model_file):
       size_gb = os.path.getsize(model_file) / (1024**3)
       print(f"Size: {size_gb:.2f} GB")
   ```

## Quick Reference

**Before training, always run:**
```python
import esm
model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
```

**Then verify:**
```python
import os
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
assert os.path.exists(os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt"))
```

**Then run training!**

Good luck! 🚀

