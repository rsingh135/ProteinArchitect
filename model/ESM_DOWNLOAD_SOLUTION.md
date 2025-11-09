# ✅ ESM Model Download - Complete Solution

## Quick Fix: Copy This Into Your Notebook

**In your SageMaker notebook, run these cells in order:**

### Cell 1: Download with wget (Most Reliable)

```python
import os
import subprocess

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading ESM2 model with wget...")
print("This will take 5-10 minutes (~1.3 GB)")

!wget --continue --progress=bar:force --tries=3 --timeout=30 \
      --user-agent="Mozilla/5.0" \
      -O {model_file} \
      {url}

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Downloaded: {size_gb:.2f} GB")
else:
    print("❌ Download failed - try next cell")
```

### Cell 2: Verify Download

```python
import os

model_file = os.path.expanduser("~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt")

if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model found: {size_gb:.2f} GB")
    if 1.2 < size_gb < 1.4:
        print("✅ Size is correct - ready for training!")
    else:
        print("⚠️  Size seems wrong")
else:
    print("❌ Model not found")
```

### Cell 3: Test Loading

```python
import esm

try:
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ Model loads successfully!")
    print("✅ Ready for training!")
except Exception as e:
    print(f"❌ Error: {e}")
```

## If wget Doesn't Work

### Try curl:

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

!curl -L -o {model_file} --user-agent "Mozilla/5.0" --retry 3 {url}
```

### Or use the complete notebook:

Upload and run: `model/notebook_pre_download_esm.ipynb`

This notebook has:
- ✅ wget method
- ✅ curl fallback
- ✅ Python requests fallback
- ✅ Verification steps
- ✅ Test loading

## After Download

1. ✅ Model is cached at: `~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt`
2. ✅ Run training - it will use the cached model
3. ✅ No more 403 errors!

## What Changed

- ✅ Updated `train_model.py` with multiple download methods
- ✅ Created `notebook_pre_download_esm.ipynb` with all methods
- ✅ Created `download_esm_model.py` script
- ✅ Created comprehensive documentation

## Files Created

- `notebook_pre_download_esm.ipynb` - Complete download notebook
- `download_esm_model.py` - Python download script
- `MANUAL_ESM_DOWNLOAD.md` - Detailed manual download guide
- `NOTEBOOK_CELL_DOWNLOAD_ESM.md` - Copy-paste cells
- `ESM_DOWNLOAD_SOLUTION.md` - This file (quick reference)

## Next Steps

1. **Run the download cell** in your notebook
2. **Wait for download** (5-10 minutes)
3. **Verify model exists** (run verification cell)
4. **Run training** - it will use cached model

Good luck! 🚀

