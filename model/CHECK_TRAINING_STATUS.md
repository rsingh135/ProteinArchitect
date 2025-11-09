# Check if Model Training Completed

## Quick Check: Run This in Your Notebook

**Copy this cell into your SageMaker notebook and run it:**

```python
import os
from pathlib import Path
from datetime import datetime

print("=" * 60)
print("Checking Training Status")
print("=" * 60)

# Check for model files
model_file = Path("model.pth")
embeddings_file = Path("embeddings_cache.pkl")

print("\n1. Model Files:")
if model_file.exists():
    size_gb = model_file.stat().st_size / (1024**3)
    mtime = datetime.fromtimestamp(model_file.stat().st_mtime)
    print(f"   ✅ model.pth exists!")
    print(f"      Size: {size_gb:.2f} GB")
    print(f"      Last modified: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"      Age: {datetime.now() - mtime}")
else:
    print("   ❌ model.pth NOT found")

if embeddings_file.exists():
    size_gb = embeddings_file.stat().st_size / (1024**3)
    mtime = datetime.fromtimestamp(embeddings_file.stat().st_mtime)
    print(f"\n   ✅ embeddings_cache.pkl exists!")
    print(f"      Size: {size_gb:.2f} GB")
    print(f"      Last modified: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"      Age: {datetime.now() - mtime}")
else:
    print("\n   ❌ embeddings_cache.pkl NOT found")

# Check for training logs or output
print("\n2. Training Output:")
print(f"   Current directory: {os.getcwd()}")
print(f"   Files in directory:")
for f in sorted(Path(".").glob("*.pth"), key=lambda x: x.stat().st_mtime, reverse=True)[:5]:
    mtime = datetime.fromtimestamp(f.stat().st_mtime)
    size_mb = f.stat().st_size / (1024**2)
    print(f"      {f.name}: {size_mb:.2f} MB, modified {mtime.strftime('%Y-%m-%d %H:%M:%S')}")

# Check if training is still running
print("\n3. Process Check:")
import subprocess
result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
if "train_model.py" in result.stdout:
    print("   ⚠️  train_model.py process is still running!")
    print("   Training may still be in progress")
else:
    print("   ℹ️  No train_model.py process found")
    print("   Training has completed or was never started")

# Summary
print("\n" + "=" * 60)
print("Summary")
print("=" * 60)

if model_file.exists() and embeddings_file.exists():
    model_size = model_file.stat().st_size / (1024**3)
    emb_size = embeddings_file.stat().st_size / (1024**3)
    
    if model_size > 0.1 and emb_size > 0.1:  # Reasonable sizes
        print("✅ Training appears to have completed!")
        print(f"   Model: {model_size:.2f} GB")
        print(f"   Embeddings: {emb_size:.2f} GB")
        print("\n✅ Ready to use for inference!")
    else:
        print("⚠️  Model files exist but sizes seem wrong")
        print("   Training may have failed or is incomplete")
else:
    print("❌ Model files not found")
    print("   Training either:")
    print("   1. Hasn't started yet")
    print("   2. Is still running (check processes)")
    print("   3. Failed and didn't create files")
    print("   4. Files are in a different directory")
```

## Check Notebook Output

**Look at your notebook cells:**
1. Scroll through the cells you ran
2. Look for the training cell output
3. Check if you see:
   - "Training completed!"
   - "Best model saved to model.pth"
   - Final epoch output with metrics

## Check File System

**Run this to see all files:**

```python
import os
from pathlib import Path

# List all files in current directory
print("Files in current directory:")
for f in sorted(Path(".").iterdir(), key=lambda x: x.stat().st_mtime if x.is_file() else 0, reverse=True):
    if f.is_file():
        size = f.stat().st_size / (1024**2)  # MB
        mtime = datetime.fromtimestamp(f.stat().st_mtime)
        print(f"  {f.name}: {size:.2f} MB, {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
```

## Check Different Locations

**Model might be in different directory:**

```python
import os
from pathlib import Path

# Check common locations
locations = [
    ".",
    "model",
    "models",
    os.path.expanduser("~"),
    os.path.expanduser("~/SageMaker"),
]

print("Searching for model files...")
for loc in locations:
    path = Path(loc)
    if path.exists():
        model_file = path / "model.pth"
        if model_file.exists():
            size_gb = model_file.stat().st_size / (1024**3)
            print(f"✅ Found model.pth at: {model_file}")
            print(f"   Size: {size_gb:.2f} GB")
```

## If Training Didn't Complete

**Check if it's still running:**

```python
import subprocess

# Check for Python processes
result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
lines = result.stdout.split("\n")

print("Python processes:")
for line in lines:
    if "python" in line.lower() and "train" in line.lower():
        print(f"  {line}")
```

**If training is still running:**
- Let it continue
- Check back later
- Files will be created when it finishes

**If training stopped/failed:**
- Check error messages in notebook output
- Restart training
- Check if embeddings were cached (can resume faster)

## Verify Model Works

**If model files exist, test loading:**

```python
import torch

try:
    model = torch.load("model.pth", map_location="cpu")
    print("✅ Model file can be loaded!")
    print(f"   Type: {type(model)}")
    if hasattr(model, "keys"):
        print(f"   Keys: {list(model.keys())[:5]}...")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("   Model file may be corrupted")
```

## Next Steps

**If model exists:**
1. ✅ Upload to S3 (see training guide)
2. ✅ Deploy to SageMaker endpoint
3. ✅ Use for predictions

**If model doesn't exist:**
1. Check if training is still running
2. Check for error messages
3. Restart training if needed

Good luck! 🚀

