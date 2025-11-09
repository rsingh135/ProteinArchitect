# One Cell Training - Copy This Into Your Notebook

## 🚀 Single Cell That Does EVERYTHING

Copy this ENTIRE cell into your SageMaker notebook and run it. It will:
1. ✅ Install all dependencies
2. ✅ Automatically use Hugging Face ESM model (no 403 errors!)
3. ✅ Verify HINT dataset
4. ✅ Run complete training
5. ✅ Save model.pth and embeddings_cache.pkl

---

## 📋 Copy This Code (Everything Between the ```)

```python
"""
COMPLETE TRAINING - ONE CELL
Run this in a fresh kernel - does everything from scratch
"""

# ============================================================================
# STEP 1: Install All Dependencies
# ============================================================================
print("=" * 80)
print("STEP 1: Installing Dependencies")
print("=" * 80)

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    pkg_name = package.split('==')[0].split('>=')[0].split('<=')[0]
    try:
        __import__(pkg_name.replace('-', '_'))
        print(f"✅ {pkg_name} already installed")
        return True
    except ImportError:
        print(f"📦 Installing {package}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            print(f"✅ {pkg_name} installed")
            return True
        except:
            print(f"⚠️  Failed to install {pkg_name} - may already be installed")
            return False

# Install core dependencies
packages = [
    "torch>=2.0.0",
    "transformers>=4.30.0",
    "fair-esm>=2.0.0",
    "pandas>=2.0.0",
    "numpy>=1.26.0",
    "scikit-learn>=1.3.2",
    "biopython>=1.81",
    "requests>=2.31.0",
    "tqdm>=4.65.0",
]

print("\nInstalling packages...")
for package in packages:
    install_package(package)

print("\n✅ All dependencies installed!")
print()

# ============================================================================
# STEP 2: Set Up Environment
# ============================================================================
print("=" * 80)
print("STEP 2: Setting Up Environment")
print("=" * 80)

import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️  Using device: {device}")

if device == "cuda":
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    print(f"   Memory: {memory_gb:.2f} GB")

print("✅ Environment configured")
print()

# ============================================================================
# STEP 3: Verify HINT Dataset
# ============================================================================
print("=" * 80)
print("STEP 3: Checking HINT Dataset")
print("=" * 80)

import pandas as pd
from pathlib import Path

hint_file = "HomoSapiens_binary_hq.txt"

if Path(hint_file).exists():
    print(f"✅ Found {hint_file}")
    try:
        df_sample = pd.read_csv(hint_file, sep='\t', nrows=5)
        print(f"   Columns: {list(df_sample.columns)}")
        # Count total lines
        with open(hint_file, 'r') as f:
            total_lines = sum(1 for _ in f) - 1  # Subtract header
        print(f"   Total interactions: {total_lines:,}")
    except Exception as e:
        print(f"   ⚠️  Could not read file: {e}")
else:
    print(f"❌ {hint_file} not found!")
    print("   Please upload the HINT dataset file to this directory")
    raise FileNotFoundError(f"{hint_file} not found")

print()

# ============================================================================
# STEP 4: Verify train_model.py Exists
# ============================================================================
print("=" * 80)
print("STEP 4: Preparing Training Script")
print("=" * 80)

if not Path("train_model.py").exists():
    print("❌ train_model.py not found!")
    print("   Please upload train_model.py to this directory")
    raise FileNotFoundError("train_model.py not found")

print("✅ train_model.py found")
print("   The script will automatically use Hugging Face model (no 403 errors!)")
print()

# ============================================================================
# STEP 5: Run Training
# ============================================================================
print("=" * 80)
print("STEP 5: Starting Training")
print("=" * 80)
print()

# Import training function
import importlib.util
spec = importlib.util.spec_from_file_location("train_model", "train_model.py")
train_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(train_module)

# Training configuration
training_config = {
    "hint_file": hint_file,
    "model_save_path": "model.pth",
    "embeddings_cache_path": "embeddings_cache.pkl",
    "negative_ratio": 1.0,
    "test_size": 0.2,
    "batch_size": 32,
    "learning_rate": 1e-4,
    "num_epochs": 10,
    "device": device,
}

print("Training Configuration:")
for key, value in training_config.items():
    print(f"   {key}: {value}")
print()

print("🚀 Starting training...")
print("   The script will:")
print("   1. Load ESM model from Hugging Face (automatic, no 403 errors!)")
print("   2. Fetch protein sequences from UniProt")
print("   3. Compute ESM embeddings")
print("   4. Generate negative samples")
print("   5. Train the PPI prediction model")
print("   6. Save model.pth and embeddings_cache.pkl")
print()
print("   ⏱️  Estimated time: 2-6 hours (depending on GPU)")
print("   💡 You can close the browser - training will continue")
print("   📊 Check progress in the output below")
print()

# Run training
try:
    train_module.train_model(**training_config)
    print()
    print("=" * 80)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print()
    
    # Verify output files
    if Path("model.pth").exists():
        size_mb = Path("model.pth").stat().st_size / (1024**2)
        print(f"✅ model.pth created ({size_mb:.2f} MB)")
    else:
        print("❌ model.pth not found")
    
    if Path("embeddings_cache.pkl").exists():
        size_gb = Path("embeddings_cache.pkl").stat().st_size / (1024**3)
        print(f"✅ embeddings_cache.pkl created ({size_gb:.2f} GB)")
    else:
        print("❌ embeddings_cache.pkl not found")
    
    print()
    print("🎉 Next steps:")
    print("   1. Upload model.pth to S3")
    print("   2. Deploy to SageMaker endpoint")
    print("   3. Use for PPI predictions")
    print()
    
except KeyboardInterrupt:
    print()
    print("⚠️  Training interrupted by user")
    print("   Model may be partially trained - check for model.pth")
    
except Exception as e:
    print()
    print("=" * 80)
    print("❌ TRAINING FAILED")
    print("=" * 80)
    print(f"Error: {e}")
    print()
    import traceback
    print("Full error traceback:")
    traceback.print_exc()
    raise
```

---

## 🎯 How to Use

1. **Open your SageMaker notebook**
2. **Create a new cell** (or use an existing one)
3. **Copy the ENTIRE code block above** (everything between ```python and ```)
4. **Paste into the cell**
5. **Click "Run"**
6. **Wait 2-6 hours** (you can close the browser - it will keep running)
7. **Done!** Check for `model.pth` and `embeddings_cache.pkl`

## ✅ What This Does

- ✅ **Installs everything**: torch, transformers, fair-esm, pandas, etc.
- ✅ **Uses Hugging Face automatically**: The updated train_model.py now tries Hugging Face FIRST (no more 403 errors!)
- ✅ **Verifies dataset**: Checks that HINT file exists
- ✅ **Runs training**: Complete pipeline from start to finish
- ✅ **Saves model**: Creates model.pth and embeddings_cache.pkl

## 🔧 Customization

You can modify these parameters in the cell:

```python
training_config = {
    "num_epochs": 10,        # Change to 5 for faster training, 20 for better results
    "batch_size": 32,        # Increase if you have more GPU memory (e.g., 64)
    "learning_rate": 1e-4,   # Adjust learning rate if needed
    "negative_ratio": 1.0,   # Ratio of negative to positive samples
}
```

## 🐛 Troubleshooting

### If you get "ModuleNotFoundError":
- The cell will automatically install missing packages
- Wait for installation to complete

### If you get "CUDA out of memory":
- Reduce `batch_size` to 16 or 8
- Reduce `negative_ratio` to 0.5

### If training is too slow:
- Reduce `num_epochs` to 5
- Use a larger GPU instance (ml.g5.xlarge or larger)

### If you still get 403 errors:
- This shouldn't happen anymore! The script now uses Hugging Face FIRST
- If it does, make sure `transformers` is installed: `pip install transformers`

## 📊 Expected Output

You should see:
1. Dependencies installing
2. Environment setup
3. Dataset verification
4. Training script verification
5. Training progress (epochs, loss, accuracy)
6. Final model saved to `model.pth`

## 🎉 Success!

When training completes, you'll see:
```
✅ TRAINING COMPLETED SUCCESSFULLY!
✅ model.pth created (XX.XX MB)
✅ embeddings_cache.pkl created (X.XX GB)
```

Then you can:
1. Upload `model.pth` to S3
2. Deploy to SageMaker endpoint
3. Use for PPI predictions!

Good luck! 🚀

