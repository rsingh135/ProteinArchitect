# ⚡ Quick Fix: ESM Model 403 Error

## Problem

Training fails with:
```
urllib.error.HTTPError: HTTP Error 403: Forbidden
Exception: Could not load https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt
```

## Solution: Pre-download Model

**In your SageMaker notebook, add a cell BEFORE running training:**

### Step 1: Pre-download Cell

```python
import esm
import torch
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
    print("\nTry again or see FIX_ESM_DOWNLOAD_ERROR.md for alternatives")
```

### Step 2: Run This Cell First

1. **Run the pre-download cell** above
2. **Wait for download to complete** (5-10 minutes)
3. **Then run training** - it will use the cached model

### Step 3: Verify Model is Cached

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")

if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model cached: {size_gb:.2f} GB")
else:
    print("❌ Model not cached - run pre-download cell first")
```

## Why This Works

- **403 errors happen** when downloading during training
- **Pre-downloading** in a separate cell allows the download to complete
- **Cached model** is then loaded instantly during training
- **No 403 errors** because model is already downloaded

## Updated Training Script

The training script now has:
- ✅ Retry logic (3 attempts)
- ✅ Better error messages
- ✅ Instructions for pre-downloading
- ✅ Automatic cache detection

## Next Steps

1. ✅ Add pre-download cell to your notebook
2. ✅ Run pre-download cell
3. ✅ Wait for download (5-10 minutes)
4. ✅ Run training - it will use cached model
5. ✅ Training should complete without 403 errors

## Alternative: Use Hugging Face

If pre-download still fails, use Hugging Face transformers:

```python
from transformers import EsmModel, EsmTokenizer

model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
tokenizer = EsmTokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D")
```

See `FIX_ESM_DOWNLOAD_ERROR.md` for full details.

Good luck! 🚀

