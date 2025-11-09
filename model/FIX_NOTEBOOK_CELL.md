# 🔧 Fix: Download PyTorch Hub .pt File

## Copy This Cell Into Your Notebook

**Run this to download the correct .pt file that ESM library needs:**

```python
import os
import subprocess

# Create directory
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("=" * 60)
print("📥 Downloading PyTorch Hub Format (.pt file)")
print("=" * 60)
print(f"Destination: {model_file}")
print(f"Size: ~1.3 GB")
print("=" * 60)

# Check if already exists
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    if size_gb > 1.0:
        print(f"✅ Model already exists: {size_gb:.2f} GB")
        print("✅ Ready to use!")
    else:
        print(f"⚠️  Model exists but size is wrong ({size_gb:.2f} GB), re-downloading...")
        os.remove(model_file)

# Download with wget
if not os.path.exists(model_file):
    print("\n📥 Starting download (this will take 5-10 minutes)...")
    try:
        result = subprocess.run(
            [
                "wget",
                "--continue",
                "--progress=bar:force",
                "--tries=3",
                "--timeout=30",
                "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                "-O", model_file,
                url
            ],
            check=True,
            timeout=900
        )
        
        if os.path.exists(model_file):
            size_gb = os.path.getsize(model_file) / (1024**3)
            if size_gb > 1.0:
                print(f"\n✅ Download successful!")
                print(f"   Size: {size_gb:.2f} GB")
                print(f"   Location: {model_file}")
                print(f"\n✅ ESM library can now load this model!")
            else:
                print(f"\n❌ File too small: {size_gb:.2f} GB")
    except FileNotFoundError:
        print("❌ wget not found, trying curl...")
        # Try curl as fallback
        subprocess.run(
            [
                "curl",
                "-L",
                "-o", model_file,
                "--user-agent", "Mozilla/5.0",
                "--retry", "3",
                url
            ],
            check=True,
            timeout=900
        )
        if os.path.exists(model_file):
            size_gb = os.path.getsize(model_file) / (1024**3)
            print(f"✅ Downloaded with curl: {size_gb:.2f} GB")
    except Exception as e:
        print(f"❌ Error: {e}")
```

## Verify It Works

**After downloading, test:**

```python
import esm

try:
    print("🧪 Testing ESM library model loading...")
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ Model loaded successfully!")
    print(f"   Alphabet size: {len(alphabet)}")
    print("\n✅ Ready for training!")
except Exception as e:
    print(f"❌ Error: {e}")
    print("   Make sure the .pt file is downloaded correctly")
```

## Check Both Locations

**See what you have:**

```python
import os
from pathlib import Path

print("=" * 60)
print("Model Locations Check")
print("=" * 60)

# PyTorch Hub (what ESM needs)
pt_file = Path.home() / ".cache" / "torch" / "hub" / "checkpoints" / "esm2_t33_650M_UR50D.pt"
print(f"\n1. PyTorch Hub (ESM library):")
if pt_file.exists():
    size = pt_file.stat().st_size / (1024**3)
    print(f"   ✅ Found: {size:.2f} GB")
    print(f"   ✅ This is what ESM library needs!")
else:
    print(f"   ❌ Not found - need to download")

# Hugging Face (what you already have)
hf_cache = Path.home() / ".cache" / "huggingface" / "hub"
hf_dirs = list(hf_cache.glob("models--facebook--esm2_t33_650M_UR50D*"))
print(f"\n2. Hugging Face (transformers library):")
if hf_dirs:
    print(f"   ✅ Found: Hugging Face format")
    for d in hf_dirs:
        safetensors = list(d.rglob("*.safetensors"))
        if safetensors:
            total = sum(f.stat().st_size for f in safetensors) / (1024**3)
            print(f"   Size: {total:.2f} GB")
    print(f"   ⚠️  Different format - ESM library can't use this directly")
else:
    print(f"   ❌ Not found")
```

## Summary

- ✅ **Hugging Face model downloaded** (2.61 GB) - Good for `transformers` library
- ❌ **PyTorch Hub model missing** - Need this for `esm` library
- ✅ **Solution**: Download the `.pt` file (run the cell above)
- ✅ **Then**: Training will work!

Good luck! 🚀

