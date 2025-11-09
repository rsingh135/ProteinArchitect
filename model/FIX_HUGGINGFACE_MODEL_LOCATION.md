# Fix: Hugging Face Model Location Issue

## Problem

You downloaded the model using Hugging Face transformers, but when checking for it at `~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt`, it shows 0.00 GB.

## Why This Happens

**Hugging Face stores models differently than PyTorch Hub:**

- **PyTorch Hub location**: `~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt`
- **Hugging Face location**: `~/.cache/huggingface/hub/models--facebook--esm2_t33_650M_UR50D/`
- **Hugging Face format**: `model.safetensors` (not `.pt`)

The ESM library expects the PyTorch Hub format, but Hugging Face stores it in its own format.

## Solution 1: Find Hugging Face Model Location

**Check where Hugging Face stored the model:**

```python
import os
from pathlib import Path

# Hugging Face cache directory
hf_cache = Path.home() / ".cache" / "huggingface" / "hub"

# Look for ESM model
model_dirs = list(hf_cache.glob("models--facebook--esm2_t33_650M_UR50D*"))

if model_dirs:
    print("✅ Found Hugging Face model:")
    for model_dir in model_dirs:
        print(f"   {model_dir}")
        
        # Check for model files
        safetensors_files = list(model_dir.rglob("*.safetensors"))
        if safetensors_files:
            for f in safetensors_files:
                size_gb = f.stat().st_size / (1024**3)
                print(f"   📄 {f.name}: {size_gb:.2f} GB")
else:
    print("❌ Model not found in Hugging Face cache")
```

## Solution 2: Use Hugging Face Model Directly

**Since you have the Hugging Face model, use it directly:**

```python
from transformers import EsmModel, EsmTokenizer
import torch

# Load from Hugging Face (uses cached model)
model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
tokenizer = EsmTokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D")

print("✅ Model loaded from Hugging Face!")
print(f"   Model device: {next(model.parameters()).device}")
```

**However**, the training script uses ESM library API, not Hugging Face API. You have two options:

### Option A: Download the PyTorch Hub .pt file (Recommended)

**Download the actual .pt file that ESM library expects:**

```python
import os
import subprocess

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading PyTorch Hub format model...")
print("This is different from Hugging Face format")

!wget --continue --progress=bar:force --tries=3 --timeout=30 \
      --user-agent="Mozilla/5.0" \
      -O {model_file} \
      {url}

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Downloaded: {size_gb:.2f} GB")
    print(f"   Location: {model_file}")
```

### Option B: Adapt Training Script to Use Hugging Face

This requires modifying the training script to use Hugging Face transformers API instead of ESM library API.

## Solution 3: Verify Both Locations

**Check both locations:**

```python
import os
from pathlib import Path

# Check PyTorch Hub location
pt_cache = Path.home() / ".cache" / "torch" / "hub" / "checkpoints"
pt_file = pt_cache / "esm2_t33_650M_UR50D.pt"

print("=" * 60)
print("Checking Model Locations")
print("=" * 60)

# PyTorch Hub
if pt_file.exists():
    size_gb = pt_file.stat().st_size / (1024**3)
    print(f"✅ PyTorch Hub: {size_gb:.2f} GB")
    print(f"   {pt_file}")
else:
    print("❌ PyTorch Hub: Not found")
    print(f"   Expected: {pt_file}")

# Hugging Face
hf_cache = Path.home() / ".cache" / "huggingface" / "hub"
model_dirs = list(hf_cache.glob("models--facebook--esm2_t33_650M_UR50D*"))

if model_dirs:
    print(f"\n✅ Hugging Face: Found {len(model_dirs)} model(s)")
    for model_dir in model_dirs:
        safetensors = list(model_dir.rglob("*.safetensors"))
        if safetensors:
            total_size = sum(f.stat().st_size for f in safetensors) / (1024**3)
            print(f"   Total size: {total_size:.2f} GB")
            print(f"   Location: {model_dir}")
else:
    print("\n❌ Hugging Face: Not found")
```

## Recommended Solution

**Since your training script uses ESM library, download the PyTorch Hub .pt file:**

```python
import os
import subprocess

# Create directory
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading PyTorch Hub format model (.pt file)...")
print("This is what ESM library expects")

# Download with wget
!wget --continue --progress=bar:force --tries=3 --timeout=30 \
      --user-agent="Mozilla/5.0" \
      -O {model_file} \
      {url}

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    if size_gb > 1.0:
        print(f"\n✅ Successfully downloaded PyTorch Hub model!")
        print(f"   Size: {size_gb:.2f} GB")
        print(f"   Location: {model_file}")
        print(f"\n✅ Now ESM library can load it!")
    else:
        print(f"\n❌ File too small: {size_gb:.2f} GB")
else:
    print("\n❌ Download failed")
```

## After Downloading .pt File

**Test that ESM library can load it:**

```python
import esm

try:
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ ESM library can load the model!")
    print(f"   Alphabet size: {len(alphabet)}")
except Exception as e:
    print(f"❌ Error: {e}")
```

## Summary

- ✅ **Hugging Face model is downloaded** (2.61 GB in `model.safetensors`)
- ❌ **But it's in wrong location/format** for ESM library
- ✅ **Solution**: Download the `.pt` file to `~/.cache/torch/hub/checkpoints/`
- ✅ **Then**: ESM library can load it, and training will work

The Hugging Face download is good, but you still need the PyTorch Hub format for the ESM library to work!

Good luck! 🚀

