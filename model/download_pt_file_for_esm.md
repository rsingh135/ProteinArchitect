# Download PyTorch Hub .pt File for ESM Library

## The Issue

You downloaded the model using Hugging Face transformers, which stores it as `model.safetensors` in `~/.cache/huggingface/hub/`. However, the ESM library expects a `.pt` file in `~/.cache/torch/hub/checkpoints/`.

## Quick Fix: Download the .pt File

**Run this in your notebook:**

```python
import os
import subprocess

# Create directory
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("=" * 60)
print("📥 Downloading PyTorch Hub Format Model")
print("=" * 60)
print(f"Destination: {model_file}")
print(f"Size: ~1.3 GB")
print("=" * 60)

# Check if already exists
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    if size_gb > 1.0:
        print(f"✅ Model already exists: {size_gb:.2f} GB")
    else:
        print(f"⚠️  Model exists but size is wrong, re-downloading...")
        os.remove(model_file)

# Download with wget
if not os.path.exists(model_file):
    print("\n📥 Downloading...")
    !wget --continue --progress=bar:force --tries=3 --timeout=30 \
          --user-agent="Mozilla/5.0" \
          -O {model_file} \
          {url}

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    if size_gb > 1.0:
        print(f"\n✅ Download successful!")
        print(f"   Size: {size_gb:.2f} GB")
        print(f"   Location: {model_file}")
        print(f"\n✅ ESM library can now load this model!")
    else:
        print(f"\n❌ File too small: {size_gb:.2f} GB")
```

## Verify It Works

**After downloading, test:**

```python
import esm

try:
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ ESM library loaded the model successfully!")
    print(f"   Alphabet size: {len(alphabet)}")
    print("\n✅ Ready for training!")
except Exception as e:
    print(f"❌ Error: {e}")
```

## Check Both Locations

**See what you have in both locations:**

```python
import os
from pathlib import Path

# PyTorch Hub
pt_file = Path.home() / ".cache" / "torch" / "hub" / "checkpoints" / "esm2_t33_650M_UR50D.pt"
if pt_file.exists():
    size = pt_file.stat().st_size / (1024**3)
    print(f"✅ PyTorch Hub: {size:.2f} GB")
else:
    print("❌ PyTorch Hub: Not found")

# Hugging Face
hf_cache = Path.home() / ".cache" / "huggingface" / "hub"
hf_dirs = list(hf_cache.glob("models--facebook--esm2_t33_650M_UR50D*"))
if hf_dirs:
    print(f"✅ Hugging Face: Found (different format)")
    for d in hf_dirs:
        safetensors = list(d.rglob("*.safetensors"))
        if safetensors:
            total = sum(f.stat().st_size for f in safetensors) / (1024**3)
            print(f"   Size: {total:.2f} GB")
```

## Why You Need Both

- **Hugging Face model**: Good for using with `transformers` library
- **PyTorch Hub model**: Required for `esm` library (which your training script uses)

The training script uses `esm.pretrained.load_model_and_alphabet_hub()`, so it needs the PyTorch Hub format.

## After Downloading

1. ✅ Download the .pt file (run the cell above)
2. ✅ Verify it exists and is ~1.3 GB
3. ✅ Test that ESM library can load it
4. ✅ Run training - it will work now!

Good luck! 🚀

