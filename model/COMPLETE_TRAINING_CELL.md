# Complete Training Cell - Everything in One Cell

## 🚀 Copy This ENTIRE Cell Into Your SageMaker Notebook

This single cell does EVERYTHING from scratch:
1. ✅ Installs all dependencies
2. ✅ Loads ESM model from Hugging Face (no 403 errors!)
3. ✅ Verifies HINT dataset
4. ✅ Runs complete training pipeline
5. ✅ Saves model.pth and embeddings_cache.pkl

---

## 📋 Single Cell Code (Copy Everything Below)

```python
"""
COMPLETE TRAINING CELL - Run this in a fresh kernel
"""

# ============================================================================
# STEP 1: Install All Dependencies
# ============================================================================
print("=" * 80)
print("STEP 1: Installing Dependencies")
print("=" * 80)

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        __import__(package.split('==')[0].split('>=')[0].split('<=')[0])
        print(f"✅ {package} already installed")
    except ImportError:
        print(f"📦 Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])

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

import os
import torch

# Set device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️  Using device: {device}")

if device == "cuda":
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")

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
    df_sample = pd.read_csv(hint_file, sep='\t', nrows=5)
    print(f"   Columns: {list(df_sample.columns)}")
else:
    print(f"❌ {hint_file} not found!")
    raise FileNotFoundError(f"{hint_file} not found")

print()

# ============================================================================
# STEP 4: Pre-load Hugging Face ESM Model
# ============================================================================
print("=" * 80)
print("STEP 4: Loading ESM Model from Hugging Face")
print("=" * 80)

from transformers import EsmModel, EsmTokenizer

model_name = "facebook/esm2_t33_650M_UR50D"

print(f"📥 Loading {model_name} from Hugging Face...")
print("   This may take a few minutes (downloading ~1.3 GB)...")

try:
    print("   Loading tokenizer...")
    tokenizer = EsmTokenizer.from_pretrained(model_name)
    print("   ✅ Tokenizer loaded")
    
    print("   Loading model...")
    hf_model = EsmModel.from_pretrained(model_name)
    hf_model = hf_model.to(device)
    hf_model.eval()
    print("   ✅ Model loaded and moved to device")
    
    # Test model
    print("   Testing model...")
    test_seq = "MKTAYIAKQRQISFVKSHFSRQ"
    test_tokens = tokenizer(test_seq, return_tensors="pt", padding=True, truncation=True, max_length=1024)
    test_tokens = {k: v.to(device) for k, v in test_tokens.items()}
    
    with torch.no_grad():
        outputs = hf_model(**test_tokens)
        embeddings = outputs.last_hidden_state.mean(dim=1)
    
    print(f"   ✅ Model test successful! Embedding shape: {embeddings.shape}")
    
except Exception as e:
    print(f"   ❌ Error loading model: {e}")
    raise

print()

# ============================================================================
# STEP 5: Verify train_model.py Exists
# ============================================================================
print("=" * 80)
print("STEP 5: Preparing Training Script")
print("=" * 80)

if not Path("train_model.py").exists():
    print("❌ train_model.py not found!")
    raise FileNotFoundError("train_model.py not found")

print("✅ train_model.py found")
print("   The script will automatically use Hugging Face model")
print()

# ============================================================================
# STEP 6: Run Training
# ============================================================================
print("=" * 80)
print("STEP 6: Starting Training")
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
    "cache_dir": os.path.expanduser("~/.cache/torch/hub/checkpoints"),
}

print("Training Configuration:")
for key, value in training_config.items():
    print(f"   {key}: {value}")
print()

print("🚀 Starting training...")
print("   ⏱️  Estimated time: 2-6 hours (depending on GPU)")
print()

# Run training
try:
    train_module.train_model(**training_config)
    print()
    print("=" * 80)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print()
    print("📁 Output files:")
    print("   - model.pth")
    print("   - embeddings_cache.pkl")
    print()
except Exception as e:
    print()
    print("=" * 80)
    print("❌ TRAINING FAILED")
    print("=" * 80)
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    raise
```

---

## 🎯 How to Use

1. **Open your SageMaker notebook**
2. **Create a new cell**
3. **Copy the ENTIRE code block above** (everything between the ```python markers)
4. **Paste into the cell**
5. **Run the cell**
6. **Wait 2-6 hours** (depending on GPU)
7. **Done!** You'll have `model.pth` and `embeddings_cache.pkl`

## ✅ What This Does

- ✅ **Installs everything**: torch, transformers, fair-esm, pandas, etc.
- ✅ **Uses Hugging Face**: No more 403 errors! Loads ESM from Hugging Face
- ✅ **Verifies dataset**: Checks that HINT file exists
- ✅ **Runs training**: Complete pipeline from start to finish
- ✅ **Saves model**: Creates model.pth and embeddings_cache.pkl

## 🔧 Customization

You can modify these parameters in the cell:

```python
training_config = {
    "num_epochs": 10,        # Change to 5 for faster training, 20 for better results
    "batch_size": 32,        # Increase if you have more GPU memory
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

## 📊 Expected Output

You should see:
1. Dependencies installing
2. Environment setup
3. Dataset verification
4. Model loading from Hugging Face
5. Training progress (epochs, loss, accuracy)
6. Final model saved to `model.pth`

## 🎉 Success!

When training completes, you'll see:
```
✅ TRAINING COMPLETED SUCCESSFULLY!
📁 Output files:
   - model.pth
   - embeddings_cache.pkl
```

Then you can:
1. Upload `model.pth` to S3
2. Deploy to SageMaker endpoint
3. Use for PPI predictions!

Good luck! 🚀

