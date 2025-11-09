# 🔧 Copy-Paste This Cell Into Your Notebook

## Step 1: Download ESM Model with wget

**Copy this entire cell into your SageMaker notebook and run it:**

```python
import os
import subprocess

# Create cache directory
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("=" * 60)
print("📥 Downloading ESM2 Model")
print("=" * 60)
print(f"Destination: {model_file}")
print(f"Size: ~1.3 GB")
print(f"This will take 5-10 minutes...")
print("=" * 60)

# Check if already downloaded
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    if size_gb > 1.0:
        print(f"✅ Model already exists: {size_gb:.2f} GB")
        print("✅ Ready to use!")
    else:
        print(f"⚠️  Model exists but size is wrong: {size_gb:.2f} GB")
        print("   Re-downloading...")
        os.remove(model_file)

# Download using wget (most reliable)
if not os.path.exists(model_file):
    print("\n📥 Starting download...")
    try:
        # Use wget with proper flags
        result = subprocess.run(
            [
                "wget",
                "--continue",  # Resume if interrupted
                "--progress=bar:force",  # Show progress bar
                "--tries=3",  # Retry 3 times
                "--timeout=30",  # 30 second timeout
                "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                "-O", model_file,
                url
            ],
            check=True,
            timeout=900  # 15 minute timeout
        )
        
        # Verify download
        if os.path.exists(model_file):
            size_gb = os.path.getsize(model_file) / (1024**3)
            if size_gb > 1.0:
                print(f"\n✅ Download successful!")
                print(f"   Size: {size_gb:.2f} GB")
                print(f"   Location: {model_file}")
                print(f"\n✅ Model is ready to use!")
            else:
                print(f"\n❌ Downloaded file is too small: {size_gb:.2f} GB")
                print("   Expected: ~1.3 GB")
        else:
            print("\n❌ Download failed - file not found")
            
    except subprocess.CalledProcessError as e:
        print(f"\n❌ wget failed: {e}")
        print("\n📋 Alternative: Try downloading with curl (see below)")
    except FileNotFoundError:
        print("\n❌ wget not found")
        print("   Trying curl instead...")
        
        # Fallback to curl
        try:
            result = subprocess.run(
                [
                    "curl",
                    "-L",  # Follow redirects
                    "-o", model_file,
                    "--user-agent", "Mozilla/5.0",
                    "--retry", "3",
                    "--retry-delay", "5",
                    url
                ],
                check=True,
                timeout=900
            )
            
            if os.path.exists(model_file):
                size_gb = os.path.getsize(model_file) / (1024**3)
                if size_gb > 1.0:
                    print(f"\n✅ Download successful with curl!")
                    print(f"   Size: {size_gb:.2f} GB")
                else:
                    print(f"\n❌ Downloaded file is too small")
        except Exception as e:
            print(f"\n❌ curl also failed: {e}")
            print("\n📋 See MANUAL_ESM_DOWNLOAD.md for more options")
    except Exception as e:
        print(f"\n❌ Error: {e}")
```

## Step 2: Verify Model is Downloaded

**Run this cell to verify:**

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")

if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model found!")
    print(f"   Location: {model_file}")
    print(f"   Size: {size_gb:.2f} GB")
    
    if 1.2 < size_gb < 1.4:
        print("✅ Size is correct (~1.3 GB)")
        print("✅ Ready for training!")
    else:
        print("⚠️  Size seems incorrect")
else:
    print("❌ Model not found")
    print(f"   Expected at: {model_file}")
```

## Step 3: Test Loading the Model

**Run this cell to test:**

```python
import esm

try:
    print("🧪 Testing model loading...")
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ Model loaded successfully!")
    print(f"   Alphabet size: {len(alphabet)}")
    print(f"   Model device: {next(model.parameters()).device}")
    print("\n✅ Ready for training!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("\nIf you get an error, the model file may be corrupted.")
    print("Try re-downloading (delete the file first).")
```

## Alternative: Simple wget Command

**If the Python approach doesn't work, try this in a notebook cell:**

```bash
!mkdir -p ~/.cache/torch/hub/checkpoints
!cd ~/.cache/torch/hub/checkpoints && wget --continue --progress=bar:force --tries=3 --timeout=30 --user-agent="Mozilla/5.0" https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt
```

Then verify:
```python
import os
model_file = os.path.expanduser("~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt")
if os.path.exists(model_file):
    print(f"✅ Model downloaded: {os.path.getsize(model_file) / (1024**3):.2f} GB")
```

## If Still Not Working

1. **Check if wget/curl is available:**
   ```python
   !which wget
   !which curl
   ```

2. **Try downloading from Hugging Face instead:**
   ```python
   !pip install transformers
   from transformers import EsmModel
   model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
   ```

3. **See MANUAL_ESM_DOWNLOAD.md for more options**

Good luck! 🚀

