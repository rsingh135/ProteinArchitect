# Manual ESM Model Download - Step by Step

## Problem

The ESM model download is failing with 403 errors. Here are **multiple ways** to download it manually.

## Method 1: Using wget in Notebook (Recommended)

**In your SageMaker notebook, run this cell:**

```python
import os
import subprocess

# Create cache directory
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading ESM2 model using wget...")
print(f"   Destination: {model_file}")
print("   This will take 5-10 minutes (~1.3 GB)")

# Download using wget
!wget --continue --progress=bar:force --tries=3 --timeout=30 \
      --user-agent="Mozilla/5.0" \
      -O {model_file} \
      {url}

# Verify download
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"\n✅ Model downloaded: {size_gb:.2f} GB")
    print(f"   Location: {model_file}")
else:
    print("❌ Download failed")
```

## Method 2: Using curl in Notebook

**Alternative if wget doesn't work:**

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading ESM2 model using curl...")

!curl -L -o {model_file} \
      --user-agent "Mozilla/5.0" \
      --retry 3 \
      --retry-delay 5 \
      {url}

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"\n✅ Model downloaded: {size_gb:.2f} GB")
```

## Method 3: Using Python requests

```python
import requests
import os
from tqdm import tqdm

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"

print("📥 Downloading ESM2 model using requests...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

response = requests.get(url, headers=headers, stream=True)
total_size = int(response.headers.get('content-length', 0))

with open(model_file, 'wb') as f, tqdm(
    desc="Downloading",
    total=total_size,
    unit='B',
    unit_scale=True,
    unit_divisor=1024,
) as bar:
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            f.write(chunk)
            bar.update(len(chunk))

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"\n✅ Model downloaded: {size_gb:.2f} GB")
```

## Method 4: Terminal Command (SSH into instance)

If you have SSH access to your SageMaker instance:

```bash
# SSH into your SageMaker instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Create cache directory
mkdir -p ~/.cache/torch/hub/checkpoints
cd ~/.cache/torch/hub/checkpoints

# Download model
wget https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt

# Verify
ls -lh esm2_t33_650M_UR50D.pt
# Should show ~1.3 GB
```

## Method 5: Download from S3 (if you pre-upload)

If you've already downloaded the model elsewhere:

```python
import boto3
import os

s3 = boto3.client('s3')
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
os.makedirs(cache_dir, exist_ok=True)

model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")

# Download from S3
s3.download_file('your-bucket', 'models/esm2_t33_650M_UR50D.pt', model_file)

# Verify
if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model downloaded from S3: {size_gb:.2f} GB")
```

## Method 6: Use Hugging Face (Alternative)

Instead of using ESM library, use Hugging Face transformers:

```python
# Install transformers
!pip install transformers

# Load model
from transformers import EsmModel, EsmTokenizer

model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
tokenizer = EsmTokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D")

# Note: You'll need to adapt your code to use Hugging Face API
# instead of ESM library API
```

## Verify Model is Downloaded

**After downloading, verify the model exists:**

```python
import os

cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")

if os.path.exists(model_file):
    size_gb = os.path.getsize(model_file) / (1024**3)
    print(f"✅ Model found!")
    print(f"   Location: {model_file}")
    print(f"   Size: {size_gb:.2f} GB")
    print(f"   Expected: ~1.3 GB")
    
    if size_gb > 1.0 and size_gb < 2.0:
        print("✅ Size looks correct!")
    else:
        print("⚠️  Size seems incorrect - may be corrupted")
else:
    print("❌ Model not found")
    print(f"   Expected at: {model_file}")
```

## Test Loading the Model

**After downloading, test that it loads:**

```python
import esm

try:
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub("facebook/esm2_t33_650M_UR50D")
    print("✅ Model loaded successfully!")
    print(f"   Alphabet size: {len(alphabet)}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("   Model file may be corrupted or in wrong location")
```

## Recommended Workflow

1. **Try Method 1 first** (wget in notebook) - usually works
2. **If that fails**, try Method 2 (curl)
3. **If still failing**, try Method 3 (Python requests)
4. **As last resort**, use Method 6 (Hugging Face)

## After Downloading

Once the model is downloaded:

1. ✅ Verify it exists and is the right size (~1.3 GB)
2. ✅ Test loading it with `esm.pretrained.load_model_and_alphabet_hub()`
3. ✅ Run training - it will use the cached model

## Troubleshooting

### If download is slow:
- Network may be slow - be patient (5-10 minutes is normal)
- Try at different times
- Use `--continue` flag to resume interrupted downloads

### If download fails:
- Check network connection
- Try different user agent
- Try different download method
- Download from different location (Hugging Face)

### If model doesn't load:
- Verify file size is correct (~1.3 GB)
- Check file permissions
- Try re-downloading
- Check cache directory path

Good luck! 🚀

